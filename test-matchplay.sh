#!/bin/bash

# ============================================================
# PalaPoint Matchplay - Edge Function Test Script
# ============================================================
#
SUPABASE_URL="https://heapuqojxnuejpveplvx.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYXB1cW9qeG51ZWpwdmVwbHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMDYyMzEsImV4cCI6MjA4Mzc4MjIzMX0.5tiu0upPCX3rFhZpH-8_quMD7phm1VsrwNLczjEKurk"
VENUE_ID="b0000000-0000-0000-0000-000000000001"
#
# Run: chmod +x test-matchplay.sh && ./test-matchplay.sh
# ============================================================

BASE="$SUPABASE_URL/functions/v1"
AUTH="Authorization: Bearer $ANON_KEY"
CT="Content-Type: application/json"

echo "============================================"
echo "TEST 1: Create Event"
echo "============================================"
EVENT_RESPONSE=$(curl -s -X POST "$BASE/matchplay-event" \
  -H "$AUTH" -H "$CT" \
  -d "{
    \"action\": \"create\",
    \"venue_id\": \"$VENUE_ID\",
    \"name\": \"Test Matchplay - $(date +%H:%M)\",
    \"court_count\": 2,
    \"match_format\": \"timed\",
    \"match_duration_minutes\": 10,
    \"game_mode\": \"golden_point\"
  }")

echo "$EVENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$EVENT_RESPONSE"

# Extract event ID (response: { success, event: { id, ... } })
EVENT_ID=$(echo "$EVENT_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); e=d.get('event',d); print(e.get('id',''))" 2>/dev/null)

if [ -z "$EVENT_ID" ] || [ "$EVENT_ID" = "" ]; then
  echo ""
  echo "❌ Failed to create event. Check the response above."
  echo "   Common issues:"
  echo "   - Edge Function not deployed (run deploy commands first)"
  echo "   - Wrong SUPABASE_URL or ANON_KEY"
  echo "   - Wrong VENUE_ID (must exist in venues table)"
  exit 1
fi

echo ""
echo "✅ Event created: $EVENT_ID"
echo ""

echo "============================================"
echo "TEST 2: Add Players (bulk)"
echo "============================================"
PLAYERS_RESPONSE=$(curl -s -X POST "$BASE/matchplay-player" \
  -H "$AUTH" -H "$CT" \
  -d "{
    \"action\": \"add_bulk\",
    \"event_id\": \"$EVENT_ID\",
    \"names\": [\"Alice\", \"Bob\", \"Charlie\", \"Diana\", \"Eve\", \"Frank\", \"Grace\", \"Harry\"]
  }")

echo "$PLAYERS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PLAYERS_RESPONSE"

# Extract player IDs (response: { success, players: [...] })
P1=$(echo "$PLAYERS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('players',d if isinstance(d,list) else []); print(p[0]['id'] if p and len(p)>0 else '')" 2>/dev/null)
P2=$(echo "$PLAYERS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('players',d if isinstance(d,list) else []); print(p[1]['id'] if p and len(p)>1 else '')" 2>/dev/null)
P3=$(echo "$PLAYERS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('players',d if isinstance(d,list) else []); print(p[2]['id'] if p and len(p)>2 else '')" 2>/dev/null)
P4=$(echo "$PLAYERS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('players',d if isinstance(d,list) else []); print(p[3]['id'] if p and len(p)>3 else '')" 2>/dev/null)
P5=$(echo "$PLAYERS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('players',d if isinstance(d,list) else []); print(p[4]['id'] if p and len(p)>4 else '')" 2>/dev/null)
P6=$(echo "$PLAYERS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('players',d if isinstance(d,list) else []); print(p[5]['id'] if p and len(p)>5 else '')" 2>/dev/null)
P7=$(echo "$PLAYERS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('players',d if isinstance(d,list) else []); print(p[6]['id'] if p and len(p)>6 else '')" 2>/dev/null)
P8=$(echo "$PLAYERS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('players',d if isinstance(d,list) else []); print(p[7]['id'] if p and len(p)>7 else '')" 2>/dev/null)

if [ -z "$P1" ]; then
  echo ""
  echo "❌ Failed to add players. Check response above."
  echo "   The response format might differ from expected."
  echo "   Check Supabase Function logs for errors."
  exit 1
fi

echo ""
echo "✅ 8 players added"
echo "   Alice=$P1, Bob=$P2, Charlie=$P3, Diana=$P4"
echo "   Eve=$P5, Frank=$P6, Grace=$P7, Harry=$P8"
echo ""

echo "============================================"
echo "TEST 3: Create Round 1 (2 matches)"
echo "============================================"
ROUND_RESPONSE=$(curl -s -X POST "$BASE/matchplay-round" \
  -H "$AUTH" -H "$CT" \
  -d "{
    \"action\": \"create_round\",
    \"event_id\": \"$EVENT_ID\",
    \"round_number\": 1,
    \"matches\": [
      {
        \"court_label\": \"Court 1\",
        \"team_a\": [\"$P1\", \"$P2\"],
        \"team_b\": [\"$P3\", \"$P4\"]
      },
      {
        \"court_label\": \"Court 2\",
        \"team_a\": [\"$P5\", \"$P6\"],
        \"team_b\": [\"$P7\", \"$P8\"]
      }
    ]
  }")

echo "$ROUND_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ROUND_RESPONSE"

# Extract match IDs (response: { success, round: { matches: [...] } })
MATCH1=$(echo "$ROUND_RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r = d.get('round', d)
matches = r.get('matches', [])
if isinstance(matches, list) and len(matches) > 0:
    print(matches[0]['id'])
else:
    print('')
" 2>/dev/null)

MATCH2=$(echo "$ROUND_RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r = d.get('round', d)
matches = r.get('matches', [])
if isinstance(matches, list) and len(matches) > 1:
    print(matches[1]['id'])
else:
    print('')
" 2>/dev/null)

if [ -z "$MATCH1" ]; then
  echo ""
  echo "⚠️  Could not extract match IDs automatically."
  echo "   Check the response above and find the match IDs manually."
  echo "   Then run the enter_result calls below with the correct IDs."
  echo ""
  echo "   Or check Supabase dashboard: SELECT * FROM matchplay_matches WHERE event_id = '$EVENT_ID';"
fi

echo ""
echo "✅ Round 1 created with 2 matches"
echo "   Match 1 (Court 1): $MATCH1"
echo "   Match 2 (Court 2): $MATCH2"
echo ""

echo "============================================"
echo "TEST 4: Enter Results"
echo "============================================"
echo "Match 1: Alice+Bob 9 - 2 Charlie+Diana"
RESULT1=$(curl -s -X POST "$BASE/matchplay-round" \
  -H "$AUTH" -H "$CT" \
  -d "{
    \"action\": \"enter_result\",
    \"match_id\": \"$MATCH1\",
    \"team_a_score\": 9,
    \"team_b_score\": 2
  }")

echo "$RESULT1" | python3 -m json.tool 2>/dev/null || echo "$RESULT1"
echo ""

echo "Match 2: Eve+Frank 5 - 5 Grace+Harry (draw)"
RESULT2=$(curl -s -X POST "$BASE/matchplay-round" \
  -H "$AUTH" -H "$CT" \
  -d "{
    \"action\": \"enter_result\",
    \"match_id\": \"$MATCH2\",
    \"team_a_score\": 5,
    \"team_b_score\": 5
  }")

echo "$RESULT2" | python3 -m json.tool 2>/dev/null || echo "$RESULT2"
echo ""

echo "============================================"
echo "TEST 5: Check Standings"
echo "============================================"
STANDINGS=$(curl -s -X POST "$BASE/matchplay-player" \
  -H "$AUTH" -H "$CT" \
  -d "{
    \"action\": \"standings\",
    \"event_id\": \"$EVENT_ID\"
  }")

echo "$STANDINGS" | python3 -m json.tool 2>/dev/null || echo "$STANDINGS"
echo ""

echo "============================================"
echo "EXPECTED STANDINGS:"
echo "============================================"
echo "1. Alice   - 3 pts, W:1 D:0 L:0, GW:9 GL:2 GD:+7"
echo "2. Bob     - 3 pts, W:1 D:0 L:0, GW:9 GL:2 GD:+7"
echo "3. Eve     - 1 pt,  W:0 D:1 L:0, GW:5 GL:5 GD:0"
echo "4. Frank   - 1 pt,  W:0 D:1 L:0, GW:5 GL:5 GD:0"
echo "5. Grace   - 1 pt,  W:0 D:1 L:0, GW:5 GL:5 GD:0"
echo "6. Harry   - 1 pt,  W:0 D:1 L:0, GW:5 GL:5 GD:0"
echo "7. Charlie - 0 pts, W:0 D:0 L:1, GW:2 GL:9 GD:-7"
echo "8. Diana   - 0 pts, W:0 D:0 L:1, GW:2 GL:9 GD:-7"
echo ""
echo "Compare the actual standings above with the expected values."
echo "If they match, your Edge Functions are working correctly! 🎉"
echo ""
echo "============================================"
echo "CLEANUP (optional)"
echo "============================================"
echo "To delete the test event, run in Supabase SQL Editor:"
echo "DELETE FROM matchplay_events WHERE id = '$EVENT_ID';"
echo "(CASCADE will clean up players, rounds, and matches)"
