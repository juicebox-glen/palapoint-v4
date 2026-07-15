// ============================================================
// PALAPOINT V4 - MATCHPLAY ROUND EDGE FUNCTION
// Manages rounds, matches, and score entry
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action =
  | 'create_round'
  | 'enter_result'
  | 'edit_result'
  | 'get_round'
  | 'list_rounds'
  | 'start_round'
  | 'complete_round'
  | 'delete_round'
  | 'update_match';

interface MatchInput {
  court_label: string;
  team_a: string[];
  team_b: string[];
}

interface CreateRoundInput {
  action: 'create_round';
  event_id: string;
  round_number: number;
  matches: MatchInput[];
}

interface EnterResultInput {
  action: 'enter_result' | 'edit_result';
  match_id: string;
  team_a_score: number;
  team_b_score: number;
}

interface GetRoundInput {
  action: 'get_round';
  round_id: string;
}

interface ListRoundsInput {
  action: 'list_rounds';
  event_id: string;
}

interface StartRoundInput {
  action: 'start_round';
  round_id: string;
}

interface CompleteRoundInput {
  action: 'complete_round';
  round_id: string;
}

interface DeleteRoundInput {
  action: 'delete_round';
  round_id: string;
}

interface UpdateMatchInput {
  action: 'update_match';
  match_id: string;
  team_a: string[];
  team_b: string[];
}

type RequestInput =
  | CreateRoundInput
  | EnterResultInput
  | GetRoundInput
  | ListRoundsInput
  | StartRoundInput
  | CompleteRoundInput
  | DeleteRoundInput
  | UpdateMatchInput;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: string, status = 400) {
  return jsonResponse({ success: false, error }, status);
}

interface MatchRow {
  id: string;
  round_id: string;
  event_id: string;
  court_label: string;
  team_a_player_1_id: string;
  team_a_player_2_id: string;
  team_b_player_1_id: string;
  team_b_player_2_id: string;
  status: string;
  team_a_score: number | null;
  team_b_score: number | null;
  result: string | null;
}

interface EventRow {
  id: string;
  scoring_type?: string;
  win_points: number;
  draw_points: number;
  loss_points: number;
}

interface PlayerStats {
  total_points: number;
  matches_played: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  games_won: number;
  games_lost: number;
  game_difference: number;
}

async function recalculateStandings(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  event: EventRow
): Promise<Record<string, PlayerStats>> {
  const { data: matches } = await supabase
    .from('matchplay_matches')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'completed');

  const stats: Record<string, PlayerStats> = {};

  for (const m of matches ?? []) {
    const match = m as MatchRow;
    const teamAScore = match.team_a_score ?? 0;
    const teamBScore = match.team_b_score ?? 0;
    const playerIds = [
      match.team_a_player_1_id,
      match.team_a_player_2_id,
      match.team_b_player_1_id,
      match.team_b_player_2_id,
    ];

    for (const pid of playerIds) {
      if (!stats[pid]) {
        stats[pid] = {
          total_points: 0,
          matches_played: 0,
          matches_won: 0,
          matches_drawn: 0,
          matches_lost: 0,
          games_won: 0,
          games_lost: 0,
          game_difference: 0,
        };
      }
    }

    const isTeamA = (pid: string) =>
      pid === match.team_a_player_1_id || pid === match.team_a_player_2_id;
    const myScore = (pid: string) => (isTeamA(pid) ? teamAScore : teamBScore);
    const theirScore = (pid: string) => (isTeamA(pid) ? teamBScore : teamAScore);

    for (const pid of playerIds) {
      const s = stats[pid]!;
      const my = myScore(pid);
      const their = theirScore(pid);

      s.matches_played++;
      s.games_won += my;
      s.games_lost += their;

      if (event.scoring_type === 'raw_points') {
        s.total_points += my;
        if (my > their) s.matches_won++;
        else if (my === their) s.matches_drawn++;
        else s.matches_lost++;
      } else {
        if (my > their) {
          s.matches_won++;
          s.total_points += event.win_points;
        } else if (my === their) {
          s.matches_drawn++;
          s.total_points += event.draw_points;
        } else {
          s.matches_lost++;
          s.total_points += event.loss_points;
        }
      }
    }
  }

  for (const pid of Object.keys(stats)) {
    const s = stats[pid]!;
    s.game_difference = s.games_won - s.games_lost;
  }

  return stats;
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
      case 'create_round': {
        const { event_id, round_number, matches } = body as CreateRoundInput;
        if (!event_id || round_number == null || !Array.isArray(matches) || matches.length === 0) {
          return errorResponse('event_id, round_number, and matches array are required');
        }

        const { data: event } = await supabase
          .from('matchplay_events')
          .select('id, status')
          .eq('id', event_id)
          .single();

        if (!event) return errorResponse('event_not_found', 404);

        const { data: eventPlayers } = await supabase
          .from('matchplay_players')
          .select('id')
          .eq('event_id', event_id);
        const validPlayerIds = new Set((eventPlayers ?? []).map((p) => p.id));

        const allPlayerIds: string[] = [];
        for (const m of matches) {
          if (!m.court_label || !Array.isArray(m.team_a) || !Array.isArray(m.team_b)) {
            return errorResponse('each match must have court_label, team_a, team_b');
          }
          if (m.team_a.length !== 2 || m.team_b.length !== 2) {
            return errorResponse('each team must have exactly 2 player ids');
          }
          const ids = [...m.team_a, ...m.team_b];
          for (const id of ids) {
            if (!validPlayerIds.has(id)) {
              return errorResponse(`player ${id} is not in this event`);
            }
            allPlayerIds.push(id);
          }
        }

        const seen = new Set<string>();
        for (const id of allPlayerIds) {
          if (seen.has(id)) {
            return errorResponse('player cannot appear in multiple matches in the same round');
          }
          seen.add(id);
        }

        const { data: round, error: roundErr } = await supabase
          .from('matchplay_rounds')
          .insert({ event_id, round_number })
          .select()
          .single();

        if (roundErr) {
          console.error('matchplay-round create_round error:', roundErr);
          return errorResponse(roundErr.message, 500);
        }

        const matchRows = matches.map((m) => ({
          round_id: round.id,
          event_id,
          court_label: m.court_label,
          team_a_player_1_id: m.team_a[0],
          team_a_player_2_id: m.team_a[1],
          team_b_player_1_id: m.team_b[0],
          team_b_player_2_id: m.team_b[1],
        }));

        const { data: createdMatches, error: matchErr } = await supabase
          .from('matchplay_matches')
          .insert(matchRows)
          .select();

        if (matchErr) {
          console.error('matchplay-round create matches error:', matchErr);
          await supabase.from('matchplay_rounds').delete().eq('id', round.id);
          return errorResponse(matchErr.message, 500);
        }

        // Event status is managed by matchplay-event start/complete — do not auto-update here

        const roundWithMatches = { ...round, matches: createdMatches ?? [] };
        return jsonResponse({ success: true, round: roundWithMatches });
      }

      case 'enter_result':
      case 'edit_result': {
        const { match_id, team_a_score, team_b_score } = body as EnterResultInput;
        if (!match_id || team_a_score == null || team_b_score == null) {
          return errorResponse('match_id, team_a_score, and team_b_score are required');
        }

        // Applies to pending or already-completed matches (staff corrections).

        const { data: match, error: matchErr } = await supabase
          .from('matchplay_matches')
          .select('*')
          .eq('id', match_id)
          .single();

        if (matchErr || !match) {
          return errorResponse('match_not_found', 404);
        }

        const m = match as MatchRow;
        const eventId = m.event_id;

        const { data: roundRow, error: roundErr } = await supabase
          .from('matchplay_rounds')
          .select('id, status, round_number')
          .eq('id', m.round_id)
          .maybeSingle();

        if (roundErr || !roundRow) {
          return errorResponse('round_not_found', 404);
        }

        // Future rounds stay view-only until staff taps Next Round (start_round).
        if (roundRow.status === 'pending') {
          return errorResponse(
            'round_not_started',
            400
          );
        }

        const { data: event, error: eventErr } = await supabase
          .from('matchplay_events')
          .select('scoring_type, win_points, draw_points, loss_points')
          .eq('id', eventId)
          .single();

        if (eventErr || !event) {
          return errorResponse('event_not_found', 404);
        }

        const result =
          team_a_score > team_b_score ? 'team_a' : team_b_score > team_a_score ? 'team_b' : 'draw';

        const { data: updatedMatch, error: updateErr } = await supabase
          .from('matchplay_matches')
          .update({
            team_a_score,
            team_b_score,
            status: 'completed',
            result,
            updated_at: new Date().toISOString(),
          })
          .eq('id', match_id)
          .select()
          .single();

        if (updateErr) {
          console.error('matchplay-round enter_result update error:', updateErr);
          return errorResponse(updateErr.message, 500);
        }

        const stats = await recalculateStandings(supabase, eventId, event as EventRow);

        for (const [playerId, s] of Object.entries(stats)) {
          await supabase
            .from('matchplay_players')
            .update({
              total_points: s.total_points,
              matches_played: s.matches_played,
              matches_won: s.matches_won,
              matches_drawn: s.matches_drawn,
              matches_lost: s.matches_lost,
              games_won: s.games_won,
              games_lost: s.games_lost,
              game_difference: s.game_difference,
            })
            .eq('id', playerId)
            .eq('event_id', eventId);
        }

        const roundId = m.round_id;
        const { data: roundMatches } = await supabase
          .from('matchplay_matches')
          .select('id, status')
          .eq('round_id', roundId);

        const allComplete =
          (roundMatches ?? []).every((r) => r.status === 'completed') &&
          roundMatches &&
          roundMatches.length > 0;

        if (allComplete) {
          await supabase
            .from('matchplay_rounds')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', roundId);
        }

        const { data: standings } = await supabase
          .from('matchplay_players')
          .select('*')
          .eq('event_id', eventId)
          .order('total_points', { ascending: false })
          .order('game_difference', { ascending: false })
          .order('games_won', { ascending: false })
          .order('name', { ascending: true });

        const list = standings ?? [];
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

        return jsonResponse({
          success: true,
          match: updatedMatch,
          standings: withRank,
        });
      }

      case 'update_match': {
        const { match_id, team_a, team_b } = body as UpdateMatchInput;
        if (!match_id || !Array.isArray(team_a) || !Array.isArray(team_b)) {
          return errorResponse('match_id, team_a, and team_b are required');
        }
        if (team_a.length !== 2 || team_b.length !== 2) {
          return errorResponse('each team must have exactly 2 player ids');
        }

        const { data: match, error: matchErr } = await supabase
          .from('matchplay_matches')
          .select('*')
          .eq('id', match_id)
          .single();

        if (matchErr || !match) {
          return errorResponse('match_not_found', 404);
        }

        const m = match as MatchRow;
        if (m.status === 'completed') {
          return errorResponse('cannot_edit_completed_match', 400);
        }

        const { count } = await supabase
          .from('matchplay_matches')
          .select('*', { count: 'exact', head: true })
          .eq('round_id', m.round_id)
          .eq('status', 'completed');

        if ((count ?? 0) > 0) {
          return errorResponse('round_locked_after_first_score', 400);
        }

        const { data: eventPlayers } = await supabase
          .from('matchplay_players')
          .select('id')
          .eq('event_id', m.event_id);
        const validPlayerIds = new Set((eventPlayers ?? []).map((p) => p.id));

        const allIds = [...team_a, ...team_b];
        for (const id of allIds) {
          if (!validPlayerIds.has(id)) {
            return errorResponse('player_not_in_event', 400);
          }
        }

        const { data: otherMatches } = await supabase
          .from('matchplay_matches')
          .select('team_a_player_1_id, team_a_player_2_id, team_b_player_1_id, team_b_player_2_id')
          .eq('round_id', m.round_id)
          .neq('id', match_id);

        const otherPlayerIds = new Set<string>();
        for (const om of otherMatches ?? []) {
          const o = om as Record<string, string>;
          otherPlayerIds.add(o.team_a_player_1_id);
          otherPlayerIds.add(o.team_a_player_2_id);
          otherPlayerIds.add(o.team_b_player_1_id);
          otherPlayerIds.add(o.team_b_player_2_id);
        }

        for (const id of allIds) {
          if (otherPlayerIds.has(id)) {
            return errorResponse('player_already_in_another_match_this_round', 400);
          }
        }

        const { data: updatedMatch, error: updateErr } = await supabase
          .from('matchplay_matches')
          .update({
            team_a_player_1_id: team_a[0],
            team_a_player_2_id: team_a[1],
            team_b_player_1_id: team_b[0],
            team_b_player_2_id: team_b[1],
            updated_at: new Date().toISOString(),
          })
          .eq('id', match_id)
          .select()
          .single();

        if (updateErr) {
          console.error('matchplay-round update_match error:', updateErr);
          return errorResponse(updateErr.message, 500);
        }

        return jsonResponse({ success: true, match: updatedMatch });
      }

      case 'get_round': {
        const { round_id } = body as GetRoundInput;
        if (!round_id) return errorResponse('round_id is required');

        const { data: round, error } = await supabase
          .from('matchplay_rounds')
          .select('*')
          .eq('id', round_id)
          .single();

        if (error || !round) {
          return errorResponse('round_not_found', 404);
        }

        const { data: matches } = await supabase
          .from('matchplay_matches')
          .select('*')
          .eq('round_id', round_id);

        const playerIds = new Set<string>();
        for (const m of matches ?? []) {
          const match = m as Record<string, string>;
          playerIds.add(match.team_a_player_1_id);
          playerIds.add(match.team_a_player_2_id);
          playerIds.add(match.team_b_player_1_id);
          playerIds.add(match.team_b_player_2_id);
        }

        const { data: players } = await supabase
          .from('matchplay_players')
          .select('id, name, photo_url')
          .in('id', Array.from(playerIds));

        const nameMap = new Map<string, string>();
        const photoMap = new Map<string, string | null>();
        for (const p of players ?? []) {
          const row = p as { id: string; name?: string | null; photo_url?: string | null };
          nameMap.set(row.id, row.name ?? '');
          photoMap.set(row.id, row.photo_url ?? null);
        }

        const matchesWithNames = (matches ?? []).map((m: Record<string, unknown>) => {
          const match = m as Record<string, string>;
          return {
            ...m,
            team_a_player_1_name: nameMap.get(match.team_a_player_1_id) ?? '',
            team_a_player_2_name: nameMap.get(match.team_a_player_2_id) ?? '',
            team_b_player_1_name: nameMap.get(match.team_b_player_1_id) ?? '',
            team_b_player_2_name: nameMap.get(match.team_b_player_2_id) ?? '',
            team_a_player_1_photo_url: photoMap.get(match.team_a_player_1_id) ?? null,
            team_a_player_2_photo_url: photoMap.get(match.team_a_player_2_id) ?? null,
            team_b_player_1_photo_url: photoMap.get(match.team_b_player_1_id) ?? null,
            team_b_player_2_photo_url: photoMap.get(match.team_b_player_2_id) ?? null,
          };
        });

        return jsonResponse({ success: true, round: { ...round, matches: matchesWithNames } });
      }

      case 'list_rounds': {
        const { event_id } = body as ListRoundsInput;
        if (!event_id) return errorResponse('event_id is required');

        const { data: rounds, error } = await supabase
          .from('matchplay_rounds')
          .select('*')
          .eq('event_id', event_id)
          .order('round_number', { ascending: true });

        if (error) {
          console.error('matchplay-round list_rounds error:', error);
          return errorResponse(error.message, 500);
        }

        const summaries = await Promise.all(
          (rounds ?? []).map(async (r) => {
            const { count } = await supabase
              .from('matchplay_matches')
              .select('*', { count: 'exact', head: true })
              .eq('round_id', r.id);
            const { count: completed } = await supabase
              .from('matchplay_matches')
              .select('*', { count: 'exact', head: true })
              .eq('round_id', r.id)
              .eq('status', 'completed');
            return {
              ...r,
              match_count: count ?? 0,
              completed_count: completed ?? 0,
            };
          })
        );

        return jsonResponse({ success: true, rounds: summaries });
      }

      case 'start_round': {
        const { round_id } = body as StartRoundInput;
        if (!round_id) return errorResponse('round_id is required');

        const { data, error } = await supabase
          .from('matchplay_rounds')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', round_id)
          .select()
          .single();

        if (error) {
          console.error('matchplay-round start_round error:', error);
          return errorResponse(error.message, 500);
        }
        if (!data) return errorResponse('round_not_found', 404);
        return jsonResponse({ success: true, round: data });
      }

      case 'complete_round': {
        const { round_id } = body as CompleteRoundInput;
        if (!round_id) return errorResponse('round_id is required');

        const { data, error } = await supabase
          .from('matchplay_rounds')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', round_id)
          .select()
          .single();

        if (error) {
          console.error('matchplay-round complete_round error:', error);
          return errorResponse(error.message, 500);
        }
        if (!data) return errorResponse('round_not_found', 404);
        return jsonResponse({ success: true, round: data });
      }

      case 'delete_round': {
        const { round_id } = body as DeleteRoundInput;
        if (!round_id) return errorResponse('round_id is required');

        const { data: round, error: fetchErr } = await supabase
          .from('matchplay_rounds')
          .select('id')
          .eq('id', round_id)
          .single();

        if (fetchErr || !round) {
          return errorResponse('round_not_found', 404);
        }

        const { count } = await supabase
          .from('matchplay_matches')
          .select('*', { count: 'exact', head: true })
          .eq('round_id', round_id)
          .eq('status', 'completed');

        if ((count ?? 0) > 0) {
          return errorResponse('can_only_delete_rounds_with_no_completed_matches', 400);
        }

        const { error: delMatchesErr } = await supabase
          .from('matchplay_matches')
          .delete()
          .eq('round_id', round_id);

        if (delMatchesErr) {
          console.error('matchplay-round delete matches error:', delMatchesErr);
          return errorResponse(delMatchesErr.message, 500);
        }

        const { error: delRoundErr } = await supabase
          .from('matchplay_rounds')
          .delete()
          .eq('id', round_id);

        if (delRoundErr) {
          console.error('matchplay-round delete_round error:', delRoundErr);
          return errorResponse(delRoundErr.message, 500);
        }

        return jsonResponse({ success: true });
      }

      default:
        return errorResponse('invalid_action');
    }
  } catch (err) {
    console.error('matchplay-round error:', err);
    return errorResponse('unexpected_error', 500);
  }
});
