// ============================================================
// PALAPOINT V4 - MATCHPLAY PLAYER EDGE FUNCTION
// Manages players within an event: add, add_bulk, remove, update, standings, list
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'add' | 'add_bulk' | 'remove' | 'update' | 'standings' | 'list';

interface AddInput {
  action: 'add';
  event_id: string;
  name: string;
}

interface AddBulkInput {
  action: 'add_bulk';
  event_id: string;
  names: string[];
}

interface RemoveInput {
  action: 'remove';
  player_id: string;
}

interface UpdateInput {
  action: 'update';
  player_id: string;
  name?: string;
  photo_url?: string | null;
}

interface StandingsInput {
  action: 'standings';
  event_id: string;
}

interface ListInput {
  action: 'list';
  event_id: string;
}

type RequestInput =
  | AddInput
  | AddBulkInput
  | RemoveInput
  | UpdateInput
  | StandingsInput
  | ListInput;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: string, status = 400) {
  return jsonResponse({ success: false, error }, status);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    return errorResponse('server_configuration_error', 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body: RequestInput = await req.json();
    const { action } = body;

    if (!action) {
      return errorResponse('missing_action');
    }

    switch (action) {
      case 'add': {
        const { event_id, name } = body as AddInput;
        if (!event_id || !name?.trim()) {
          return errorResponse('event_id and name are required');
        }

        const { data, error } = await supabase
          .from('matchplay_players')
          .insert({ event_id, name: name.trim() })
          .select()
          .single();

        if (error) {
          console.error('matchplay-player add error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true, player: data });
      }

      case 'add_bulk': {
        const { event_id, names } = body as AddBulkInput;
        if (!event_id || !Array.isArray(names)) {
          return errorResponse('event_id and names array are required');
        }

        const trimmed = names
          .map((n) => (typeof n === 'string' ? n.trim() : ''))
          .filter((n) => n.length > 0);

        if (trimmed.length === 0) {
          return errorResponse('no_valid_names');
        }

        const rows = trimmed.map((name) => ({ event_id, name }));
        const { data, error } = await supabase
          .from('matchplay_players')
          .insert(rows)
          .select();

        if (error) {
          console.error('matchplay-player add_bulk error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true, players: data ?? [] });
      }

      case 'remove': {
        const { player_id } = body as RemoveInput;
        if (!player_id) return errorResponse('player_id is required');

        const { data: matches, error: matchErr } = await supabase
          .from('matchplay_matches')
          .select('id')
          .or(
            `team_a_player_1_id.eq.${player_id},team_a_player_2_id.eq.${player_id},team_b_player_1_id.eq.${player_id},team_b_player_2_id.eq.${player_id}`
          )
          .limit(1);

        if (matchErr) {
          console.error('matchplay-player remove check error:', matchErr);
          return errorResponse(matchErr.message, 500);
        }
        if (matches && matches.length > 0) {
          return errorResponse('Cannot remove player with existing match results');
        }

        const { error } = await supabase
          .from('matchplay_players')
          .delete()
          .eq('id', player_id);

        if (error) {
          console.error('matchplay-player remove error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true });
      }

      case 'update': {
        const { player_id, name, photo_url } = body as UpdateInput;
        if (!player_id) {
          return errorResponse('player_id is required');
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) {
          if (!name?.trim()) {
            return errorResponse('name cannot be empty');
          }
          updateData.name = name.trim();
        }
        if (photo_url !== undefined) {
          updateData.photo_url = photo_url;
        }
        if (Object.keys(updateData).length === 0) {
          return errorResponse('no_fields_to_update');
        }

        const { data, error } = await supabase
          .from('matchplay_players')
          .update(updateData)
          .eq('id', player_id)
          .select()
          .single();

        if (error) {
          console.error('matchplay-player update error:', error);
          return errorResponse(error.message, 500);
        }
        if (!data) return errorResponse('player_not_found', 404);
        return jsonResponse({ success: true, player: data });
      }

      case 'standings': {
        const { event_id } = body as StandingsInput;
        if (!event_id) return errorResponse('event_id is required');

        const { data: players, error } = await supabase
          .from('matchplay_players')
          .select('*')
          .eq('event_id', event_id)
          .order('total_points', { ascending: false })
          .order('game_difference', { ascending: false })
          .order('games_won', { ascending: false })
          .order('name', { ascending: true });

        if (error) {
          console.error('matchplay-player standings error:', error);
          return errorResponse(error.message, 500);
        }

        const list = players ?? [];
        const withRank: Array<Record<string, unknown> & { rank: number }> = [];
        let rank = 1;
        let prevPts = -1;
        let prevGd = -1;
        let prevGw = -1;

        for (let i = 0; i < list.length; i++) {
          const p = list[i] as Record<string, unknown>;
          const pts = (p.total_points as number) ?? 0;
          const gd = (p.game_difference as number) ?? 0;
          const gw = (p.games_won as number) ?? 0;

          if (i === 0 || pts !== prevPts || gd !== prevGd || gw !== prevGw) {
            rank = i + 1;
          }
          prevPts = pts;
          prevGd = gd;
          prevGw = gw;
          withRank.push({ ...p, rank });
        }

        return jsonResponse({ success: true, standings: withRank });
      }

      case 'list': {
        const { event_id } = body as ListInput;
        if (!event_id) return errorResponse('event_id is required');

        const { data, error } = await supabase
          .from('matchplay_players')
          .select('*')
          .eq('event_id', event_id)
          .order('name', { ascending: true });

        if (error) {
          console.error('matchplay-player list error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true, players: data ?? [] });
      }

      default:
        return errorResponse('invalid_action');
    }
  } catch (err) {
    console.error('matchplay-player error:', err);
    return errorResponse('unexpected_error', 500);
  }
});
