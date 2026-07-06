-- Needed so the public Leaderboard page can subscribe to live score/status changes.
alter publication supabase_realtime add table public.scores;
alter publication supabase_realtime add table public.registrations;
