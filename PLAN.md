# Kalanjali 2026 - Registration, Scoring & Leaderboard Website

Status: MVP implemented and deployed to Supabase (schema, RLS, Edge Function). Pending: real games/age-category list from client, Netlify connection. Google SSO dropped by decision (2026-07-06) - see section 1.

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React + TypeScript | Static SPA output, no server needed, fast build, deploys cleanly to Netlify |
| Styling/UI | Tailwind CSS + shadcn/ui | Fast to build admin/judge dashboards + public forms |
| Routing | React Router | Standard SPA routing |
| Data fetching | @supabase/supabase-js v2 + TanStack Query | Caching, optimistic updates for admin/judge actions |
| Forms | react-hook-form + zod | Registration form validation (age vs category, required fields) |
| Backend | Supabase (Postgres + Auth + Realtime) | Already provisioned (`kalanjali2026` project, ACTIVE_HEALTHY, empty) |
| Auth | Supabase Auth, email/password only | Admin + Judge accounts created manually (Supabase Dashboard + Admin > Judges), invite-only, no self-serve signup. Public registration needs no login. Google SSO was considered and dropped (2026-07-06) - not a client requirement, just extra complexity not worth it for a handful of accounts on a one-time event. |
| Live leaderboard | Supabase Realtime (Postgres changes) on a `leaderboard` view | No polling infra needed |
| Hosting | Netlify | Static build (`dist`), SPA redirect rule, env vars for Supabase URL/anon key |
| Repo | GitHub - `git@github.com:HunterSreeni/kbsyjv_kalanjali2026.git` | CI: Netlify auto-deploys on push to main |
| Bot check (public form) | Cloudflare Turnstile + honeypot field | Free, unlimited, no Google account needed; keeps the custom Supabase-backed form instead of a real Google Form |

The SPA talks directly to Supabase for everything except public registration, with Row Level Security (RLS) enforcing who can read/write what. Registration goes through one Edge Function (`submit-registration`) instead of a direct insert, because Turnstile verification and forcing `status='pending'` require a server-side check that the client can never be trusted to enforce on itself (see the 2026-07-06 security audit). No Capacitor/mobile - this is web-only per the requirement.

### Netlify setup needed
- `netlify.toml` with build command `npm run build`, publish dir `dist`, and SPA fallback: `/* -> /index.html 200`
- Env vars in Netlify dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public/anon key only, never the service key)
- Nothing else required on Netlify's side beyond connecting the GitHub repo once it exists

### Google SSO - dropped
Considered for Admin/Judge login, dropped on 2026-07-06 (Sreeni's own idea originally, not a client requirement - not worth the added complexity for a small, invite-only set of accounts). Email/password is the permanent login method, not a stand-in.

## 2. Roles & Access Model

| Role | Login | Access |
|---|---|---|
| Public / Participant | None | Public site: view games, register (form only, no account), view live leaderboard |
| Judge | Email/password (invite-only) | Only registrations for their assigned game(s); enter/edit their own scores |
| Admin | Email/password (invite-only) | Everything: registrations, games, judges, scores, leaderboard controls |

After login, the app checks a `profiles` table for the user's role. If no row exists (not created by Admin), access is denied with a "not authorized" message - having a login alone grants nothing.

## 3. Data Model (Postgres / Supabase)

- `games` - id, name, slug, description, is_team_event (bool), min_team_size, max_team_size, is_active, gender_restriction (male/female/any - enforced server-side in the registration Edge Function, not just the RLS layer)
- `age_categories` - id, name (Kids / Teens / Youth / 40+), min_age, max_age  (fixed, seeded once, same set applies to every game)
- `registrations` - id, game_id, age_category_id, team_name (nullable, used when is_team_event), contact_name, contact_phone, contact_email, status (pending/confirmed/rejected), created_at
- `participants` - id, registration_id, full_name, age, gender (optional) - one row per person; 1 row for individual events, N rows for team events
- `profiles` - id (= auth.users.id), full_name, role (admin/judge)
- `judge_assignments` - id, judge_profile_id, game_id - which game(s) a judge can score
- `scores` - id, registration_id, judge_id, score, remarks, created_at, updated_at - one score per judge per registration (admin can override/add a final score)
- `leaderboard` (view) - ranks registrations within game + age_category by aggregated score, public-readable, drives the live leaderboard page

### RLS summary
- `games`, `age_categories`, `leaderboard` view: public read
- `registrations`, `participants`: public INSERT only (anon can register, cannot read others' data); admin/judge full read; admin can update status
- `scores`: judge can insert/update only their own rows, only for registrations in games they're assigned to; admin full access

## 4. Sample Games & Age Categories (MVP placeholders only - NOT the real client list, see OPEN_QUESTIONS.md)

Games: Cricket (team), Shuttlecock/Badminton, Kolam, Dance (team or solo - team flag configurable per registration), Singing, Essay Writing (individual)

Age categories (fixed, applied uniformly to every game) - reference cutoffs only, actual cutoffs pending client confirmation post-MVP:
- Kids: 5-12
- Teens: 13-19
- Youth: 20-40
- 40+ (Adults): 40 and above

Both the games list and these cutoffs are built to be swapped out via the `games` and `age_categories` tables/admin UI once the real client list arrives - no schema change needed, just data.

## 5. Site Map

### Public (no login)
- `/` - Landing page: event info, dates, venue, theme
- `/games` - Games list with description + age categories per game
- `/register` - Registration form: pick game -> age category -> (if team event) team name + member list -> contact info -> submit -> confirmation with reference ID
- `/leaderboard` - Live leaderboard, filterable by game and age category, real-time updates

### Admin (`/admin`, email/password + role=admin)
- Dashboard: counts (total registrations, pending approvals, per game)
- Registrations: list/search/filter, approve/reject, edit, export CSV
- Games: CRUD games list, toggle active/inactive
- Judges: invite/allowlist judge emails, assign judges to games
- Scores: view all scores across all judges, override/finalize
- Leaderboard controls: recompute/publish

### Judge (`/judge`, email/password + role=judge)
- List of registrations for their assigned game(s)
- Score entry form per registration (score + remarks), editable until locked by admin

## 6. Decisions made
- Bot check on public registration form: Cloudflare Turnstile + honeypot field (free, no Google account needed)
- Registrations require Admin approval before being confirmed (status: pending -> confirmed/rejected)
- Admin/judge login: Supabase email/password, permanently - Google SSO dropped (2026-07-06)

## 7. Open items - see OPEN_QUESTIONS.md
Games list, exact age category cutoffs, and any remaining client-facing questions are tracked there, not here.

## 8. Next Steps (after this plan is approved)
1. Scaffold Vite + React + TS + Tailwind app in this folder, connect to `git@github.com:HunterSreeni/kbsyjv_kalanjali2026.git`
2. Write Postgres schema + RLS migrations, apply to `kalanjali2026` Supabase project (seeded with sample games/age categories)
3. Build public pages (games, register with Turnstile, leaderboard)
4. Build admin + judge dashboards (email/password auth, permanent)
5. `netlify.toml` + connect Netlify to the GitHub repo
6. Later: swap in real games/age categories once client confirms
