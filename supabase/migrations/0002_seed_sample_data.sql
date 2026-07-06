-- MVP placeholder data only - NOT the real client list.
-- See OPEN_QUESTIONS.md. Swap via Admin > Games / this table once confirmed.

insert into public.age_categories (name, min_age, max_age, sort_order) values
  ('Kids', 5, 12, 1),
  ('Teens', 13, 19, 2),
  ('Youth', 20, 40, 3),
  ('40+ (Adults)', 40, null, 4);

insert into public.games (name, slug, description, is_team_event, min_team_size, max_team_size) values
  ('Cricket', 'cricket', 'Sample placeholder game.', true, 6, 11),
  ('Shuttlecock / Badminton', 'shuttlecock', 'Sample placeholder game.', false, null, null),
  ('Kolam', 'kolam', 'Sample placeholder game.', false, null, null),
  ('Dance', 'dance', 'Sample placeholder game - team or solo.', true, 1, 15),
  ('Singing', 'singing', 'Sample placeholder game.', false, null, null),
  ('Essay Writing', 'essay-writing', 'Sample placeholder game.', false, null, null);
