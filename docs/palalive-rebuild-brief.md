# PalaLive Rebuild — Context Brief

**Status:** Design phase complete enough to start. This document is the handoff
context for the future session/prompt that builds PalaLive as a real,
database-connected product in a **new, clean project** — not a modification of
`palapoint-v4` in place.

## 1. Goal

Rebuild the venue TV display and staff mobile flows as real, working, Next.js +
Supabase pages in a brand new repository, using:
- **This document's design reference** for what everything should look like.
- **`palapoint-v4`'s existing logic, data model, and Supabase schema** for how it
  should actually work (scoring, session handling, matchplay pairing, realtime,
  auth) — ported and cleaned up, not re-invented from scratch.

The new project should NOT be a copy-paste of `palapoint-v4`'s CSS/components.
It should implement the same underlying product behavior against the same
Supabase backend, styled with the PalaLive token system below.

## 2. Design reference (source of truth for visuals)

All mockups are static, self-contained HTML/CSS files — no build step, no
framework — built specifically to be fast to iterate on. They live in
`design-mockups/` in `palapoint-v4` on branch `claude/palalive-skeleton-reference`,
and are also published as Claude Artifacts.

Open `design-mockups/index.html` locally for a clickable index of everything
below (works offline, no claude.ai dependency).

| Screen set | File | What it covers |
|---|---|---|
| Venue Display (TV) | `palalive-display-skeleton.html` | Idle, Social Night, Showcase states + a Variants reference tab. Auto-scales to viewport. |
| Venue Display (TV, full size) | `palalive-display-skeleton-fullsize.html` | Same file, no JS scaling — literal 1920×1080, exactly as it renders on the Fire TV Stick. |
| Showcase staff flow (phone) | `palalive-showcase-flow.html` | 7 screens: Loading → Setup → Confirm → Live Scoring → End·Win / End·2-1 / End·2-0. |
| Matchplay staff flow (phone) | `palalive-matchplay-flow.html` | 8 screens: Launcher → Format → Players → Event·Live → Score Entry → Event·Finalize → Standings → Results. |
| (also exist standalone) | `palalive-setup-screen.html`, `palalive-control-panel.html` | The Showcase Setup and Live Scoring screens as isolated single-screen files (same content embedded in the flow above). |

### Design tokens

One `:root` token block, repeated identically across every mockup file (search
for `--void`, `--page`, `--panel`, `--card`, `--accent` to find it in any file):

```css
--void:   #000000;
--page:   #383737;
--frame:  #000000;
--panel:  #2b3442;
--card:   #485467;
--card-edge: #56637a;
--card-inner: #3a4555;
--ink:    #e9ecf1;
--mist:   #67707e;
--accent: #cfef3a;
--state-up:   #6fcf61;
--state-down: #ff6b6a;
--scoreboard-alt: #3e4858;
--team-a: var(--accent);   /* deliberately NOT the real app's blue — see decisions below */
--team-b: #FF4DA6;         /* matches app/styles/tokens/colors.css exactly */
```

Radius scale: 20px outer frame/screen, 12px card, 10px inset content, 999px
pills/circles. Typography is Inter (4 weights, embedded as base64 in each
mockup file — extract from any of them if a webfont file is needed).

### Deliberate design decisions (do not silently "correct" these back to v4's current values)

- **`--team-a` = `--accent`** (lime), not the real app's blue (`#3A5FF9`). This
  was an explicit request — our primary brand color doubles as Team A's
  identity color. `--team-b` (`#FF4DA6`) still matches the real app exactly.
- **`--accent` is the single "selected/active/live" signal color** everywhere
  — mode-card selection, active pills, live-dot pulse, serving-indicator
  bracket on the scoreboard. It is NOT used for team identity except via
  `--team-a`'s indirection above.
- **Court selector (Matchplay Format screen)**: shape and the court-line SVG
  icon are pulled exactly from `components/matchplay/CourtIcon.tsx` and
  `.matchplay-court-btn` in `app/styles/matchplay.css`, but the selected-state
  color is `--accent` (ours), not the real app's `--brand-primary` blue —
  same reasoning as the team-a decision.
- **Scoreboard layout** (both TV `.scoreboard` and mobile `.cp-scoreboard`):
  set-won dots sit *inside* each team's own colored half, pushed to the
  bottom via `justify-content: space-between`; the games count is an
  absolutely-positioned overlay centered on top of both halves. This matches
  the TV display's actual `.scoreboard-games` trick — don't reintroduce a
  separate bordered "bottom strip" for the dots/games row.
- **Round pill list rows** (Players / Standings on the Matchplay flow): the
  whole row is a full stadium-shaped pill (`border-radius: 999px`, avatar
  flush against the rounded edge), matching the TV display's
  `.stack-card`/`.player-chip` pattern in the Social Night Players panel —
  not a rounded-rectangle card with a floating avatar.
- **Standings rows have no rank medals or colored top-3 borders** — removed
  on request; the Results screen's trophy hero card keeps its gold border,
  that's a separate component.
- **Completed-match cards in Matchplay** (Event Live/Finalize) use the same
  shell as the TV display's `.court-card`: labeled header + inset
  `--card-inner` box + result-circle avatars (accent ring = winner, mist
  ring = other side) — not the real app's `matchplay-hub-match` card style.
- **Pending (not-yet-scored) match cards** show a `+` button in place of a
  score/initials circle — accent-outlined, clearly tappable — since the real
  interaction is "tap to enter this team's score."

### Known open/unresolved design items

- A "FINISHED / WINNERS" match-result screenshot the user supplied doesn't
  match anything found in the current `palapoint-v4` source (`MatchWinHero.tsx`
  and `MatchFinishedPanel.tsx` don't have a "WINNERS" pill badge). Never
  resolved whether it's from a newer part of the app, a different mockup, or
  net-new — worth asking before assuming it's net-new design work.
- Matchplay's 3 TV board screens (`board_setup`/`board_live`/`board_completed`
  in `MatchplayPreviewStates.tsx`) were explicitly left out of scope — only
  the staff-mobile Matchplay flow was rebuilt, not its TV counterpart.
  `matchplay-board-audit-v2.md` (see below) has a full gap analysis of that
  board against its UX spec if it's picked up later.
- Roster-edit (`hub_players`/edit-players) was treated as visually identical
  to the "Players" add-players screen and not built separately.
- Player-side flows (`/setup`, `/playing`, session review, game stats) were
  never touched — only staff-facing screens were designed.

## 3. Real app architecture — what to port, what to fix

Pulled from the existing audit docs already in `palapoint-v4/docs/` — read
these in full before building, don't re-derive this from scratch:

- **`docs/full-codebase-review-2026-06-19.md`** — the most comprehensive
  single review; start here. Top findings:
  - **No baseline Supabase schema in the repo** — only incremental migrations
    exist (`supabase/migrations/`, 6 files, no `CREATE TABLE` baseline). RLS/
    indexes/FKs live only in the Supabase dashboard. This is the single
    biggest blocker to a clean rebuild — get a full schema dump before
    starting.
  - Live-match data fetching is duplicated 4× (`ControlPanel`, `CourtDisplay`,
    `PlayingDisplay` each hand-roll fetch+Realtime instead of sharing
    `useLiveMatch`) — worth consolidating in the rebuild, not repeating.
  - Americano pairing algorithm (`lib/matchplay-americano-pairings.ts`) has
    real bugs: silent sit-outs, court count computed as `floor(n/4)` instead
    of honoring configured `court_labels.length`.
  - Scoring engine is duplicated verbatim between `lib/scoring/engine.ts` and
    the Deno copy in `supabase/functions/_shared/scoring/engine.ts` (513
    lines, drift risk) — pick one source of truth in the rebuild.
  - Also documents what's working well and worth keeping: the token system,
    `useLiveMatch`/`useCourtRoute` hooks, spectator component decomposition.
- **`docs/design-system-audit.md`** — token/CSS architecture map. Flags
  `setup-form.css` as running a fully disconnected token universe (hex/HSL
  not wired to `:root`) — biggest CSS-side risk if porting real components
  instead of rebuilding their styles from this brief's tokens.
- **`docs/matchplay-audit-report.md`** — full Matchplay feature inventory:
  routes, 3 edge functions (`matchplay-event`, `matchplay-player`,
  `matchplay-round`, all POST+`action` style), inferred schema. Notes there's
  no `components/matchplay/` — UI is inline in large page files.
- **`docs/matchplay-event-hub.md`** — staff event-hub page detail. Score entry
  is a bottom-sheet modal with a number pad (matches what we mocked in
  "Score Entry"), not inline steppers. Round pairing is generated
  **client-side in the browser**, then persisted — not server-authoritative.
  Round-count cap is read from a `localStorage` key
  (`palapoint_matchplay_settings`) written during `/matchplay/new` — a hidden
  dependency to not blindly carry over.
- **`docs/matchplay-design-alignment.md`** and **`docs/matchplay-board-audit-v2.md`**
  — token-migration and UX-spec gap analysis for the Matchplay CSS and TV
  board respectively. Relevant only if the TV board gets picked up later.
- **`docs/venue-display-product-inventory.md`** — the original audit that
  independently proposed the same Idle/Social-Night/Showcase-Game venue
  model this whole design exercise implements. Maps current routes/components
  to that model (e.g. `ControlPanel.tsx`/`/control` = Showcase staff base,
  `/matchplay` hub = Social Night base, `SpectatorDisplay`/`/live` and
  `/matchplay/[id]/board` = the actual TV display surfaces).
- **`docs/ui-components.md`** — canonical CSS primitives (`.card`, `.btn` and
  their modifiers) if any real-app component code gets referenced directly.

### Supabase schema (inferred — no schema file exists, confirm against the live dashboard)

| Table | Purpose |
|---|---|
| `venues` | Venue records (company_id, slug, timezone) |
| `courts` | Physical courts (slug, venue_id, court_number, is_show_court) |
| `live_matches` | Core court match state (scores, status, session link) |
| `score_events` | Point-by-point event log for a live match |
| `sessions` | Player session tracking per court |
| `matches` | Older/parallel table to `live_matches` — purpose unclear, verify before use |
| `control_tokens` | Staff PIN auth tokens (control panel / matchplay launcher) |
| `matchplay_events` | One Americano/social event per venue (format, status, court_labels) |
| `matchplay_players` | Roster + denormalized standings per event |
| `matchplay_rounds` | A round of pairings within an event |
| `matchplay_matches` | One doubles fixture (4 player IDs, scores) within a round |
| `venue_screens` | Permanent TV screen orchestration (active_mode: idle/social_night/showcase_game, FKs to courts/matchplay_events/live_matches) |
| `venue_screen_secrets` | Pairing codes split out of `venue_screens` (service-role only) |

## 4. Suggested next step

Hand this document, plus `docs/venue-display-product-inventory.md` and
`docs/full-codebase-review-2026-06-19.md`, to a dedicated high-effort session.
Frame the ask as: *"Build PalaLive as a new Next.js + Supabase project. Use
the design-mockups/ files as the exact visual spec — same tokens, same
component shapes. Use the real palapoint-v4 app (same Supabase project) for
data model and business logic, fixing the known issues listed in section 3
rather than porting them as-is. Confirm schema against the live Supabase
dashboard before writing migrations, since none are checked into the repo."*
