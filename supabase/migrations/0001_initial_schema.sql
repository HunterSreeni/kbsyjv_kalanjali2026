-- Kalanjali 2026 - initial schema, RLS, and helper functions
create extension if not exists pgcrypto;

-- ========== Tables ==========

create table public.age_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_age int not null,
  max_age int, -- null = no upper bound (e.g. 40+)
  sort_order int not null default 0
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_team_event boolean not null default false,
  min_team_size int,
  max_team_size int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id),
  age_category_id uuid not null references public.age_categories(id),
  team_name text,
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  reference_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  full_name text not null,
  age int not null,
  gender text,
  is_captain boolean not null default false
);

-- Extends auth.users with app role. Row is created manually by Admin
-- (see README: admin/judge accounts are invite-only, not self-serve).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('admin', 'judge')),
  created_at timestamptz not null default now()
);

create table public.judge_assignments (
  id uuid primary key default gen_random_uuid(),
  judge_profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  unique (judge_profile_id, game_id)
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null check (score >= 0),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id, judge_id)
);

-- ========== Leaderboard view ==========
-- Only confirmed registrations are ranked; pending/rejected never appear publicly.
create view public.leaderboard as
select
  r.id as registration_id,
  r.game_id,
  g.name as game_name,
  r.age_category_id,
  ac.name as age_category_name,
  r.team_name,
  coalesce(avg(s.score), 0) as avg_score,
  count(s.id) as score_count,
  rank() over (
    partition by r.game_id, r.age_category_id
    order by coalesce(avg(s.score), 0) desc
  ) as rank
from public.registrations r
join public.games g on g.id = r.game_id
join public.age_categories ac on ac.id = r.age_category_id
left join public.scores s on s.registration_id = r.id
where r.status = 'confirmed'
group by r.id, r.game_id, g.name, r.age_category_id, ac.name, r.team_name;

-- ========== Helper functions (SECURITY DEFINER to avoid RLS recursion) ==========

create function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.get_my_assigned_game_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select game_id from public.judge_assignments where judge_profile_id = auth.uid();
$$;

-- Used by the Admin "add judge" flow to resolve an existing auth user by email
-- (judge logins are created by Admin in the Supabase Dashboard first).
create function public.get_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer
stable
set search_path = public, auth
as $$
  select id from auth.users where email = lookup_email limit 1;
$$;

-- ========== RLS ==========
alter table public.age_categories enable row level security;
alter table public.games enable row level security;
alter table public.registrations enable row level security;
alter table public.participants enable row level security;
alter table public.profiles enable row level security;
alter table public.judge_assignments enable row level security;
alter table public.scores enable row level security;

-- age_categories: public read, admin write
create policy "age_categories_public_read" on public.age_categories
  for select using (true);
create policy "age_categories_admin_write" on public.age_categories
  for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- games: public read of active games, admin/judge see all, admin writes
create policy "games_public_read" on public.games
  for select using (is_active = true or public.get_my_role() in ('admin', 'judge'));
create policy "games_admin_write" on public.games
  for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- registrations: public can insert only; admin full read/write; judge reads confirmed
-- registrations for their assigned games only
create policy "registrations_public_insert" on public.registrations
  for insert to anon, authenticated with check (true);
create policy "registrations_admin_all" on public.registrations
  for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');
create policy "registrations_judge_read" on public.registrations
  for select using (
    public.get_my_role() = 'judge'
    and status = 'confirmed'
    and game_id in (select public.get_my_assigned_game_ids())
  );

-- participants: public can insert only; admin full access; judge reads participants
-- of registrations they can see
create policy "participants_public_insert" on public.participants
  for insert to anon, authenticated with check (true);
create policy "participants_admin_all" on public.participants
  for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');
create policy "participants_judge_read" on public.participants
  for select using (
    public.get_my_role() = 'judge'
    and exists (
      select 1 from public.registrations r
      where r.id = participants.registration_id
        and r.status = 'confirmed'
        and r.game_id in (select public.get_my_assigned_game_ids())
    )
  );

-- profiles: user reads own row; admin full access
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- judge_assignments: judge reads own assignments; admin full access
create policy "judge_assignments_self_read" on public.judge_assignments
  for select using (judge_profile_id = auth.uid());
create policy "judge_assignments_admin_all" on public.judge_assignments
  for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- scores: judge manages own scores for assigned+confirmed registrations; admin full access
create policy "scores_judge_read_own" on public.scores
  for select using (judge_id = auth.uid());
create policy "scores_admin_read_all" on public.scores
  for select using (public.get_my_role() = 'admin');
create policy "scores_judge_insert_own" on public.scores
  for insert to authenticated with check (
    judge_id = auth.uid()
    and public.get_my_role() = 'judge'
    and registration_id in (
      select r.id from public.registrations r
      where r.status = 'confirmed'
        and r.game_id in (select public.get_my_assigned_game_ids())
    )
  );
create policy "scores_judge_update_own" on public.scores
  for update using (judge_id = auth.uid() and public.get_my_role() = 'judge')
  with check (judge_id = auth.uid());
create policy "scores_admin_write" on public.scores
  for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- ========== Grants ==========
-- RLS policies above govern row-level access; these grants are the baseline
-- table/view-level access PostgREST needs to even attempt a query.
grant usage on schema public to anon, authenticated;
grant select on public.age_categories, public.games, public.leaderboard to anon, authenticated;
grant select, insert on public.registrations, public.participants to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.judge_assignments, public.scores to authenticated;
