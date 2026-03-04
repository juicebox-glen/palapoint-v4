-- Ensure started_at has no default - it should be NULL at match creation
-- and set on first FLIC button press (score API acknowledge)
-- DROP DEFAULT is safe even if column has no default
ALTER TABLE live_matches ALTER COLUMN started_at DROP DEFAULT;
