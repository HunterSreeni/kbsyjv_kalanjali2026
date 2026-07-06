-- Some games are restricted to one gender (e.g. Cricket/Dance = male-only,
-- Kolam = female-only per Sreeni); others stay open to everyone.
alter table public.games
  add column gender_restriction text not null default 'any'
    check (gender_restriction in ('male', 'female', 'any'));

update public.games set gender_restriction = 'male' where slug in ('cricket', 'dance');
update public.games set gender_restriction = 'female' where slug = 'kolam';
