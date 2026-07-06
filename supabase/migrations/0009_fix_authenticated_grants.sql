-- 0001's grants only covered the public-facing minimum (anon/authenticated
-- SELECT on games/age_categories, SELECT+INSERT on registrations/participants).
-- This silently blocked every admin write path that RLS otherwise allows:
-- Approve/Reject (registrations UPDATE), Games CRUD (games INSERT/UPDATE/DELETE),
-- and Admin score overrides (registrations UPDATE) all 403'd with "permission
-- denied" regardless of RLS policy, because GRANTs are checked before RLS.
grant insert, update, delete on public.games to authenticated;
grant insert, update, delete on public.age_categories to authenticated;
grant update, delete on public.registrations to authenticated;
grant update, delete on public.participants to authenticated;
