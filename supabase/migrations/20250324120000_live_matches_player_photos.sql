-- Optional public URLs for player headshots captured at match setup
ALTER TABLE public.live_matches
  ADD COLUMN IF NOT EXISTS team_a_player_1_photo text,
  ADD COLUMN IF NOT EXISTS team_a_player_2_photo text,
  ADD COLUMN IF NOT EXISTS team_b_player_1_photo text,
  ADD COLUMN IF NOT EXISTS team_b_player_2_photo text;
