# Kalanjali 2026

Registration, event coordination, score tabulation, and live leaderboard for Kalanjali 2026 (Yuvajana Vibhagam).

See `PLAN.md` for the full tech stack/design and `OPEN_QUESTIONS.md` for what's still placeholder (games list, age category cutoffs).

## Stack

Vite + React + TypeScript + Tailwind, talking directly to Supabase (Postgres + Auth + Realtime) with Row Level Security. Public registration goes through one Supabase Edge Function (`submit-registration`) rather than a direct table insert - it verifies the Turnstile token server-side and enforces status/team-size/age rules that must never be trusted to the client. No other backend server. Hosted on Netlify.

## Local setup

1. `npm install`
2. `.env.local` is already set up for the `kalanjali2026` Supabase project (not committed). If missing, copy `.env.example` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from the Supabase dashboard, and `VITE_TURNSTILE_SITE_KEY` (Cloudflare Turnstile test key `1x00000000000000000000AA` always passes, useful for local dev).
3. `npm run dev`

## Admin login

Admin/Judge accounts are invite-only, not self-serve signup, and email/password is the permanent login method (no Google SSO - considered and dropped, see `PLAN.md`).

A bootstrap Admin account already exists (created directly in Supabase Auth) - credentials were shared in chat when it was created, not stored in this repo. Log in at `/login`.

To add more Admin accounts later:
1. In the Supabase Dashboard for the `kalanjali2026` project: **Authentication > Users > Add User**, create the email/password login.
2. Run this SQL in the Supabase SQL Editor to grant the admin role (replace the email):

   ```sql
   insert into public.profiles (id, full_name, role)
   select id, 'Their Name', 'admin' from auth.users where email = 'someone@example.com';
   ```

Judges are added the same way (Dashboard creates their login), then invited from **Admin > Judges** in the app using their email - that page looks up the existing auth user and assigns the `judge` role + games.

## Deployment (Netlify)

- Connect the GitHub repo, build command and publish directory are already set in `netlify.toml`.
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_TURNSTILE_SITE_KEY` as environment variables in the Netlify site settings (use your real Turnstile site key for production, not the test key).

## Database migrations

SQL migrations live in `supabase/migrations/` for history. They've already been applied to the live `kalanjali2026` project via the Supabase MCP tooling - this folder is a record, not something you need to run manually unless rebuilding a new project.

## Edge Function secrets

The `submit-registration` function (in `supabase/functions/submit-registration/`) has already been deployed. It currently falls back to Cloudflare's public "always passes" test secret key when `TURNSTILE_SECRET_KEY` isn't set - fine for local testing, **not fine for production**. Before go-live, once you have a real Turnstile account:

```
supabase secrets set TURNSTILE_SECRET_KEY=your-real-secret-key --project-ref ztiblctokuzznpfvgxve
```

## Before go-live checklist (Supabase Dashboard settings, not code)

- Swap the Turnstile test site/secret key pair for real ones (see above).
- Authentication > Providers > Email: consider disabling "Allow new users to sign up" - this app's admin/judge accounts are invite-only and don't use public signup, so leaving it on just lets strangers create unused Auth accounts against your project.
- Authentication > Policies: review/raise the minimum password requirements for the email/password logins.
- Change the bootstrap Admin password from its initial value once you're done with initial testing.
