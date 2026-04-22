# Matchplay (social events) — implementation audit

**Repo:** `palapoint-v4`  
**Date:** 2026-04-15  
**Scope:** Matchplay / Americano-style social events, TV board, and how they relate to court **spectator** (`SpectatorDisplay`).

> **Note:** The brief asked for `/mnt/user-data/outputs/matchplay-audit-report.md`. That path is not in this workspace; the canonical copy lives at **`docs/matchplay-audit-report.md`**. Copy it to your outputs folder if needed.

---

## 1. Files inventory

### Filename / path contains `matchplay`

| Path |
|------|
| `app/matchplay/page.tsx` |
| `app/matchplay/new/page.tsx` |
| `app/matchplay/new/players/page.tsx` |
| `app/matchplay/[id]/page.tsx` |
| `app/matchplay/[id]/board/page.tsx` |
| `app/styles/matchplay.css` |
| `app/styles/matchplay-board.css` |
| `app/design-system/preview/matchplay/page.tsx` |
| `app/design-system/preview/matchplay/MatchplayPreviewStates.tsx` |
| `app/design-system/screens/matchplay/page.tsx` |
| `supabase/functions/matchplay-event/index.ts` |
| `supabase/functions/matchplay-player/index.ts` |
| `supabase/functions/matchplay-round/index.ts` |
| `test-matchplay.sh` |
| `PalaPoint-V4-Social-Matchplay-Spec.docx` |

### TS/TSX/CSS referencing `matchplay` (excluding `.next` / `node_modules`)

Also: `app/globals.css` (likely imports), `lib/supabase.ts` (`getMatchplayVenueId`, `getFirstCourtForVenue`, PIN helpers used by matchplay launcher).

### No `components/matchplay/` directory

All matchplay UI is implemented **inline in `app/matchplay/**/page.tsx`** files (large client pages), not as reusable components under `components/`.

### TV / spectator / leaderboard strings (high level)

| Area | Location |
|------|----------|
| **Matchplay TV board** | `app/matchplay/[id]/board/page.tsx` + `app/styles/matchplay-board.css` |
| **Court spectator (match)** | `app/live/[[...segments]]/page.tsx` → `components/displays/spectator/*` |
| **Standings (tablet modal)** | `app/matchplay/[id]/page.tsx` — `matchplay-standings` table inside modal |
| **Standings (TV board)** | `app/matchplay/[id]/board/page.tsx` — `board-standings` / podium layouts |

**`GradientWaveDrift`:** Used in **`SpectatorLive`** and **`SpectatorPregame`** only — **not** used on the matchplay event board (`board` page uses `matchplay-board.css` only).

---

## 2. Route map (`/app`)

| Route | Renders | Audience | Viewport | Status |
|-------|---------|----------|----------|--------|
| `/matchplay` | `app/matchplay/page.tsx` | Staff (PIN-gated via venue’s first court + `control_tokens`) | Tablet-first | **Working** (needs env: `NEXT_PUBLIC_SUPABASE_*`, optional `NEXT_PUBLIC_MATCHPLAY_VENUE_ID`) |
| `/matchplay/new` | `app/matchplay/new/page.tsx` | Staff — format / courts / rounds | Tablet | **Working** (edge `matchplay-event` create/update) |
| `/matchplay/new/players` | `app/matchplay/new/players/page.tsx` | Staff — player list | Tablet | **Working** (`matchplay-player` add/list) |
| `/matchplay/[id]` | `app/matchplay/[id]/page.tsx` | Staff — rounds, score entry, modals | Tablet | **Working** + **realtime** on `matchplay_players`, `matchplay_matches`, `matchplay_rounds` |
| `/matchplay/[id]/board` | `app/matchplay/[id]/board/page.tsx` | **Spectator / TV** for the **event** (standings, fixtures, feed) | TV (1920×1080 assumed) | **Working** + **realtime** on same tables + `matchplay_events` |
| `/live/[courtSlug]` | `app/live/[[...segments]]/page.tsx` | **Spectator / TV** for a **court match** (`SpectatorDisplay`) | TV | **Working** (separate product surface from matchplay board) |
| `/design-system/preview/matchplay` | Static `MatchplayPreviewStates` | Docs | Tablet / TV states | **Placeholder markup** (no Supabase) |
| `/design-system/screens/matchplay` | Design-system doc page | Docs | — | **Documentation** |

There is **no** route like `/matchplay/[company]/[venue]` today; venue scoping is via **`venue_id`** on events + env `NEXT_PUBLIC_MATCHPLAY_VENUE_ID` or first row in `venues`.

---

## 3. Edge functions (`supabase/functions/`)

All three expect **POST JSON** with an `action` field. Responses are generally `{ success: true, ... }` or `{ success: false, error: string }`.

### `matchplay-event`

| Action | Purpose | Key request fields | Response |
|--------|---------|-------------------|----------|
| `create` | Insert `matchplay_events` | `venue_id`, `name`, optional format/scoring/courts/game_mode/… | `{ success, event }` |
| `update` | Update event (only if `status === 'setup'`) | `event_id`, optional allowed fields | `{ success, event }` |
| `start` | Set `in_progress`, `started_at` | `event_id` | `{ success, event }` |
| `complete` | Set `completed`, `completed_at` | `event_id` | `{ success, event }` |
| `delete` | Delete event (only if `setup`) | `event_id` | `{ success }` |
| `get` | Event row + player count | `event_id` | `{ success, event: { …, player_count } }` |
| `list` | Events for venue | `venue_id` | `{ success, events }` |

### `matchplay-player`

| Action | Purpose | Key request fields | Response |
|--------|---------|-------------------|----------|
| `add` | Add one player | `event_id`, `name` | `{ success, player }` |
| `add_bulk` | Add many | `event_id`, `names[]` | `{ success, players }` |
| `remove` | Delete player if not in any match | `player_id` | `{ success }` |
| `update` | Rename | `player_id`, `name` | `{ success, player }` |
| `standings` | Ranked list with `rank` | `event_id` | `{ success, standings }` |
| `list` | All players for event | `event_id` | `{ success, players }` |

### `matchplay-round`

| Action | Purpose | Key request fields | Response |
|--------|---------|-------------------|----------|
| `create_round` | Insert round + matches | `event_id`, `round_number`, `matches[]` (court + 4 player ids) | `{ success, round }` |
| `enter_result` / `edit_result` | Scores + completed + recalc player stats + optional round complete | `match_id`, `team_a_score`, `team_b_score` | `{ success, match, standings }` |
| `update_match` | Swap players on incomplete match (round lock rules) | `match_id`, `team_a[]`, `team_b[]` | `{ success, match }` |
| `get_round` | Round + matches + resolved names | `round_id` | `{ success, round }` |
| `list_rounds` | Rounds + match/completed counts | `event_id` | `{ success, rounds }` |
| `start_round` | Round `in_progress` | `round_id` | `{ success, round }` |
| `complete_round` | Round completed | `round_id` | `{ success, round }` |
| `delete_round` | Delete if no completed matches | `round_id` | `{ success }` |

---

## 4. Database schema

**Finding:** There are **no** `supabase/migrations/*.sql` files in this repo that mention `matchplay_*`. Tables are implied entirely from **edge function** and **app** usage.

Inferred model (verify in Supabase dashboard or add migrations to repo):

### `matchplay_events`

- **Purpose:** One social session / tournament at a venue.  
- **Likely columns:** `id`, `venue_id`, `name`, `format`, `scoring_type`, `win_points`, `draw_points`, `loss_points`, `match_format`, `match_duration_minutes`, `match_target_score`, `game_mode`, `court_count`, `court_labels` (array/json), `status` (`setup` \| `in_progress` \| `completed`), `started_at`, `completed_at`, `created_at`, `updated_at`.

### `matchplay_players`

- **Purpose:** Players registered on an event; holds **denormalized standings** updated when results are entered.  
- **Likely columns:** `id`, `event_id`, `name`, `total_points`, `matches_played`, `matches_won`, `matches_drawn`, `matches_lost`, `games_won`, `games_lost`, `game_difference`, timestamps as applicable.

### `matchplay_rounds`

- **Purpose:** A round of pairings for an event.  
- **Likely columns:** `id`, `event_id`, `round_number`, `status`, `started_at`, `completed_at`.

### `matchplay_matches`

- **Purpose:** One doubles-style fixture (2v2 by player id).  
- **Likely columns:** `id`, `round_id`, `event_id`, `court_label`, `team_a_player_1_id`, `team_a_player_2_id`, `team_b_player_1_id`, `team_b_player_2_id`, `status`, `team_a_score`, `team_b_score`, `result` (`team_a` \| `team_b` \| `draw`), `updated_at`.

**Relationships:** `events` 1—* `players`; `events` 1—* `rounds`; `rounds` 1—* `matches`; `matches` reference four `players.id`.

---

## 5. TV / spectator: what exists

### A) Matchplay **event** TV — `/matchplay/[id]/board`

- **What it is:** Full-screen **event leaderboard + current round fixtures + activity ticker**, driven by edge functions + **Supabase Realtime** (`postgres_changes` on `matchplay_players`, `matchplay_matches`, `matchplay_events`, `matchplay_rounds` filtered by `event_id`).
- **States in UI:** `setup` (“starting soon” + player grid), `in_progress` (standings + fixtures + feed), `completed` (podium + final table).
- **Design system alignment:** Uses **`matchplay-board.css`** only — **does not** use `Spectator*` components or `GradientWaveDrift`.
- **TV polish:** Title keep-alive every 30s to mitigate TV sleep.

### B) **Court match** spectator TV — `/live/[courtSlug]`

- **What it is:** **`SpectatorDisplay`** tree (`SpectatorIdle`, `SpectatorPregame`, `SpectatorLive`, `SpectatorEndgame`, …) wired to **court** + venue branding via `useCourtRoute`.
- **Relation to matchplay:** **None in code** — matchplay events do not push data into `live_matches` for this route. It is the normal **padel match** spectator experience for a **court**, not for a **matchplay event id**.

### Gap summary (TV / spectator for matchplay)

| Item | Status |
|------|--------|
| Dedicated **matchplay event** spectator using `SpectatorLive` UI | **Missing** — board is a separate bespoke layout |
| Shared visual system (`GradientWaveDrift`, spectator tokens) on matchplay board | **Missing** — different CSS stack |
| Single URL that combines “show current matchplay match on court TV” | **N/A** — matchplay is event-centric; live match is court-centric |
| Realtime on board | **Present** for matchplay tables |
| Standings on staff tablet | **Present** (modal on `[id]` + board TV) |

---

## 6. “Components” (actual structure)

There is **no** `components/matchplay/*`. Logical UI blocks live inside pages:

| Logical block | Location | Purpose | TV-ready? |
|---------------|----------|---------|-----------|
| Launcher / PIN / event list | `app/matchplay/page.tsx` | Entry, list events, navigate | Tablet |
| Format form | `app/matchplay/new/page.tsx` | Courts, scoring, rounds | Tablet |
| Players | `app/matchplay/new/players/page.tsx` | Add players, start event | Tablet |
| Event hub | `app/matchplay/[id]/page.tsx` | Tabs, cards, steppers, standings/players/edit modals, realtime | Tablet |
| Event board | `app/matchplay/[id]/board/page.tsx` | TV standings / fixtures / feed / podium | **Yes (TV)** |
| DS static previews | `MatchplayPreviewStates.tsx` | Marketing / QA static HTML | N/A |

Shared UI imports elsewhere: `SetupScreenHeader`, `ScoreSepBar` (on matchplay event page for some displays).

---

## 7. Gaps identified

- [ ] **Migrations missing in repo** for `matchplay_*` tables — onboarding risk; should be versioned in `supabase/migrations`.
- [ ] **Two TV stories** (matchplay board vs `SpectatorDisplay`) with **different design languages** — product/UX inconsistency on venue TVs.
- [ ] **No link** from matchplay domain to `/live/...` for “show this court’s match” during an event (if that were desired).
- [ ] **Large monolithic pages** — hard to reuse pieces (e.g. standings table) between tablet modal and TV board without duplication (classes differ: `matchplay-standings` vs `board-standings`).
- [ ] **Design-system static board** (`standings_tv`) is **not** the same React tree as production board (preview is simplified markup).

---

## 8. Recommendations

1. **Keep `/matchplay/[id]/board` as the event TV URL** — it already has realtime and clear event scope. Adding `/matchplay/[company]/[venue]` is optional sugar; **venue + event id** (or slug) is enough if routes are documented.
2. **If “spectator design system” should cover matchplay TV:** Either  
   - **Extract** shared primitives (background, typography scale, table shell) into tokens/components used by **both** `matchplay-board` and `spectator.css`, or  
   - **Rebuild** a thin `MatchplayBoardSpectator` wrapper that composes **layout-only** pieces from spectator and feeds **matchplay** data (larger refactor).
3. **Short term:** Document for venues: **Event TV** = `/matchplay/[eventId]/board`; **Court match TV** = `/live/[courtSlug]`. Avoid implying they are the same app surface until unified.
4. **Schema:** Export canonical SQL from Supabase Studio (or write migrations) for `matchplay_events`, `matchplay_players`, `matchplay_rounds`, `matchplay_matches` + RLS if any.
5. **Integration:** If future requirement is “when a matchplay **match** is tied to a **court** session”, you’d need a data model link (e.g. optional `court_id` / `live_match_id` on `matchplay_matches`) and then optionally **embed** or **redirect** to `SpectatorDisplay` for that court — **not present today**.

---

## 9. Quick reference — how pieces connect

```
Staff tablet                    Edge functions                    Postgres (matchplay_*)
────────────                    ────────────────                  ──────────────────────
/matchplay          ──────►     matchplay-event (list/get/…)      
/matchplay/new      ──────►     matchplay-event (create/update)
/new/players        ──────►     matchplay-player (add/list)
/matchplay/[id]     ──────►     matchplay-round + player        ◄── realtime subscriptions
                                (rounds, results, standings)

TV
──
/matchplay/[id]/board  ───►  same edge + supabase client  ───►  realtime + standings/fixtures UI (matchplay-board.css)

/live/[courtSlug]      ───►  court route + live match state   ───►  SpectatorDisplay (spectator.css, GradientWaveDrift on live/pregame)
                                (NOT wired to matchplay_events)
```

---

*End of report.*
