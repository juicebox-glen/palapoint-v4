// ============================================================
// PALAPOINT LIVE - VENUE SCREEN EDGE FUNCTION
// Staff writes — screen_slug required.
// Pairing codes are temporarily disabled (screens are pre-provisioned).
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
  pairing_code?: string;
  active_mode: ActiveMode;
  /**
   * Idle only, display-triggered: only reset if the screen is still linked to this
   * match (its own endgame hold just expired). Guards against a stale/delayed call
   * tearing down a newer match staff has since linked in the meantime.
   */
  if_showcase_match_id?: string;
}

interface SetSocialNightRequest {
  action: 'set_social_night';
  screen_slug: string;
  pairing_code?: string;
  active_matchplay_event_id: string;
}

interface SetShowcaseGameRequest {
  action: 'set_showcase_game';
  screen_slug: string;
  pairing_code?: string;
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

/** Resolve screen by slug. Pairing verification temporarily skipped. */
async function resolveScreen(
  supabase: ReturnType<typeof createClient>,
  screenSlug: string
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
      const { screen_slug, active_mode, if_showcase_match_id } = body;

      if (!screen_slug?.trim()) {
        return errorResponse('missing_screen_slug', 'screen_slug is required.', 400);
      }
      if (!['idle', 'social_night', 'showcase_game'].includes(active_mode)) {
        return errorResponse(
          'invalid_active_mode',
          'active_mode must be idle, social_night, or showcase_game.',
          400
        );
      }

      const access = await resolveScreen(supabase, screen_slug);
      if (!access.ok) return access.response;

      if (active_mode === 'idle') {
        const { data: currentScreen, error: currentScreenError } = await supabase
          .from('venue_screens')
          .select('court_id, active_showcase_match_id, active_matchplay_event_id')
          .eq('id', access.screenId)
          .maybeSingle();

        if (currentScreenError) {
          console.error('[screen] idle cleanup lookup:', currentScreenError.message);
          return errorResponse('lookup_failed', 'Could not look up screen state.', 500);
        }

        // Display-triggered reset after the endgame hold — only proceed if the screen
        // is still linked to that same match. If staff already moved on to a newer
        // match in the meantime, this is a stale call and must not tear it down.
        if (
          if_showcase_match_id &&
          currentScreen?.active_showcase_match_id !== if_showcase_match_id
        ) {
          const { data: unchanged, error: reselectError } = await supabase
            .from('venue_screens')
            .select(PUBLIC_SELECT)
            .eq('id', access.screenId)
            .single();
          if (reselectError || !unchanged) {
            return errorResponse(
              'lookup_failed',
              reselectError?.message ?? 'Could not look up screen.',
              500
            );
          }
          return jsonResponse({ success: true, screen: unchanged, skipped: true });
        }

        // Reset to Idle is a hard cleanup, not just a mode flip — abandon whatever
        // showcase match is active on this court, and end whatever social night event
        // is linked to this screen, so nothing resumable is left behind.
        if (currentScreen?.court_id) {
          const { error: matchCleanupError } = await supabase
            .from('live_matches')
            .update({ status: 'abandoned', completed_at: new Date().toISOString() })
            .eq('court_id', currentScreen.court_id)
            .in('status', ['setup', 'in_progress']);

          if (matchCleanupError) {
            console.error('[screen] idle cleanup — abandon match:', matchCleanupError.message);
            return errorResponse('cleanup_failed', 'Could not abandon the active match.', 500);
          }
        }

        if (currentScreen?.active_matchplay_event_id) {
          const { error: eventCleanupError } = await supabase
            .from('matchplay_events')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', currentScreen.active_matchplay_event_id)
            .in('status', ['setup', 'in_progress']);

          if (eventCleanupError) {
            console.error('[screen] idle cleanup — end event:', eventCleanupError.message);
            return errorResponse('cleanup_failed', 'Could not end the active event.', 500);
          }
        }
      }

      const patch: Record<string, unknown> = { active_mode };

      // set_mode alone means "waiting" for that mode — clear active links.
      // set_social_night / set_showcase_game attach the live event/match.
      if (active_mode === 'idle') {
        patch.active_matchplay_event_id = null;
        patch.active_showcase_match_id = null;
      } else if (active_mode === 'social_night') {
        patch.active_showcase_match_id = null;
        patch.active_matchplay_event_id = null;
      } else if (active_mode === 'showcase_game') {
        patch.active_matchplay_event_id = null;
        patch.active_showcase_match_id = null;
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
      const { screen_slug, active_matchplay_event_id } = body;

      if (!screen_slug?.trim()) {
        return errorResponse('missing_screen_slug', 'screen_slug is required.', 400);
      }
      if (!active_matchplay_event_id?.trim()) {
        return errorResponse(
          'missing_event_id',
          'active_matchplay_event_id is required.',
          400
        );
      }

      const access = await resolveScreen(supabase, screen_slug);
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
      const { screen_slug, active_showcase_match_id } = body;

      if (!screen_slug?.trim()) {
        return errorResponse('missing_screen_slug', 'screen_slug is required.', 400);
      }
      if (!active_showcase_match_id?.trim()) {
        return errorResponse(
          'missing_match_id',
          'active_showcase_match_id is required.',
          400
        );
      }

      const access = await resolveScreen(supabase, screen_slug);
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
