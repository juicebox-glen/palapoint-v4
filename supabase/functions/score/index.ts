// ============================================================
// PALAPOINT V4 - SCORE EDGE FUNCTION
// Handles button presses and updates match scores
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { applyScore } from '../_shared/scoring/engine.ts';
import type { MatchState, Team } from '../_shared/scoring/types.ts';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoreRequest {
  court_id: string;
  team: 'a' | 'b';
  source: 'button_a' | 'button_b' | 'control_panel';
  event_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: ScoreRequest = await req.json();
    const { court_id, team, source, event_id } = body;

    // Validate required fields
    if (!court_id || !team || !source) {
      return new Response(
        JSON.stringify({ success: false, error: 'missing_required_fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate team value
    if (team !== 'a' && team !== 'b') {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_team' }),
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

    // Query for active match
    const { data: match, error: matchError } = await supabase
      .from('live_matches')
      .select('*')
      .eq('court_id', court_id)
      .in('status', ['setup', 'in_progress'])
      .maybeSingle();

    if (matchError) {
      console.error('Error querying live_matches:', matchError);
      return new Response(
        JSON.stringify({ success: false, error: 'database_error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!match) {
      return new Response(
        JSON.stringify({ success: false, error: 'no_active_match' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for idempotency if event_id provided
    if (event_id) {
      const { data: existingEvent } = await supabase
        .from('score_events')
        .select('*')
        .eq('event_id', event_id)
        .maybeSingle();

      if (existingEvent) {
        // Return current state without changes (event already processed)
        return new Response(
          JSON.stringify({
            success: true,
            match_id: match.id,
            new_state: match,
            effects: [],
            idempotent: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Convert database row to MatchState
    // The database uses snake_case which matches MatchState type
    const stateBefore: MatchState = {
      id: match.id,
      court_id: match.court_id,
      version: match.version,
      game_mode: match.game_mode,
      sets_to_win: match.sets_to_win,
      tiebreak_at: match.tiebreak_at,
      status: match.status,
      current_set: match.current_set,
      is_tiebreak: match.is_tiebreak || false,
      team_a_points: match.team_a_points,
      team_b_points: match.team_b_points,
      team_a_games: match.team_a_games,
      team_b_games: match.team_b_games,
      set_scores: match.set_scores || [],
      tiebreak_scores: match.tiebreak_scores || undefined,
      tiebreak_starting_server: match.tiebreak_starting_server || undefined,
      deuce_count: match.deuce_count || 0,
      serving_team: match.serving_team,
      team_a_player_1: match.team_a_player_1 || null,
      team_a_player_2: match.team_a_player_2 || null,
      team_b_player_1: match.team_b_player_1 || null,
      team_b_player_2: match.team_b_player_2 || null,
      winner: match.winner || null,
      started_at: match.started_at || null,
      completed_at: match.completed_at || null,
    };

    // Apply score using engine
    const result = applyScore(stateBefore, { type: 'point', team });

    // Prepare update data (convert back to database format)
    const newState = result.newState;
    const updateData: Record<string, any> = {
      version: newState.version + 1,
      status: newState.status,
      current_set: newState.current_set,
      is_tiebreak: newState.is_tiebreak,
      team_a_points: newState.team_a_points,
      team_b_points: newState.team_b_points,
      team_a_games: newState.team_a_games,
      team_b_games: newState.team_b_games,
      set_scores: newState.set_scores,
      deuce_count: newState.deuce_count,
      serving_team: newState.serving_team,
      winner: newState.winner,
      started_at: newState.started_at,
      completed_at: newState.completed_at,
    };

    // Handle optional tiebreak fields
    if (newState.tiebreak_scores !== undefined) {
      updateData.tiebreak_scores = newState.tiebreak_scores;
    } else {
      updateData.tiebreak_scores = null;
    }
    if (newState.tiebreak_starting_server !== undefined) {
      updateData.tiebreak_starting_server = newState.tiebreak_starting_server;
    } else {
      updateData.tiebreak_starting_server = null;
    }

    // Update live_matches with optimistic locking
    const { data: updatedMatches, error: updateError } = await supabase
      .from('live_matches')
      .update(updateData)
      .eq('id', match.id)
      .eq('version', match.version) // Optimistic locking
      .select();

    if (updateError) {
      console.error('Error updating live_matches:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'database_error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If no rows updated, version conflict occurred
    if (!updatedMatches || updatedMatches.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'version_conflict' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const updatedMatch = updatedMatches[0];

    // Insert into score_events
    const eventType = team === 'a' ? 'point_a' : 'point_b';
    const { error: eventError } = await supabase
      .from('score_events')
      .insert({
        match_id: match.id,
        event_type: eventType,
        source: source,
        event_id: event_id || null,
        state_before: stateBefore,
      });

    if (eventError) {
      console.error('Error inserting score_events:', eventError);
      // Note: We don't fail the request if event logging fails,
      // but we should log it for debugging
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        match_id: match.id,
        new_state: updatedMatch,
        effects: result.effects,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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
