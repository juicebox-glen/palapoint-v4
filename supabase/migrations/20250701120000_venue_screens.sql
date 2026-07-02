-- PalaPoint Live: venue screen orchestration model
--
-- One row per permanent TV URL (/screen/[screenSlug]).
-- Staff controller writes via edge function (service role); displays subscribe via Realtime.
--
-- court_id is internal plumbing for branding + showcase scoring (useLiveMatch, ControlPanel,
-- score/match edge functions). Not exposed in user-facing URLs or copy.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.venue_screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Public identifiers (used in /screen/[screenSlug] and /staff/[venueSlug] resolution)
  screen_slug text NOT NULL,
  venue_slug text NOT NULL,
  company_slug text NOT NULL,
  display_name text NOT NULL,

  -- Internal scoring/branding context — FK to courts, never shown to venue staff as "court"
  court_id uuid REFERENCES public.courts (id) ON DELETE SET NULL,

  -- Staff write auth for edge function (not a user account — shared venue secret)
  pairing_code text NOT NULL,

  -- What the display should render right now
  active_mode text NOT NULL DEFAULT 'idle'
    CHECK (active_mode IN ('idle', 'social_night', 'showcase_game')),

  active_matchplay_event_id uuid REFERENCES public.matchplay_events (id) ON DELETE SET NULL,
  active_showcase_match_id uuid REFERENCES public.live_matches (id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT venue_screens_screen_slug_key UNIQUE (screen_slug),
  CONSTRAINT venue_screens_pairing_code_key UNIQUE (pairing_code)
);

COMMENT ON TABLE public.venue_screens IS
  'PalaPoint Live venue display state — one permanent URL per screen, staff-driven mode switching.';

COMMENT ON COLUMN public.venue_screens.court_id IS
  'Internal backing court for branding resolution and showcase match scoring. Not user-facing.';

COMMENT ON COLUMN public.venue_screens.pairing_code IS
  'Shared secret for staff controller writes via screen edge function. Rotate per venue trial.';

-- Lookups
CREATE INDEX IF NOT EXISTS venue_screens_venue_slug_idx
  ON public.venue_screens (venue_slug);

CREATE INDEX IF NOT EXISTS venue_screens_court_id_idx
  ON public.venue_screens (court_id)
  WHERE court_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_venue_screens_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS venue_screens_set_updated_at ON public.venue_screens;

CREATE TRIGGER venue_screens_set_updated_at
  BEFORE UPDATE ON public.venue_screens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_venue_screens_updated_at();

-- ---------------------------------------------------------------------------
-- Realtime (required for /screen live mode switching without refresh)
-- ---------------------------------------------------------------------------

ALTER TABLE public.venue_screens REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'venue_screens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.venue_screens;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS — read-only for anon/authenticated; writes via service role edge function only
-- ---------------------------------------------------------------------------

ALTER TABLE public.venue_screens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venue_screens_select_public ON public.venue_screens;

CREATE POLICY venue_screens_select_public
  ON public.venue_screens
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon or authenticated.
-- Edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Seed — Eastbourne production screen + dev sandbox screen
-- ---------------------------------------------------------------------------

INSERT INTO public.venue_screens (
  screen_slug,
  venue_slug,
  company_slug,
  display_name,
  court_id,
  pairing_code,
  active_mode
)
VALUES
  (
    'eastbourne-main',
    'eastbourne',
    'padel4all',
    'Main Screen',
    'c0000000-0000-0000-0000-000000000001',
    'PP-EAST-01',
    'idle'
  ),
  (
    'dev-main',
    'dev',
    'padel4all',
    'Dev Screen',
    'd0000000-0000-0000-0000-000000000001',
    'PP-DEV-01',
    'idle'
  )
ON CONFLICT (screen_slug) DO NOTHING;
