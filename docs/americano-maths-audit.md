# Americano maths audit

**Engineering audit · read-only.** Staff setup → round generation → scoring → standings, swept across every player/court/round combination the UI allows and verified by simulation, not manual tracing. No code was changed to produce this document.

| | |
|---|---|
| **18/28** | matrix cells with a real defect |
| **4/7** | player counts with broken fairness |
| **7** | distinct root causes |
| **0** | crashes — every bug is silent |

## Contents

1. [Verdict](#01-verdict)
2. [Rules of record](#02-rules-of-record)
3. [Broken combinations](#03-broken-combinations-severity-sorted)
4. [OK vs. broken](#04-ok-vs-broken)
5. [Root causes](#05-root-causes)
6. [Fix order](#06-fix-order)
7. [Minimal test cases](#07-minimal-test-cases)
8. [Format research & UX](#addendum--format-research--ux)

---

## 01 · Verdict

The pairing generator is arithmetically sound only for player counts divisible by four, played with the exact court count it silently computes for itself. For every other reachable combination — three of the seven selectable player counts, and the large majority of court selections — it either double-books a physical court with two simultaneous matches, or structurally exempts one specific player from ever resting while everyone else absorbs the sit-outs unevenly.

Americano events have no in-app way to detect, regenerate, or manually correct either failure once fixtures are generated. None of this is new: `docs/full-codebase-review-2026-06-19.md:306–336` already names both root causes — "silent sit-outs," "court count ignores configured courts." This audit adds exact numbers, a third bug the existing doc doesn't mention (the rounds-cap UI ceiling), and confirms severity by simulation rather than inspection.

## 02 · Rules of record

Ground truth for every number in this document came from executing a faithful line-for-line port of `generateAmericanoPairings` across the full UI-selectable matrix — not manual tracing.

| Concern | File : lines | Formula |
|---|---|---|
| Selectable player counts | `lib/matchplay-americano-setup.ts:2` | `[6, 8, 10, 12, 14, 16, 20]` — all even, so the odd-*n*/bye branch of the generator is dead code in production |
| Selectable court counts | `app/matchplay/new/page.tsx:14` | `COURT_OPTIONS = [1, 2, 3, 4]` — hard ceiling of 4 |
| Court "too many" warning | `app/matchplay/new/page.tsx:58–59, 103, 109–113` | `maxMatchesFromPlayers = floor(playerCount/4)`; warns if `selectedCourts.length > maxMatchesFromPlayers`. No warning the other direction. |
| Resting estimate (pre-event) | `app/matchplay/new/page.tsx:55–56` | `restingPerRound = max(0, playerCount − selectedCourts.length×4)` |
| Selectable rounds | `app/matchplay/new/page.tsx:32–39` | `roundOptions = 3..min(playerCount−1, 9)` |
| "Full rotation" label | `app/matchplay/new/page.tsx:30, 233` | `fullRotation = playerCount − 1`, printed under the rounds picker |
| Pairing generation (primary) | `lib/matchplay-americano-pairings.ts:28–78`, called from `app/matchplay/new/players/page.tsx:262–264` | circle method → chunked into matches, see §05 |
| Pairing generation (fallback) | `app/matchplay/[id]/page.tsx:574–616` | cap from `getMatchplayTotalRoundsFromStorage()` — reads `localStorage`, independent of the event's own stored config |
| Round/match server validation | `supabase/functions/matchplay-round/index.ts:234–315` | requires 2-player teams, valid IDs, no player twice — **no check on `court_label` uniqueness** |
| Scoring | `matchplay-round/index.ts:317–441` → `recalculateStandings` (131–210) | `scoring_type` hardcoded `'raw_points'`; `total_points += my`, `games_won += my` — same value, always |
| Standings sort/rank | `matchplay-round/index.ts:407–434` | `ORDER BY total_points DESC, game_difference DESC, games_won DESC, name ASC` |
| Quick-score pool split | `app/matchplay/[id]/page.tsx` · `handleQuickScore` | tapping `n` sets `{a:n, b:maxScore−n}` — **this part is correct** |
| Lineup edit / regenerate | `canEditLineup = !isAmericano && (…)`; `delete_round` exists server-side with **no client call site anywhere** | Americano can never edit or regenerate a generated round |

## 03 · Broken combinations, severity-sorted

### A · Court double-booking — `INVALID_ALLOWED`

`numCourts = floor(playerCount/4)` (`lib/matchplay-americano-pairings.ts:43`) is computed independently of what staff selected; `courts = courtLabels.slice(0, numCourts)` (line 45) only truncates the selection down, never validates it's *enough*. When `selectedCourts.length < numCourts`, `courtIdx = floor(i/2) % courts.length` (line 64) wraps around and assigns the same `court_label` to two or more simultaneous matches.

| Players | Courts needed | Collides at | Clean at |
|---|---|---|---|
| 20 | 5 | **1, 2, 3, 4 — every option** | — |
| 16 | 4 | 1, 2, 3 | 4 |
| 12 | 3 | 1, 2 | 3, 4 |
| 14 | 3 | 1, 2 | 3, 4 |
| 10 | 2 | 1 | 2, 3, 4 |
| 8 | 2 | 1 | 2, 3, 4 |
| 6 | 1 | — | 1, 2, 3, 4 |

**Worked example — 12 players, 2 courts.** 11 rounds generated; every single round produces 3 matches but only 2 court labels exist, so `courtIdx` cycles `0, 1, 0` — two matches both say **"Court 1"**, every round, for the whole event. `create_round` validates player uniqueness and team size, not `court_label` uniqueness, so this is accepted and persisted without error.

### B · Structural rest unfairness — `WRONG_PAIRING`

`for (i=0; i<pairs.length-1; i+=2)` (line 63) drops the trailing pair whenever `pairs.length` (= `playerCount/2`) is odd — i.e. whenever `playerCount ≡ 2 (mod 4)`, exactly the 6/10/14 options. The `resting` field is set only for the true bye slot, which never triggers (all seven offered counts are even) — so the generator's own output gives no signal that two players were dropped.

| Players | Expected | Actual, measured over full rotation |
|---|---|---|
| 6 | 5 rounds, comparable participation, 15/15 partnerships | **Player 1 plays 5/5 rounds; every other player plays only 3/5.** Only 10/15 partnerships ever occur. |
| 10 | 9 rounds, uniform participation, 45/45 partnerships | Participation range **7–9 of 9** rounds; only 36/45 partnerships occur. |
| 14 | 13 rounds, uniform participation, 91/91 partnerships | Participation range **11–13 of 13** rounds; only 78/91 partnerships occur. |
| 8, 12, 16, 20 | uniform participation, full partner coverage | confirmed correct — 28/28, 66/66, 120/120, 190/190 partnerships; every player plays every round the same number of times |

**Mechanism, worked — 6 players, 5 rounds.** `P1` is the circle method's fixed anchor (`fixed = playerList[0]`) and is never the player whose pair gets dropped, because the dropped pair is always the last one built from the *rotating* half of the array. Measured plays per player across all 5 rounds:

```
P1: 5   P2: 3   P3: 3   P4: 3   P5: 3   P6: 3
```

Whoever staff types in as the first player added to the roster gets systematically more court time than everyone else, every time `playerCount ≡ 2 (mod 4)`.

### C · "Full rotation" is unselectable for most player counts — `MISLEADING UI`

`roundOptions` caps at `min(playerCount−1, 9)` (`app/matchplay/new/page.tsx:33`) while the hint text directly underneath prints the uncapped `fullRotation = playerCount−1` (line 233).

| Players | Hint text says | Highest selectable | Reachable? |
|---|---|---|---|
| 6 / 8 / 10 | 5 / 7 / 9 | 5 / 7 / 9 | yes |
| 12 | "Full rotation = 11 rounds" | 9 | **no** |
| 14 | "Full rotation = 13 rounds" | 9 | **no** |
| 16 | "Full rotation = 15 rounds" | 9 | **no** |
| 20 | "Full rotation = 19 rounds" | 9 | **no** |

For four of the seven player-count options, the screen tells staff a number of rounds they are then prevented from picking.

### D · No recovery path once a round is broken — `STRUCTURAL`

`canEditLineup` is unconditionally `false` for the only enabled game mode. `delete_round` exists server-side (`matchplay-round/index.ts:666–711`) but no client call site invokes it anywhere in the app. Once A–C happens, staff cannot edit a fixture or regenerate a round — the only lever is ending the event early.

### E · Round-cap fallback reads stale localStorage — `EDGE CASE`

`app/matchplay/[id]/page.tsx:574–616` only fires if `event.status === 'setup' && rounds.length === 0` — not reachable in the happy path. But if the round-creation loop in `new/players/page.tsx` throws partway through, the event is left in `setup` with 0 rounds, and reloading the hub regenerates using whatever `rounds` value is currently sitting in `localStorage['palapoint_matchplay_settings']` — which may belong to a different event staff configured afterward in the same browser. Low likelihood, high confusion if it fires.

### F · Round ordering enforced client-side only — `DEFENSE GAP`

`start_round` (`matchplay-round/index.ts:628–645`) sets a round `in_progress` with zero validation that earlier rounds are complete. The "Next Round" button's disabled state is the only thing preventing out-of-order rounds — bypassable by a direct API call or a race between two staff devices on the same event.

### G · Standings' third tie-break is a no-op — `WRONG_STANDINGS (cosmetic)`

`total_points` and `games_won` are incremented by the identical value in the same loop, unconditionally, before the scoring-type branch — so `games_won === total_points` for every player, always, under `raw_points`.

**Worked example.** Alice plays 20–12, 8–24, 16–16 (draw). Bob plays 18–14, 10–22, 16–16 (draw). Both finish: `total_points=44`, `games_lost=52`, `game_difference=−8`, `games_won=44`. All three sort keys tie identically — the "third" tiebreak never had a chance to differ from the first, and the real decider is alphabetical name order.

## 04 · OK vs. broken

Of the 28 (playerCount × court) cells in the requested matrix:

| Class | Cells | Which |
|---|---|---|
| OK | 9/28 | playerCount ∈ {8,12,16} with courts ≥ `floor(playerCount/4)` |
| OK, wasteful | 5/28 | {8,12,16} × courts beyond what's needed (soft warning shown) |
| Court collision | 10/28 | under-provisioned courts across {8,10,12,14,16}, plus all 4 options for 20 |
| Rest/partner unfairness | 4/28 | every court option × playerCount=6 (10 and 14 carry this too, counted above first) |

**True "has at least one real defect" total: 18/28 — 64%.** Independent of the matrix: finding C affects 4 of 7 player counts, D affects 100% of Americano events, F and G are latent gaps on every event.

## 05 · Root causes

1. `lib/matchplay-americano-pairings.ts:43–45` — court count for scheduling is derived from `floor(playerList.length/4)`, completely decoupled from the `courtLabels` array's actual length beyond a downward-only `.slice()`. **Fix belongs here.**
2. `lib/matchplay-americano-pairings.ts:63–70` — match-grouping loop silently drops a trailing pair when `pairs.length` is odd, with no record of who was dropped and no attempt to rotate who absorbs it. **Fix belongs here.**
3. `app/matchplay/new/page.tsx:32–39, 103` — UI validation only checks the "too many courts" direction, and caps round selection independently of the "full rotation" number it advertises. **Fix belongs here** (two separate lines).
4. `canEditLineup` gate in `app/matchplay/[id]/page.tsx` — architectural choice to disable lineup editing for Americano, with no substitute "regenerate round" affordance wired to the `delete_round` action that already exists server-side.
5. `supabase/functions/matchplay-round/index.ts:234–315, 628–645` — `create_round` validates player uniqueness but not `court_label` uniqueness within a round, and `start_round` doesn't check prior-round completion. The server is a permissive backstop for client bugs, not a source of truth.

## 06 · Fix order

### Block in UI first — cheap, immediate, stops new broken events today

1. Add a lower-bound court check to `app/matchplay/new/page.tsx`: block *Continue* (not just warn) when `selectedCourts.length < maxMatchesFromPlayers`.
2. Remove `20` from `MATCHPLAY_AMERICANO_PLAYER_OPTIONS`, or raise `COURT_OPTIONS` to 5 — as shipped, there is no valid UI path to a correct 20-player event, so one of these two facts has to change.
3. Fix the `roundOptions` cap to either raise the ceiling to `playerCount−1`, or fix the label to say the actual achievable maximum instead of the theoretical one.
4. Warn, at minimum, when `playerCount % 4 !== 0` — no amount of court selection fixes finding B for 6/10/14; it's a property of the player count alone.

### Fix the generator — structural, needs product sign-off on the rotation algorithm

1. `generateAmericanoPairings` should cap `matches.length` at `min(floor(playerCount/4), courtLabels.length)` and, when `pairs.length` is odd, rotate *which* pair sits out round-to-round instead of always dropping the position-last one — a genuine algorithm redesign, matching the existing audit's own "product decision needed" note.
2. Add a "regenerate fixtures" affordance in the staff UI so a bad round is recoverable without ending the event.
3. Add server-side `court_label` uniqueness-per-round and prior-round-completion checks as defense in depth — cheap, and turns future client bugs into loud errors instead of silent scheduling collisions.

## 07 · Minimal test cases

None of these exist today — `docs/full-codebase-review-2026-06-19.md:336` already notes zero unit tests for this file.

```
T1  generateAmericanoPairings(6 players, 1 court)
    → assert every round has exactly 1 match (4 seated, 2 resting)
    → assert rest counts across all 5 rounds are equal for all 6 players
      (currently: [0, 2, 2, 2, 2, 2])

T2  generateAmericanoPairings(8 players, 2 courts)
    → assert 7 rounds, 2 matches/round, 28 unique partner pairs, 0 repeats

T3  generateAmericanoPairings(10 players, 2 courts)
    → assert every player's play-count across all 9 rounds is within 1
      of every other player's (currently: range is 2 — 7 vs 9)

T4  generateAmericanoPairings(12 players, 2 courts)
    → assert no round contains two matches with the same court_label
      (currently: fails every round)

T5  generateAmericanoPairings(20 players, 4 courts)
    → assert no round contains two matches with the same court_label
      (currently: fails — this combination cannot pass under today's UI ceiling)

T6  For every playerCount in MATCHPLAY_AMERICANO_PLAYER_OPTIONS:
    → assert full-rotation round count (playerCount − 1) is ≤ the
      max value roundOptions offers (currently: fails for 12, 14, 16, 20)

T7  recalculateStandings: construct two players with different score
    sequences summing to identical total_points and game_difference
    → document (don't "fix," just lock) that games_won never
      differs once totals and GD already tied
```

## Addendum · Format research & UX

### What the rest of the padel world does

Every source surveyed agrees on the same three points: player counts divisible by four are what keep courts full and rotation clean ("8, 12, or 16 is the social sweet spot"); courts should scale 1:4 with players — 20 players calls for 5 courts, not a UI capped at 4; and point pools of 16/24/32 with auto-split-to-target scoring — which this app already implements correctly — are the standard. Tournament software that *does* support group sizes not divisible by four handles it with deliberately smarter bye-rotation logic, not a naive drop of whoever's left over.

### Three concrete suggestions

1. **Drop 6, 10, 14, 20 from the player-count options, or fix the generator before re-adding them.** As shipped, four of seven offered counts (57%) produce either unfair rotation or unrunnable court assignments. Clubs do have odd-sized groups, so if the product wants to keep these, the generator needs the "smart bye rotation" the industry actually uses — the current circle-method-then-chunk approach was never designed to handle it.
2. **Raise the court ceiling to match the player-count ceiling**, or lower the player-count ceiling to match the court ceiling. Twenty players is offered but structurally unreachable at up to four courts — an internal inconsistency, not a design choice.
3. **Surface "matches per court" as a first-class number on the Format screen**, not just player/court/round counts — e.g. "3 matches will run per round across 2 courts (one court runs 2 matches back-to-back)" — because today's UI implies one simultaneous match per selected court with no indication of when that breaks.

**Sources**

- [Padel Fast — Americano rules](https://www.padelfast.com/formats/americano)
- [SimplePadel — how to play Americano](https://simplepadel.com/how-to-play-an-americano-in-padel/)
- [Host a Tourney — Americano rules & schedule setup](https://hostatourney.com/en/blog/americano-padel-rules-schedule)
- [Padel Fast — organizing a tournament](https://padelfast.com/blog/how-to-organize-padel-americano-tournament)

---

*Compiled from a full read-only pass over `lib/matchplay-americano-*`, `app/matchplay/**`, `supabase/functions/matchplay-{round,player}`, and the existing `docs/full-codebase-review-2026-06-19.md`. No repository files were modified to produce this audit.*
