# Matchplay event hub (`/matchplay/[id]`)

This document describes the **staff event hub** implemented as a single client page:

**File:** [`app/matchplay/[id]/page.tsx`](../app/matchplay/[id]/page.tsx)

Related UI styles live in [`app/styles/matchplay.css`](../app/styles/matchplay.css). Data writes go through Supabase Edge Functions (`matchplay-event`, `matchplay-player`, `matchplay-round`), not direct table mutations from this page.

**Related routes**

- Full-screen roster management (photos + add/remove): [`app/matchplay/[id]/players/page.tsx`](../app/matchplay/[id]/players/page.tsx)
- Full-screen standings: [`app/matchplay/[id]/standings/page.tsx`](../app/matchplay/[id]/standings/page.tsx)
- Board TV UI: [`/matchplay/[id]/board`](./matchplay-board-audit-v2.md) — separate from this page.

---

## 1. Page structure (what makes up the UI)

Everything **for rounds / scoring / resting / footer** is rendered by **`MatchplayEventPage`** — **Players** and **Standings** are **navigation routes**, not overlays.

| Region | Purpose |
|--------|---------|
| **Header** (`matchplay-hub-header`) | Back → `/matchplay`, **Event** title, **⋮** menu (`matchplay-hub-menu`): **Players** (always); **Standings** + **End Event** when `in_progress` |
| **Round tabs** (`matchplay-event-round-tabs`) | Horizontal tabs per round; shows ✓ when completed, dot when in progress; clicking sets `selectedRoundId` |
| **Error banner** | Inline `error` state below tabs |
| **Match list** (`matchplay-event-matches`) | Cards for each match in **`viewingRound`** (derived from `selectedRoundId`) |
| **Resting block** (`matchplay-event-resting`) | Players not assigned to any match this round + optional sit-out counts |
| **Footer** (`matchplay-event-footer`) | Context actions (see §5) |
| **Modals** (conditional overlays) | Edit match lineups, **End Event** confirmation (`matchplay-hub-end-modal`), **End Event summary** (`matchplay-end-summary` via `matchplay-modal-overlay`) |

**Small shared UI**

- [`ScoreSepBar`](../components/ui/ScoreSepBar.tsx) — decorative separator between scores on completed match rows.

---

## 2. State management

### Core entities (server-shaped)

| State | Type | Meaning |
|-------|------|---------|
| `event` | `MatchplayEvent \| null` | Current event metadata (`status`, `name`, `court_labels`, `match_target_score`, …) |
| `players` | `MatchplayPlayer[]` | Roster |
| `rounds` | `MatchplayRound[]` | Each round includes nested **`matches`** after `get_round` |

### UI / interaction state

| State | Role |
|-------|------|
| `loading`, `error` | Initial load and global errors |
| `actionLoading` | Single string discriminant for long actions (`'start' \| 'complete' \| 'edit'`, …) |
| **`selectedRoundId`** | Which round tab is active; **`viewingRound`** = `rounds.find(r => r.id === selectedRoundId)` |
| **`expandedMatchId`** | At most one **pending** match expanded for **inline score entry** |
| **`draftScores`** | `Record<matchId, { a, b }>` — stepper edits before confirm (American: Team B score derived from `maxScore - scoreA`) |
| **`submittingMatchId`** | Disables confirm while `enter_result` runs |
| **`showEditMatchModal`**, **`showMenu`**, **`showEndConfirm`**, **`showEndSummary`** | Menu dropdown + overlay visibility (`menuRef`; outside dismiss on pointerdown). **`showEndSummary`** drives post-complete recap UI (winner name/points if ranked leaders exist, player count, completed-round count). |
| **`editMatchAssignments`** | Form state for Edit Match modal |
| **`pairingGeneratedRef`** | Prevents duplicate client-side round creation when React effects re-run |
| **`roundTabsRef`** | Scroll selected tab into view |

### Derived flags (examples)

- **`viewingRound`** — active round for match list + resting calculation.
- **`allMatchesScoredInCurrentRound`** — every match in `viewingRound` has `status === 'completed'`.
- **`isFinalRound`** — viewing round number ≥ last round number.
- **`canEdit`** (setup only for edit button) — non-American OR (setup OR live with no completed match yet in current round) — controls **EDIT** on setup cards.
- Footer swaps **NEXT ROUND** vs **END EVENT** using `isFinalRound`, `allMatchesScoredInCurrentRound`, and `event.status`.

### Round selection sync

- When `rounds` loads or changes, an effect picks **`selectedRoundId`**: prefers first round with `status !== 'completed'`, else last round.
- Another effect scrolls the active tab into view horizontally.

---

## 3. Score entry flow (**inline**, not modal / not separate page)

There is **no** dedicated score route and **no** score modal.

1. **Pending** match → compact card (`matchplay-event-match-card-pending`). **Tap / Enter** sets **`expandedMatchId`** to that match’s id.
2. **Expanded** card (`matchplay-event-match-card-expanded`) shows:
   - **Steppers** for Team A (always) and Team B (**fixed-sum Americano**: only Team A is stepped; Team B display = `maxScore - scoreA`; **non-American**: both teams have steppers).
   - Optional **result preview** line when scores &gt; 0.
   - **CANCEL** — collapses, clears drafts for that match id.
   - **CONFIRM** — calls **`handleEnterResult`** → Edge Function `matchplay-round` action **`enter_result`** with `team_a_score` / `team_b_score`. On a completed match being corrected, the primary action label is **UPDATE**.
3. **Completed** match → read-only summary row with scores and ✓.
4. **Setup** mode → match rows are preview-only with optional **EDIT** opening the **Edit Match** modal (lineup changes), not score entry.

Only **one** match is expanded at a time (`expandedMatchId` single value).

---

## 4. Data fetching & realtime

### Initial load (`useEffect` on `eventId`)

Sequential:

1. **`loadEvent`** — `callMatchplayEvent({ action: 'get', event_id })`
2. **`loadPlayers`** — `callMatchplayPlayer({ action: 'list', event_id })`
3. **`loadRounds`** — `callMatchplayRound({ action: 'list_rounds', event_id })`, then for **each** round `callMatchplayRound({ action: 'get_round', round_id })` to attach **`matches`**, then sort by `round_number`.

Standings are **not** loaded on this screen except briefly inside **`handleEndEventConfirmed`** (same **`standings`** Edge Function action) to derive winner summary labels **before** calling **`complete`**.

### Pairing generation (client → API)

When **`event`** and **`players`** exist, **`rounds.length === 0`**, status is `setup` or `in_progress`, and **`pairingGeneratedRef`** allows it:

1. **`generateAmericanoPairings(playerIds, courtLabels)`** from [`lib/matchplay-americano-pairings.ts`](../lib/matchplay-americano-pairings.ts) runs in the browser (circle method).
2. Round count is capped by **`getMatchplayTotalRoundsFromStorage()`**, which reads **`localStorage`** key **`palapoint_matchplay_settings`** (`rounds` / `roundsCustom`) — same storage written during `/matchplay/new` setup.
3. For each planned round number not already present, **`callMatchplayRound({ action: 'create_round', ... })`** creates DB rounds + matches.

### Realtime (`supabase.channel`)

Single channel per `eventId` listens to:

- **`matchplay_players`** → `loadPlayers()`
- **`matchplay_matches`** → `loadRounds()`
- **`matchplay_rounds`** → `loadRounds()`

### Regenerating rounds after roster changes

On **[`/matchplay/[id]/players`**](../app/matchplay/[id]/players/page.tsx), **`regenerateFutureRounds`** mirrors hub logic:

- Deletes **future** rounds (relative to current incomplete round, or all non-completed rounds in **setup**).
- Recreates missing rounds from **`generateAmericanoPairings`** again up to the same cap.

On **this hub page**, roster edits happen only via navigation to `/players`; **`regenerateFutureRounds`** remains on **players route**.

---

## 5. Actions available

### Header

| Control | When | Behavior |
|---------|------|----------|
| **← Back** | Always | `router.push('/matchplay')` |
| **⋮ → Players** | Always | `router.push('/matchplay/[id]/players')` |
| **⋮ → Standings** | `in_progress` only | `router.push('/matchplay/[id]/standings')` |
| **⋮ → End Event** | `in_progress` only | Opens confirmation modal → **`handleEndEventConfirmed`** (see below). |

### End Event confirmation → completion summary

**`handleEndEventConfirmed`**:

1. **`matchplay-player` `standings`** — derive tied‑leader label (`rank === 1`; joined with **` & `**).
2. **`matchplay-event` `complete`**.
3. Clear **`showEndConfirm`**, set **`showEndSummary`** with winner (nullable), **`players.length`**, count of rounds with `status === 'completed'`.
4. Summary CTAs: **View Final Standings** → `/matchplay/[id]/standings`, **Start New Event** → `/matchplay`.

### Footer

| Button | When | Behavior |
|--------|------|----------|
| **START EVENT** | `setup` | `matchplay-event` **`start`**, then **`start_round`** on round 1, `loadRounds()`. Disabled if &lt; 4 players or action in flight. |
| **NEXT ROUND** | `in_progress`, not “final end” branch | Selects next round; if next is `pending`, **`start_round`**. Disabled until **all** matches in **current** viewing round are completed **or** already on final round (see JSX). |
| **END EVENT** | `in_progress` **and** on **final** round **and** all matches in that round completed | Opens the same **End Event** confirmation modal as the ⋮ menu (`complete`). |
| *(none)* | `completed` | No footer CTAs rendered |

### Match cards

| Action | When |
|--------|------|
| Tap pending card | Expand inline scorer |
| **EDIT** (setup) | Open **Edit Match** modal; save calls **`update_match`** |

### Modals / overlays

| Overlay | Actions |
|---------|---------|
| **End Event confirm** | Warning copy + **Cancel** / **End Event** (solid danger); see **`handleEndEventConfirmed`** above. |
| **End Event summary** | Trophy-style recap + primary / secondary navigation buttons |
| **Edit Match** | Four dropdowns (Team A/B × 2 players), save → **`update_match`** |

---

## 6. API surface (Edge Functions)

All use `POST` to Supabase Functions with anon JWT:

| Function | Actions used on this page |
|----------|---------------------------|
| **`matchplay-event`** | `get`, `start`, `complete` |
| **`matchplay-player`** | `list`, `standings` (only during end-flow summary preparation on hub); **`add` / `remove` / `update` / `standings`** live on **`/players`** |
| **`matchplay-round`** | `list_rounds`, `get_round`, `create_round`, `start_round`, `enter_result`, `delete_round`, `update_match` |

---

## 7. Mental model summary

- **One big client component** drives header (⋮ menu), tabs, match list, resting, footer, and overlays (**edit match**, **end-event confirm**, **end-event summary**).
- **Players** and **Standings** are **full-screen routes** (`/players`, `/standings`) linked from the menu.
- **Scores** are entered **inline** by expanding a pending card; submission is **`enter_result`**.
- **Rounds/matches** come from the **`matchplay-round`** API; **pairing math** for new rounds is **`generateAmericanoPairings`** in **`lib/matchplay-americano-pairings.ts`**, then persisted via **`create_round`** on hub startup **and** on **`/players`** roster edits.

If this doc drifts from code, treat [`page.tsx`](../app/matchplay/[id]/page.tsx) as source of truth.
