# Kalanjali 2026 - Open Questions (pending client / final confirmation)

These are the items that use MVP placeholders and must be revisited before launch. Nothing here blocks starting the build - the schema and UI are designed so these can be swapped in as data, not code changes.

## 1. Games list
Currently using a sample list for MVP build/testing only:
- Cricket (team)
- Shuttlecock / Badminton
- Kolam
- Dance (team or solo)
- Singing
- Essay Writing

Gender restriction added 2026-07-06 (Sreeni's call, reference only): Cricket = male only, Dance = female only, Kolam = female only, everything else open to any gender.

**Needed from client**: the real event/games list for Kalanjali 2026, including for each game:
- Team or individual event
- If team: min/max team size
- Which age categories it's open to (currently assuming all 4 categories apply to every game - confirm if some games should exclude certain age groups)
- Gender restriction per game (male only / female only / open) - confirm the above assignments are actually correct for the real lineup

## 2. Age category cutoffs
Currently using reference-only cutoffs given by Sreeni for MVP build:
- Kids: 5-12
- Teens: 13-19
- Youth: 20-40
- 40+ (Adults): 40 and above

**Needed from client**: confirmed final cutoffs before go-live. (Note: this is only 4 categories, not the original 5 discussed - "30+" was dropped in favor of Youth covering 20-40. Flag if a separate 30+ bracket is actually wanted.)

## 3. Registration approval workflow
**Decided**: registrations require Admin approval (pending -> confirmed/rejected) before being treated as confirmed entries. Documented in PLAN.md section 6.

Still open: what should participants/public see for a "pending" registration - nothing, or a "submitted, awaiting confirmation" message? Assuming the latter unless told otherwise.

## 4. Admin/Judge auth
**Decided (2026-07-06)**: Supabase email/password login, permanently. Google SSO was dropped - it was Sreeni's own idea, not a client requirement, and added complexity not worth it for a small invite-only set of accounts.
