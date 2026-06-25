-- Separate short URL /court/court-1 (dev sandbox) from production Eastbourne court.
-- Production: /court/padel4all/eastbourne/1 → c0000000-0000-0000-0000-000000000001
-- Dev/test:    /court/court-1              → d0000000-0000-0000-0000-000000000001

INSERT INTO venues (id, company_id, name, slug, timezone)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'bd60fe2b-b102-436a-ba0d-ce85deb3805a',
  'Dev',
  'dev',
  'Europe/London'
)
ON CONFLICT (id) DO NOTHING;

UPDATE courts
SET slug = 'padel4all-eastbourne-1'
WHERE id = 'c0000000-0000-0000-0000-000000000001'
  AND slug = 'court-1';

INSERT INTO courts (id, venue_id, name, court_number, slug, is_show_court)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Dev Court 1',
  1,
  'court-1',
  false
)
ON CONFLICT (id) DO NOTHING;
