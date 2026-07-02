-- Move pairing codes out of the publicly readable venue_screens row.
-- Displays subscribe via anon SELECT + Realtime; secrets are edge-function only.

CREATE TABLE IF NOT EXISTS public.venue_screen_secrets (
  screen_id uuid PRIMARY KEY REFERENCES public.venue_screens (id) ON DELETE CASCADE,
  pairing_code text NOT NULL,
  CONSTRAINT venue_screen_secrets_pairing_code_key UNIQUE (pairing_code)
);

COMMENT ON TABLE public.venue_screen_secrets IS
  'Staff write secrets for venue screens — no anon/authenticated access.';

INSERT INTO public.venue_screen_secrets (screen_id, pairing_code)
SELECT id, pairing_code
FROM public.venue_screens
WHERE pairing_code IS NOT NULL
ON CONFLICT (screen_id) DO NOTHING;

ALTER TABLE public.venue_screens DROP COLUMN IF EXISTS pairing_code;

-- Secrets table: service role only (no RLS policies = deny all except service role)
ALTER TABLE public.venue_screen_secrets ENABLE ROW LEVEL SECURITY;
