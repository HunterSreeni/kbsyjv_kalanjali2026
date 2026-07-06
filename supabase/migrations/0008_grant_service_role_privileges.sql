-- 0001's grants only covered anon/authenticated - service_role (used by the
-- submit-registration Edge Function) had no table privileges at all, so every
-- registration submission failed with "permission denied for table games"
-- regardless of RLS (service_role bypasses RLS but still needs GRANTs).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
