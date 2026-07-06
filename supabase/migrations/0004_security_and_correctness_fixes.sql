-- Fixes from the 2026-07-06 audit.

-- SEVERE #1 + HIGH #3: public inserts into registrations/participants used to allow
-- setting status='confirmed' directly, and participants could be attached to any
-- existing registration_id. All public registration now goes through the
-- submit-registration Edge Function (service role, bypasses RLS), so the direct
-- anon/authenticated insert policies are removed entirely.
drop policy if exists "registrations_public_insert" on public.registrations;
drop policy if exists "participants_public_insert" on public.participants;

-- MEDIUM #4: cap scores at a sane upper bound (was >= 0 with no ceiling).
alter table public.scores drop constraint scores_score_check;
alter table public.scores add constraint scores_score_check check (score >= 0 and score <= 100);

-- MEDIUM #5: admin "override" was just another averaged row in `scores`, not a real
-- override. Give registrations a dedicated override field that supersedes the
-- judge-score average when set.
alter table public.registrations
  add column override_score numeric check (override_score is null or (override_score >= 0 and override_score <= 100)),
  add column override_note text;

drop view public.leaderboard;
create view public.leaderboard as
select
  r.id as registration_id,
  r.game_id,
  g.name as game_name,
  r.age_category_id,
  ac.name as age_category_name,
  r.team_name,
  coalesce(r.override_score, avg(s.score), 0) as avg_score,
  count(s.id) as score_count,
  (r.override_score is not null) as is_override,
  rank() over (
    partition by r.game_id, r.age_category_id
    order by coalesce(r.override_score, avg(s.score), 0) desc
  ) as rank
from public.registrations r
join public.games g on g.id = r.game_id
join public.age_categories ac on ac.id = r.age_category_id
left join public.scores s on s.registration_id = r.id
where r.status = 'confirmed'
group by r.id, r.game_id, g.name, r.age_category_id, ac.name, r.team_name, r.override_score;

grant select on public.leaderboard to anon, authenticated;

-- LOW #10: judge could still edit a score after being unassigned or after the
-- registration left 'confirmed' status - re-check both on UPDATE, not just ownership.
drop policy if exists "scores_judge_update_own" on public.scores;
create policy "scores_judge_update_own" on public.scores
  for update using (
    judge_id = auth.uid()
    and public.get_my_role() = 'judge'
    and registration_id in (
      select r.id from public.registrations r
      where r.status = 'confirmed'
        and r.game_id in (select public.get_my_assigned_game_ids())
    )
  )
  with check (judge_id = auth.uid());

-- LOW #9: updated_at was set only at insert time and never touched again.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scores_set_updated_at
  before update on public.scores
  for each row execute function public.set_updated_at();
