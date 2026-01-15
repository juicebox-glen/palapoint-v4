// ============================================================
// PALAPOINT V4 - MATCH LIFECYCLE EDGE FUNCTION
// Handles match creation, ending, undo, and status checks
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createMatchState } from '../_shared/scoring/engine.ts';
import type { MatchState } from '../_shared/scoring/types.ts';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateRequest {
  action: 'create';
  court_id: string;
  game_mode?: 'traditional' | 'golden_point' | 'silver_point';
  sets_to_win?: 1 | 2;
  tiebreak_at?: 6 | 7;
  team_a_player_1?: string;
  team_a_player_2?: string;
  team_b_player_1?: string;
  team_b_player_2?: string;
  serving_team?: 'a' | 'b';
}

interface EndRequest {
  action: 'end';
  court_id: string;
  reason?: 'completed' | 'abandoned';
}

interface UndoRequest {
  action: 'undo';
  court_id: string;
}

interface StatusRequest {
  action: 'status';
  court_id: string;
}

type MatchRequest = CreateRequest | EndRequest | UndoRequest | StatusRequest;

/**
 * Convert MatchState to database row format
 */
function matchStateToDbRow(state: MatchState): Record<string, any> {
  return {
    id: state.id,
    court_id: state.court_id,
    version: state.version,
    game_mode: state.game_mode,
    sets_to_win: state.sets_to_win,
    tiebreak_at: state.tiebreak_at,
    status: state.status,
    current_set: state.current_set,
    is_tiebreak: state.is_tiebreak,
    team_a_points: state.team_a_points,
    team_b_points: state.team_b_points,
    team_a_games: state.team_a_games,
    team_b_games: state.team_b_games,
    set_scores: state.set_scores,
    deuce_count: state.deuce_count,
    serving_team: state.serving_team,
    winner: state.winner,
    team_a_player_1: state.team_a_player_1 || null,
    team_a_player_2: state.team_a_player_2 || null,
    team_b_player_1: state.team_b_player_1 || null,
    team_b_player_2: state.team_b_player_2 || null,
    started_at: state.started_at || null,
    completed_at: state.completed_at || null,
    tiebreak_scores: state.tiebreak_scores || null,
    tiebreak_starting_server: state.tiebreak_starting_server || null,
  };
}

/**
 * Convert database row to MatchState
 */
function dbRowToMatchState(row: any): MatchState {
  return {
    id: row.id,
    court_id: row.court_id,
    version: row.version,
    game_mode: row.game_mode,
    sets_to_win: row.sets_to_win,
    tiebreak_at: row.tiebreak_at,
    status: row.status,
    current_set: row.current_set,
    is_tiebreak: row.is_tiebreak || false,
    team_a_points: row.team_a_points,
    team_b_points: row.team_b_points,
    team_a_games: row.team_a_games,
    team_b_games: row.team_b_games,
    set_scores: row.set_scores || [],
    tiebreak_scores: row.tiebreak_scores || undefined,
    tiebreak_starting_server: row.tiebreak_starting_server || undefined,
    deuce_count: row.deuce_count || 0,
    serving_team: row.serving_team,
    team_a_player_1: row.team_a_player_1 || null,
    team_a_player_2: row.team_a_player_2 || null,
    team_b_player_1: row.team_b_player_1 || null,
    team_b_player_2: row.team_b_player_2 || null,
    winner: row.winner || null,
    started_at: row.started_at || null,
    completed_at: row.completed_at || null,
  };
}

/**
 * Get active match for a court
 */
async function getActiveMatch(supabase: any, court_id: string) {
  const { data, error } = await supabase
    .from('live_matches')
    .select('*')
    .eq('court_id', court_id)
    .in('status', ['setup', 'in_progress'])
    .maybeSingle();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: MatchRequest = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'missing_action' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'server_configuration_error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Route to appropriate action handler
    switch (action) {
      case 'create': {
        const createReq = body as CreateRequest;
        const { court_id } = createReq;

        if (!court_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_court_id' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check if active match exists
        const existingMatch = await getActiveMatch(supabase, court_id);
        if (existingMatch) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'active_match_exists',
              match_id: existingMatch.id,
            }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Generate UUID for match
        const matchId = crypto.randomUUID();

        // Create match state
        const matchState = createMatchState({
          id: matchId,
          court_id: court_id,
          game_mode: createReq.game_mode,
          sets_to_win: createReq.sets_to_win,
          tiebreak_at: createReq.tiebreak_at,
          serving_team: createReq.serving_team,
          team_a_player_1: createReq.team_a_player_1,
          team_a_player_2: createReq.team_a_player_2,
          team_b_player_1: createReq.team_b_player_1,
          team_b_player_2: createReq.team_b_player_2,
        });

        // Convert to database format
        const dbRow = matchStateToDbRow(matchState);

        // Insert into live_matches
        const { data: createdMatch, error: insertError } = await supabase
          .from('live_matches')
          .insert(dbRow)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating match:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: 'create',
            match: createdMatch,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'end': {
        const endReq = body as EndRequest;
        const { court_id, reason = 'abandoned' } = endReq;

        if (!court_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_court_id' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Load active match
        const match = await getActiveMatch(supabase, court_id);
        if (!match) {
          return new Response(
            JSON.stringify({ success: false, error: 'no_active_match' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Update match status
        const { data: updatedMatch, error: updateError } = await supabase
          .from('live_matches')
          .update({
            status: reason,
            completed_at: new Date().toISOString(),
          })
          .eq('id', match.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error ending match:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: 'end',
            match_id: match.id,
            final_score: {
              team_a_games: updatedMatch.team_a_games,
              team_b_games: updatedMatch.team_b_games,
              set_scores: updatedMatch.set_scores || [],
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'undo': {
        const undoReq = body as UndoRequest;
        const { court_id } = undoReq;

        if (!court_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_court_id' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Load active match
        const match = await getActiveMatch(supabase, court_id);
        if (!match) {
          return new Response(
            JSON.stringify({ success: false, error: 'no_active_match' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Query most recent score_event
        const { data: recentEvent, error: eventError } = await supabase
          .from('score_events')
          .select('*')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (eventError) {
          console.error('Error querying score_events:', eventError);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (!recentEvent) {
          return new Response(
            JSON.stringify({ success: false, error: 'nothing_to_undo' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Get state_before from the event
        const stateBefore = recentEvent.state_before as MatchState;

        // Convert state_before to database format
        // state_before already has the correct version (before the event was applied)
        const restoreData = matchStateToDbRow(stateBefore);

        // Update live_matches with restored state
        const { data: restoredMatch, error: restoreError } = await supabase
          .from('live_matches')
          .update(restoreData)
          .eq('id', match.id)
          .select()
          .single();

        if (restoreError) {
          console.error('Error restoring match state:', restoreError);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Delete the score_event
        const { error: deleteError } = await supabase
          .from('score_events')
          .delete()
          .eq('id', recentEvent.id);

        if (deleteError) {
          console.error('Error deleting score_event:', deleteError);
          // Note: We don't fail the request if deletion fails,
          // but we should log it for debugging
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: 'undo',
            match: restoredMatch,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'status': {
        const statusReq = body as StatusRequest;
        const { court_id } = statusReq;

        if (!court_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_court_id' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Query active match
        const match = await getActiveMatch(supabase, court_id);

        return new Response(
          JSON.stringify({
            success: true,
            action: 'status',
            match: match || null,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'invalid_action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'internal_server_error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
