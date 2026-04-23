-- Matchplay player profile photos (TV board + setup)
ALTER TABLE matchplay_players
  ADD COLUMN IF NOT EXISTS photo_url TEXT;
