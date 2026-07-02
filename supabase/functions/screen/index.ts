// ============================================================
// PALAPOINT LIVE - VENUE SCREEN EDGE FUNCTION
// Staff writes only — pairing code required. Returns full row or explicit error.
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PUBLIC_SELECT =
  'id, screen_slug, venue_slug, company_slug, display_name, court_id, active_mode, active_matchplay_event_id, active_showcase_match_id, created_at, updated_at';

type ActiveMode = 'idle' | 'social_night' | 'showcase_game';

interface SetModeRequest {
  action: 'set_mode';
  screen_slug: string;
  pairing_code: string;
  active_mode: ActiveMode;
}

interface SetSocialNightRequest {
  action: 'set_social_night';
  screen_slug: string;
  pairing_code: string;
  active_matchplay_event_id: string;
}

interface SetShowcaseGameRequest {
  action: 'set_showcase_game';
  screen_slug: string;
  pairing_code: string;
  active_showcase_match_id: string;
}

type ScreenRequest = SetModeRequest | SetSocialNightRequest | SetShowcaseGameRequest;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(
  error: string,
  message: string,
  status: number
): Response {
  return jsonResponse({ success: false, error, message }, status);
}

async function verifyScreenAccess(
  supabase: ReturnType<typeof createClient>,
  screenSlug: string,
  pairingCode: string
): Promise<
  | { ok: true; screenId: string; venueSlug: string }
  | { ok: false; response: Response }
> {
  const { data: screenRow, error: screenError } = await supabase
    .from('venue_screens')
    .select('id, screen_slug, venue_slug')
    .eq('screen_slug', screenSlug.trim())
    .maybeSingle();

  if (screenError) {
    console.error('[screen] lookup:', screenError.message);
    return {
      ok: false,
      response: errorResponse('lookup_failed', 'Could not look up screen.', 500),
    };
  }

  if (!screenRow) {
    return {
      ok: false,
      response: errorResponse('screen_not_found', 'No screen matches that slug.', 404),
    };
  }

  const { data: secretRow, error: secretError } = await supabase
    .from('venue_screen_secrets')
    .select('pairing_code')
    .eq('screen_id', screenRow.id)
    .maybeSingle();

  if (secretError) {
    console.error('[screen] secret lookup:', secretError.message);
    return {
      ok: false,
      response: errorResponse('lookup_failed', 'Could not verify pairing code.', 500),
    };
  }

  if (!secretRow || secretRow.pairing_code !== pairingCode.trim()) {
    return {
      ok: false,
      response: errorResponse(
        'invalid_pairing_code',
        'Pairing code did not match this screen.',
        403
      ),
    };
  }

  return {
    ok: true,
    screenId: screenRow.id,
    venueSlug: screenRow.venue_slug as string,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('method_not_allowed', 'Use POST.', 405);
  }

  try {
    const body = (await req.json()) as ScreenRequest;
    const { action } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('server_configuration_error', 'Server is not configured.', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'set_mode') {
      const { screen_slug, pairing_code, active_mode } = body;

      if (!screen_slug?.trim()) {
        return errorResponse('missing_screen_slug', 'screen_slug is required.', 400);
      }
      if (!pairing_code?.trim()) {
        return errorResponse('missing_pairing_code', 'pairing_code is required.', 400);
      }
      if (!['idle', 'social_night', 'showcase_game'].includes(active_mode)) {
        return errorResponse(
          'invalid_active_mode',
          'active_mode must be idle, social_night, or showcase_game.',
          400
        );
      }

      const access = await verifyScreenAccess(supabase, screen_slug, pairing_code);
      if (!access.ok) return access.response;

      const patch: Record<string, unknown> = { active_mode };

      if (active_mode === 'idle') {
        patch.active_matchplay_event_id = null;
        patch.active_showcase_match_id = null;
      } else if (active_mode === 'social_night') {
        patch.active_showcase_match_id = null;
      } else if (active_mode === 'showcase_game') {
        patch.active_matchplay_event_id = null;
      }

      const { data: updated, error: updateError } = await supabase
        .from('venue_screens')
        .update(patch)
        .eq('id', access.screenId)
        .select(PUBLIC_SELECT)
        .single();

      if (updateError || !updated) {
        console.error('[screen] update:', updateError?.message);
        return errorResponse(
          'update_failed',
          updateError?.message ?? 'Update did not return a row.',
          500
        );
      }

      return jsonResponse({ success: true, screen: updated });
    }

    if (action === 'set_social_night') {
      const { screen_slug, pairing_code, active_matchplay_event_id } = body;

      if (!screen_slug?.trim()) {
        return errorResponse('missing_screen_slug', 'screen_slug is required.', 400);
      }
      if (!pairing_code?.trim()) {
        return errorResponse('missing_pairing_code', 'pairing_code is required.', 400);
      }
      if (!active_matchplay_event_id?.trim()) {
        return errorResponse(
          'missing_event_id',
          'active_matchplay_event_id is required.',
          400
        );
      }

      const access = await verifyScreenAccess(supabase, screen_slug, pairing_code);
      if (!access.ok) return access.response;

      const { data: eventRow, error: eventError } = await supabase
        .from('matchplay_events')
        .select('id, status, venue_id, venues!inner(slug)')
        .eq('id', active_matchplay_event_id.trim())
        .maybeSingle();

      if (eventError) {
        console.error('[screen] event lookup:', eventError.message);
        return errorResponse('lookup_failed', 'Could not look up event.', 500);
      }

      if (!eventRow) {
        return errorResponse('event_not_found', 'No matchplay event matches that id.', 404);
      }

      const eventVenueSlug = (eventRow.venues as { slug?: string } | null)?.slug;
      if (eventVenueSlug !== access.venueSlug) {
        return errorResponse(
          'event_venue_mismatch',
          'This event belongs to a different venue than the screen.',
          403
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from('venue_screens')
        .update({
          active_mode: 'social_night',
          active_matchplay_event_id: eventRow.id,
          active_showcase_match_id: null,
        })
        .eq('id', access.screenId)
        .select(PUBLIC_SELECT)
        .single();

      if (updateError || !updated) {
        console.error('[screen] social night update:', updateError?.message);
        return errorResponse(
          'update_failed',
          updateError?.message ?? 'Update did not return a row.',
          500
        );
      }

      return jsonResponse({ success: true, screen: updated });
    }

    if (action === 'set_showcase_game') {
      const { screen_slug, pairing_code, active_showcase_match_id } = body;

      if (!screen_slug?.trim()) {
        return errorResponse('missing_screen_slug', 'screen_slug is required.', 400);
      }
      if (!pairing_code?.trim()) {
        return errorResponse('missing_pairing_code', 'pairing_code is required.', 400);
      }
      if (!active_showcase_match_id?.trim()) {
        return errorResponse(
          'missing_match_id',
          'active_showcase_match_id is required.',
          400
        );
      }

      const access = await verifyScreenAccess(supabase, screen_slug, pairing_code);
      if (!access.ok) return access.response;

      const { data: screenRow, error: screenError } = await supabase
        .from('venue_screens')
        .select('court_id')
        .eq('id', access.screenId)
        .maybeSingle();

      if (screenError || !screenRow?.court_id) {
        console.error('[screen] court lookup:', screenError?.message);
        return errorResponse(
          'screen_not_configured',
          'This screen has no backing court configured.',
          500
        );
      }

      const { data: matchRow, error: matchError } = await supabase
        .from('live_matches')
        .select('id, court_id, status')
        .eq('id', active_showcase_match_id.trim())
        .maybeSingle();

      if (matchError) {
        console.error('[screen] match lookup:', matchError.message);
        return errorResponse('lookup_failed', 'Could not look up match.', 500);
      }

      if (!matchRow) {
        return errorResponse('match_not_found', 'No live match matches that id.', 404);
      }

      if (matchRow.court_id !== screenRow.court_id) {
        return errorResponse(
          'match_court_mismatch',
          'This match belongs to a different court than the screen.',
          403
        );
      }

      if (!['setup', 'in_progress'].includes(matchRow.status as string)) {
        return errorResponse(
          'invalid_match_status',
          'Showcase match must be in setup or in progress.',
          400
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from('venue_screens')
        .update({
          active_mode: 'showcase_game',
          active_matchplay_event_id: null,
          active_showcase_match_id: matchRow.id,
        })
        .eq('id', access.screenId)
        .select(PUBLIC_SELECT)
        .single();

      if (updateError || !updated) {
        console.error('[screen] showcase update:', updateError?.message);
        return errorResponse(
          'update_failed',
          updateError?.message ?? 'Update did not return a row.',
          500
        );
      }

      return jsonResponse({ success: true, screen: updated });
    }

    return errorResponse('unknown_action', `Unknown action: ${String(action)}`, 400);
  } catch (err) {
    console.error('[screen] unhandled:', err);
    return errorResponse(
      'internal_error',
      err instanceof Error ? err.message : 'Unexpected error.',
      500
    );
  }
});
