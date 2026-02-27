// ============================================================
// PALAPOINT V4 - SESSION MANAGEMENT EDGE FUNCTION
// Handles session creation, validation, and lifecycle
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Request types
interface CreateSessionRequest {
  action: 'create';
  court_id: string;
  settings?: {
    game_mode?: 'traditional' | 'golden_point' | 'silver_point';
    sets_to_win?: 1 | 2;
    tiebreak_at?: 6 | 7;
    side_swap_enabled?: boolean;
  };
  team_a_player_1?: string;
  team_a_player_2?: string;
  team_b_player_1?: string;
  team_b_player_2?: string;
}

interface CheckSessionRequest {
  action: 'check';
  court_id: string;
}

interface ValidateSessionRequest {
  action: 'validate';
  session_id: string;
}

interface UpdateActivityRequest {
  action: 'update_activity';
  session_id: string;
}

interface EndSessionRequest {
  action: 'end';
  session_id: string;
  reason?: 'manual' | 'takeover' | 'staff_override';
}

interface TakeoverRequest {
  action: 'takeover';
  court_id: string;
  settings?: {
    game_mode?: 'traditional' | 'golden_point' | 'silver_point';
    sets_to_win?: 1 | 2;
    tiebreak_at?: 6 | 7;
    side_swap_enabled?: boolean;
  };
  team_a_player_1?: string;
  team_a_player_2?: string;
  team_b_player_1?: string;
  team_b_player_2?: string;
}

type SessionRequest =
  | CreateSessionRequest
  | CheckSessionRequest
  | ValidateSessionRequest
  | UpdateActivityRequest
  | EndSessionRequest
  | TakeoverRequest;

// Session with games count
interface SessionWithGames {
  id: string;
  court_id: string;
  status: string;
  settings: Record<string, unknown>;
  team_a_player_1: string | null;
  team_a_player_2: string | null;
  team_b_player_1: string | null;
  team_b_player_2: string | null;
  started_at: string;
  last_activity: string;
  ended_at: string | null;
  games_count?: number;
  minutes_active?: number;
  minutes_since_activity?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: SessionRequest = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'missing_action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'server_configuration_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      // ============================================================
      // CHECK - Check if court has active session
      // ============================================================
      case 'check': {
        const { court_id } = body as CheckSessionRequest;

        if (!court_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_court_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get active session for court
        const { data: session, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('court_id', court_id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('Error checking session:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!session) {
          return new Response(
            JSON.stringify({
              success: true,
              has_active_session: false,
              session: null,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get games count for this session
        const { count: gamesCount } = await supabase
          .from('live_matches')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);

        // Also check archived matches
        const { count: archivedCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);

        const totalGames = (gamesCount || 0) + (archivedCount || 0);

        // Calculate time info
        const now = new Date();
        const startedAt = new Date(session.started_at);
        const lastActivity = new Date(session.last_activity);
        const minutesActive = Math.floor((now.getTime() - startedAt.getTime()) / 1000 / 60);
        const minutesSinceActivity = Math.floor(
          (now.getTime() - lastActivity.getTime()) / 1000 / 60
        );

        const sessionWithInfo: SessionWithGames = {
          ...session,
          games_count: totalGames,
          minutes_active: minutesActive,
          minutes_since_activity: minutesSinceActivity,
        };

        return new Response(
          JSON.stringify({
            success: true,
            has_active_session: true,
            session: sessionWithInfo,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // CREATE - Create new session
      // ============================================================
      case 'create': {
        const {
          court_id,
          settings,
          team_a_player_1,
          team_a_player_2,
          team_b_player_1,
          team_b_player_2,
        } = body as CreateSessionRequest;

        if (!court_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_court_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for existing active session
        const { data: existingSession } = await supabase
          .from('sessions')
          .select('id')
          .eq('court_id', court_id)
          .eq('status', 'active')
          .maybeSingle();

        if (existingSession) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'active_session_exists',
              session_id: existingSession.id,
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('sessions')
          .insert({
            court_id,
            settings: settings || {
              game_mode: 'golden_point',
              sets_to_win: 1,
              tiebreak_at: 6,
              side_swap_enabled: true,
            },
            team_a_player_1: team_a_player_1 || null,
            team_a_player_2: team_a_player_2 || null,
            team_b_player_1: team_b_player_1 || null,
            team_b_player_2: team_b_player_2 || null,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: 'create',
            session: newSession,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // VALIDATE - Check if session is still valid
      // ============================================================
      case 'validate': {
        const { session_id } = body as ValidateSessionRequest;

        if (!session_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_session_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: session, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', session_id)
          .single();

        if (error || !session) {
          return new Response(
            JSON.stringify({ success: false, error: 'session_not_found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if expired
        if (session.status !== 'active') {
          return new Response(
            JSON.stringify({
              success: true,
              valid: false,
              reason: session.status,
              session,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check inactivity (30 minutes)
        const now = new Date();
        const lastActivity = new Date(session.last_activity);
        const minutesSinceActivity =
          (now.getTime() - lastActivity.getTime()) / 1000 / 60;

        if (minutesSinceActivity > 30) {
          // Auto-expire the session
          await supabase
            .from('sessions')
            .update({ status: 'expired', ended_at: now.toISOString() })
            .eq('id', session_id);

          return new Response(
            JSON.stringify({
              success: true,
              valid: false,
              reason: 'expired_inactivity',
              session: { ...session, status: 'expired' },
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            valid: true,
            session,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // UPDATE_ACTIVITY - Update last activity timestamp
      // ============================================================
      case 'update_activity': {
        const { session_id } = body as UpdateActivityRequest;

        if (!session_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_session_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', session_id)
          .eq('status', 'active');

        if (error) {
          console.error('Error updating activity:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, action: 'update_activity' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // END - End a session
      // ============================================================
      case 'end': {
        const { session_id, reason = 'manual' } = body as EndSessionRequest;

        if (!session_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_session_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get session with games
        const { data: session } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', session_id)
          .single();

        if (!session) {
          return new Response(
            JSON.stringify({ success: false, error: 'session_not_found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // End any active match in this session
        await supabase
          .from('live_matches')
          .update({
            status: 'abandoned',
            completed_at: new Date().toISOString(),
          })
          .eq('session_id', session_id)
          .in('status', ['setup', 'in_progress']);

        // End the session
        const { data: endedSession, error } = await supabase
          .from('sessions')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
          })
          .eq('id', session_id)
          .select()
          .single();

        if (error) {
          console.error('Error ending session:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get all games from this session for review
        const { data: games } = await supabase
          .from('matches')
          .select('*')
          .eq('session_id', session_id)
          .order('created_at', { ascending: true });

        return new Response(
          JSON.stringify({
            success: true,
            action: 'end',
            reason,
            session: endedSession,
            games: games || [],
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================================
      // TAKEOVER - End existing session and create new one
      // ============================================================
      case 'takeover': {
        const {
          court_id,
          settings,
          team_a_player_1,
          team_a_player_2,
          team_b_player_1,
          team_b_player_2,
        } = body as TakeoverRequest;

        if (!court_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'missing_court_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // End existing active session
        const { data: existingSession } = await supabase
          .from('sessions')
          .select('id')
          .eq('court_id', court_id)
          .eq('status', 'active')
          .maybeSingle();

        if (existingSession) {
          // End any active matches
          await supabase
            .from('live_matches')
            .update({
              status: 'abandoned',
              completed_at: new Date().toISOString(),
            })
            .eq('session_id', existingSession.id)
            .in('status', ['setup', 'in_progress']);

          // End the session
          await supabase
            .from('sessions')
            .update({
              status: 'ended',
              ended_at: new Date().toISOString(),
            })
            .eq('id', existingSession.id);
        }

        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('sessions')
          .insert({
            court_id,
            settings: settings || {
              game_mode: 'golden_point',
              sets_to_win: 1,
              tiebreak_at: 6,
              side_swap_enabled: true,
            },
            team_a_player_1: team_a_player_1 || null,
            team_a_player_2: team_a_player_2 || null,
            team_b_player_1: team_b_player_1 || null,
            team_b_player_2: team_b_player_2 || null,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
          return new Response(
            JSON.stringify({ success: false, error: 'database_error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: 'takeover',
            previous_session_ended: !!existingSession,
            session: newSession,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'invalid_action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'internal_server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
