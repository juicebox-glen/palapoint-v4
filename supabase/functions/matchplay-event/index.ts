// ============================================================
// PALAPOINT V4 - MATCHPLAY EVENT EDGE FUNCTION
// Manages event lifecycle: create, update, start, complete, delete, get, list
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action =
  | 'create'
  | 'update'
  | 'start'
  | 'complete'
  | 'delete'
  | 'get'
  | 'list';

interface CreateInput {
  action: 'create';
  venue_id: string;
  name: string;
  format?: string;
  scoring_type?: string;
  win_points?: number;
  draw_points?: number;
  loss_points?: number;
  match_format?: string;
  match_duration_minutes?: number;
  match_target_score?: number;
  game_mode?: string;
  court_count?: number;
  court_labels?: string[];
}

interface UpdateInput {
  action: 'update';
  event_id: string;
  name?: string;
  format?: string;
  scoring_type?: string;
  win_points?: number;
  draw_points?: number;
  loss_points?: number;
  match_format?: string;
  match_duration_minutes?: number;
  match_target_score?: number;
  game_mode?: string;
  court_count?: number;
  court_labels?: string[];
}

interface StartInput {
  action: 'start';
  event_id: string;
}

interface CompleteInput {
  action: 'complete';
  event_id: string;
}

interface DeleteInput {
  action: 'delete';
  event_id: string;
}

interface GetInput {
  action: 'get';
  event_id: string;
}

interface ListInput {
  action: 'list';
  venue_id: string;
}

type RequestInput =
  | CreateInput
  | UpdateInput
  | StartInput
  | CompleteInput
  | DeleteInput
  | GetInput
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
      case 'create': {
        const { venue_id, name } = body as CreateInput;
        if (!venue_id || !name?.trim()) {
          return errorResponse('venue_id and name are required');
        }

        const input = body as CreateInput;
        let court_labels = input.court_labels;
        if (!court_labels && input.court_count != null) {
          court_labels = Array.from({ length: input.court_count }, (_, i) => `Court ${i + 1}`);
        }
        if (!court_labels?.length && input.court_count) {
          court_labels = Array.from({ length: input.court_count }, (_, i) => `Court ${i + 1}`);
        }

        const insert: Record<string, unknown> = {
          venue_id,
          name: name.trim(),
          format: input.format ?? 'curated',
          scoring_type: input.scoring_type ?? 'win_draw_loss',
          win_points: input.win_points ?? 3,
          draw_points: input.draw_points ?? 1,
          loss_points: input.loss_points ?? 0,
          match_format: input.match_format ?? 'timed',
          match_duration_minutes: input.match_duration_minutes ?? null,
          match_target_score: input.match_target_score ?? null,
          game_mode: input.game_mode ?? 'golden_point',
          court_count: input.court_count ?? 2,
          court_labels: court_labels ?? ['Court 1', 'Court 2'],
        };

        const { data, error } = await supabase
          .from('matchplay_events')
          .insert(insert)
          .select()
          .single();

        if (error) {
          console.error('matchplay-event create error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true, event: data });
      }

      case 'update': {
        const { event_id, ...fields } = body as UpdateInput;
        if (!event_id) return errorResponse('event_id is required');

        const { data: event, error: fetchErr } = await supabase
          .from('matchplay_events')
          .select('status')
          .eq('id', event_id)
          .single();

        if (fetchErr || !event) {
          return errorResponse('event_not_found', 404);
        }
        if (event.status !== 'setup') {
          return errorResponse('can_only_update_event_in_setup');
        }

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        const allowed = [
          'name', 'format', 'scoring_type', 'win_points', 'draw_points', 'loss_points',
          'match_format', 'match_duration_minutes', 'match_target_score', 'game_mode',
          'court_count', 'court_labels',
        ];
        for (const k of allowed) {
          const v = (fields as Record<string, unknown>)[k];
          if (v !== undefined) updates[k] = v;
        }

        const { data, error } = await supabase
          .from('matchplay_events')
          .update(updates)
          .eq('id', event_id)
          .select()
          .single();

        if (error) {
          console.error('matchplay-event update error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true, event: data });
      }

      case 'start': {
        const { event_id } = body as StartInput;
        if (!event_id) return errorResponse('event_id is required');

        const { data: event, error: fetchErr } = await supabase
          .from('matchplay_events')
          .select('status')
          .eq('id', event_id)
          .single();

        if (fetchErr || !event) {
          return errorResponse('event_not_found', 404);
        }
        if (event.status !== 'setup') {
          return errorResponse('event_already_started_or_completed');
        }

        const { data, error } = await supabase
          .from('matchplay_events')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', event_id)
          .select()
          .single();

        if (error) {
          console.error('matchplay-event start error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true, event: data });
      }

      case 'complete': {
        const { event_id } = body as CompleteInput;
        if (!event_id) return errorResponse('event_id is required');

        const { data, error } = await supabase
          .from('matchplay_events')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', event_id)
          .select()
          .single();

        if (error) {
          console.error('matchplay-event complete error:', error);
          return errorResponse(error.message, 500);
        }
        if (!data) return errorResponse('event_not_found', 404);
        return jsonResponse({ success: true, event: data });
      }

      case 'delete': {
        const { event_id } = body as DeleteInput;
        if (!event_id) return errorResponse('event_id is required');

        const { data: event, error: fetchErr } = await supabase
          .from('matchplay_events')
          .select('status')
          .eq('id', event_id)
          .single();

        if (fetchErr || !event) {
          return errorResponse('event_not_found', 404);
        }
        if (event.status !== 'setup') {
          return errorResponse('cannot_delete_event_in_progress_or_completed');
        }

        const { error } = await supabase
          .from('matchplay_events')
          .delete()
          .eq('id', event_id);

        if (error) {
          console.error('matchplay-event delete error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true });
      }

      case 'get': {
        const { event_id } = body as GetInput;
        if (!event_id) return errorResponse('event_id is required');

        const { data: event, error } = await supabase
          .from('matchplay_events')
          .select('*')
          .eq('id', event_id)
          .single();

        if (error || !event) {
          return errorResponse('event_not_found', 404);
        }

        const { count } = await supabase
          .from('matchplay_players')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event_id);

        return jsonResponse({ success: true, event: { ...event, player_count: count ?? 0 } });
      }

      case 'list': {
        const { venue_id } = body as ListInput;
        if (!venue_id) return errorResponse('venue_id is required');

        const { data, error } = await supabase
          .from('matchplay_events')
          .select('*')
          .eq('venue_id', venue_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('matchplay-event list error:', error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true, events: data ?? [] });
      }

      default:
        return errorResponse('invalid_action');
    }
  } catch (err) {
    console.error('matchplay-event error:', err);
    return errorResponse('unexpected_error', 500);
  }
});
