# PalaLive Rebuild — Context Brief

**Status: DECIDED.** Per `DEVELOPERHANDOVER.md` (July 2026, "Locked
decisions"): **extend this repo — do not start a new PalaLive/v5 project.**
`kink-frame` is **parked/forget** — it was early exploration, not the
shipping UI. `design-mockups/` is the locked visual source of truth. Section
0 below is kept as historical record of *why* (it's the investigation that
led to the locked answer) — don't read it as still-open.

This brief exists to give whoever runs the actual integration effort full
context without re-deriving it from chat history or re-auditing the codebase
from scratch.

---

## 0. Read this first — how we got to the locked decision

The original assumption (see prior revisions of this doc) was: build a brand
new Next.js + Supabase project, port v4's logic into it, style it with the
PalaLive mockups. Two things surfaced that made us stop and check before
starting — and both are now resolved by `DEVELOPERHANDOVER.md`'s explicit
"Locked decisions" table (§0 there): **extend this repo, park kink-frame.**
The investigation that raised the question is kept below for context.

### 0.1 The "how does the display know its state" problem is already solved, in production, in v4

`venue_screens` (table) + `/screen/[screenSlug]` (TV route) + `/staff/[venueSlug]`
(staff route) is a **fully wired, working system today** — not a stub, not a
partial migration:

- Real Supabase reads, a Realtime subscription (with a 5s poll as a
  belt-and-braces fallback), and a service-role edge function
  (`supabase/functions/screen/index.ts`) that handles `set_mode`,
  `set_social_night`, `set_showcase_game` — with pairing-code auth and real
  cross-venue/cross-court validation (e.g. rejects linking a match whose
  `court_id` doesn't match the screen's).
- The staff app at `/staff/[venueSlug]` actually drives this: pick a screen →
  enter a pairing code → switch mode / resume a session / reset to idle, all
  live-updating the TV via Realtime.
- It currently renders using the *old* components (`ScreenIdle`,
  `MatchplayBoard`, `SpectatorDisplay`) — not kink-frame, not our PalaLive
  design. But the plumbing underneath — the exact thing the original
  Integration Brief worried about building — already exists and works.

### 0.2 There's already a real (but unfinished, unwired) "PalaLive-shaped" prototype in v4: `kink-frame`

`app/kink-frame/*` + `components/layout/KinkFrame*.tsx` is a genuine,
reasonably sophisticated React component tree implementing a 1920×1080 venue
TV shell with idle/showcase/social modes, glass-panel broadcast styling, and
a staggered enter/exit animation system. But:

- **Zero Supabase calls anywhere in it** — every name, score, and status is a
  hardcoded constant. It has never been connected to real data.
- **Two incompatible geometry systems coexist**: v1 (`/kink-frame`, rounded
  45×54 corner radius, notched bottom-right pocket) and v2
  (`/kink-frame/skeleton`, square 0-radius outer frame, 20px uniform border,
  140px kink pocket) — the v2 one is explicitly a "geometry-only preview /
  design-alignment tool" (it has a manual overlay toggle to A/B against a
  reference mockup PNG), not a finished screen. v2 doesn't even implement
  mode-switching — it only ever shows the idle court-availability loop.
- It is not linked from anywhere else in the app — it's a standalone design
  sandbox, reachable only if you know the URL.

**Why this matters:** kink-frame v2's frame color (`#0E1116`) is an *exact*
match to the Integration Brief's locked `--color-base` token (see §2 below),
and kink-frame v1's accent (`#c8f03c`) is close to the brief's
`--color-accent` (`#C8FF00`). That's very unlikely to be coincidence — it
strongly suggests kink-frame was an earlier real-component attempt at this
same PalaLive spec, using a different frame geometry (notched TV bezel)
than what we designed in the static mockups (flat rectangular panels + full-
width bottom bar).

### 0.3 Resolved: extend v4, park kink-frame

Given 0.1 and 0.2, "spin up a brand new project" would have meant
re-solving realtime subscriptions, edge-function auth, cross-venue
validation, and the staff pairing/mode-switching flow — all of which already
work — to arrive at the same place a narrower effort could reach.
`DEVELOPERHANDOVER.md`'s locked-decisions table now makes this explicit:

> **New repo vs extend this one** → Extend this repo. Do not start a
> separate "v5 / PalaLive" project.
> **kink-frame** → Parked / forget for now. Early exploration only. Not the
> shipping UI.
> **Visual source of truth** → `design-mockups/` — modular HTML/CSS skeleton
> + staff flows.

The plan: **build real components matching the `design-mockups/` spec, and
swap them into `/screen/[screenSlug]`'s existing render branches** in place
of `ScreenIdle`/`MatchplayBoard`/`SpectatorDisplay`. Legacy court/session
stack stays in the repo, frozen, for existing venues — not rebuilt, not
deleted. §2 below (the four-way visual reconciliation) is now moot for the
same reason: kink-frame is parked, so there's no longer a competing visual
spec to reconcile against — `design-mockups/` simply wins.

---

## 1. Design reference (source of truth for the PalaLive visual design)

All mockups are static, self-contained HTML/CSS files — no build step, no
framework — built to be fast to iterate on. They live in `design-mockups/` at
the repo root, and are also published as Claude Artifacts.

Open `design-mockups/index.html` locally for a clickable index of everything
below (works offline, no claude.ai dependency).

**Branch note:** `main` and `claude/palalive-skeleton-reference` currently
have *diverging* copies of `design-mockups/`. `main` has a newer, more
developed `palalive-display-skeleton.html` / `-fullsize.html` (plus
`bgphoto.avif` and `design-mockups/players/*.jpg`, added directly to `main`
in a separate commit, not from this branch) — this branch's copies of those
two files are older. Everything else in the folder (`index.html`,
`palalive-control-panel.html`, `palalive-launcher.html`,
`palalive-matchplay-flow.html`, `palalive-setup-screen.html`,
`palalive-showcase-flow.html`) is byte-identical between the two branches.
This needs reconciling — take `main`'s display-skeleton files as current,
not this branch's — before treating either branch as the single source of
truth. See the note this doc's author left in-chat for the up-to-date status
of that reconciliation.

| Screen set | File | What it covers |
|---|---|---|
| Venue Display (TV) | `palalive-display-skeleton.html` | Idle, Social Night, Showcase states + a Variants reference tab. Auto-scales to viewport. |
| Venue Display (TV, full size) | `palalive-display-skeleton-fullsize.html` | Same file, no JS scaling — literal 1920×1080, exactly as it renders on the Fire TV Stick. |
| Showcase staff flow (phone) | `palalive-showcase-flow.html` | 7 screens: Loading → Setup → Confirm → Live Scoring → End·Win / End·2-1 / End·2-0. |
| Matchplay staff flow (phone) | `palalive-matchplay-flow.html` | 8 screens: Launcher → Format → Players → Event·Live → Score Entry → Event·Finalize → Standings → Results. |
| (also exist standalone) | `palalive-setup-screen.html`, `palalive-control-panel.html` | The Showcase Setup and Live Scoring screens as isolated single-screen files (same content embedded in the flow above). |

### Deliberate design decisions (do not silently "correct" these back to v4's current values)

- **`--team-a` = `--accent`** (lime), not the real app's blue (`#3A5FF9`). Our
  primary brand color doubles as Team A's identity color. `--team-b`
  (`#FF4DA6`) still matches the real app exactly.
- **`--accent` is the single "selected/active/live" signal color** everywhere
  — mode-card selection, active pills, live-dot pulse, serving-indicator
  bracket on the scoreboard. Not used for team identity except via
  `--team-a`'s indirection above.
- **Court selector (Matchplay Format screen)**: shape and the court-line SVG
  icon are pulled exactly from `components/matchplay/CourtIcon.tsx` and
  `.matchplay-court-btn` in `app/styles/matchplay.css`, but the selected-state
  color is `--accent` (ours), not the real app's `--brand-primary` blue.
- **Scoreboard layout** (both TV `.scoreboard` and mobile `.cp-scoreboard`):
  set-won dots sit *inside* each team's own colored half, pushed to the
  bottom via `justify-content: space-between`; the games count is an
  absolutely-positioned overlay centered on top of both halves — matches the
  TV display's actual `.scoreboard-games` trick. Don't reintroduce a separate
  bordered "bottom strip" for the dots/games row.
- **Round pill list rows** (Players / Standings on the Matchplay flow): the
  whole row is a full stadium-shaped pill (`border-radius: 999px`, avatar
  flush against the rounded edge), matching the TV display's
  `.stack-card`/`.player-chip` pattern — not a rounded-rectangle card with a
  floating avatar.
- **Standings rows have no rank medals or colored top-3 borders** — removed
  on request; the Results screen's trophy hero card keeps its gold border,
  that's a separate component.
- **Completed-match cards in Matchplay** (Event Live/Finalize) use the same
  shell as the TV display's `.court-card`: labeled header + inset
  `--card-inner` box + result-circle avatars (accent ring = winner, mist ring
  = other side) — not the real app's `matchplay-hub-match` card style.
- **Pending (not-yet-scored) match cards** show a `+` button in place of a
  score/initials circle — accent-outlined, clearly tappable — since the real
  interaction is "tap to enter this team's score."

### Known open/unresolved design items

- A "FINISHED / WINNERS" match-result screenshot the user supplied doesn't
  match anything found in the current `palapoint-v4` source
  (`MatchWinHero.tsx` / `MatchFinishedPanel.tsx` have no "WINNERS" pill
  badge). Never resolved whether it's from a newer part of the app, a
  different mockup, or net-new — ask before assuming it's net-new design
  work.
- Matchplay's 3 TV board screens (`board_setup`/`board_live`/`board_completed`
  in `MatchplayPreviewStates.tsx`) were explicitly left out of scope — only
  the staff-mobile Matchplay flow was designed, not its TV counterpart.
  `docs/matchplay-board-audit-v2.md` has a full gap analysis of that board
  against its own UX spec if it's picked up later.
- Roster-edit (`hub_players`/edit-players) was treated as visually identical
  to the "Players" add-players screen and not designed separately.
- Player-side flows (`/setup`, `/playing`, session review, game stats) were
  never touched — only staff-facing screens were designed. (These also map
  to the *legacy* court stack per §3 — may not need designing at all,
  depending on the path decision in §0.3.)

---

## 2. Reconciling four different visual specs (historical — resolved by §0.3)

**Kept for context only.** Now that kink-frame is locked as parked/forget,
`design-mockups/` is the sole visual source of truth by decision, not by
majority vote between these four. This table remains useful for one thing:
if a future PalaLive build wants to cherry-pick a motion pattern or token
from kink-frame (which `DEVELOPERHANDOVER.md` explicitly allows, "prefer
matching mockups first"), this is what's different between them.

There were **four separate, non-identical answers** to "what does the
PalaLive TV frame look like":

| | Our PalaLive mockups | "Locked" Integration Brief | kink-frame v1 | kink-frame v2 ("skeleton") |
|---|---|---|---|---|
| Base/frame color | `--frame: #000000`, `--page: #383737` | `--color-base: #0E1116` | `frame: #0e1117` | `frame: #0E1116` ← **exact match to brief** |
| Panel/raised color | `--panel: #2b3442` | `--color-raised: #151A22` | `matte: #3d4144` | `content: #2d343e` |
| Accent | `--accent: #cfef3a` | `--color-accent: #C8FF00` | `#c8f03c` ← close to brief | (uses the app's `--kink-accent: #c8f03c` too) |
| Outer frame border | 20px | 20px ✓ matches | ~45×54 rounded corner (not a flat border) | 20px uniform ✓ matches brief |
| Left panel width | 1120px | 1100px | n/a (different layout concept — notch, not two flat panels) | n/a |
| Right panel width | 580px | 600px | n/a | n/a |
| Panel gap | 60px | 60px ✓ matches | n/a | n/a |
| Bottom-right treatment | Full-width bottom bar (logo left, clock/weather right) | Same (bottom bar, full width) | Notched pocket, 118-140px tall, holds only the clock | Notched pocket, 140px tall, holds only the clock |
| Logo position | Bottom-left, in the bottom bar | Bottom-left | Top-left, in its own pocket | Top-left, in its own pocket |

**Reading this table:** the Integration Brief's token *values* land almost
exactly on kink-frame's, but its *layout description* (two flat side-by-side
panels + one full-width bottom bar) matches our mockups' layout, not
kink-frame's (notched corner pockets for logo/clock, not a bottom bar). Our
mockups and kink-frame agree on nothing except the 20px border and the
general "lime accent on dark base" idea.

**Resolved:** the answer is our mockups' layout (flat full-width bottom bar,
not kink-frame's notched pocket), since kink-frame is parked entirely. If a
future pass wants to borrow kink-frame's exact token values (they're closer
to the Integration Brief's numbers than our mockups are), that's a
deliberate choice to make then — not required by this decision.

---

## 3. Real app architecture

### 3.1 Current product direction (confirmed via `DEVELOPERHANDOVER.md`, July 2026)

The product has already pivoted from "per-court live scoring system" to
"venue display product — one permanent URL per screen, one staff phone app,
three modes." The repo contains **two overlapping stories**:

| Story | Status | Routes |
|---|---|---|
| Legacy court stack | Parked for new work, kept for existing venues | `/court`, `/setup`, `/playing`, `/control`, `/live` |
| Venue display product | Active, working | `/screen/[screenSlug]`, `/staff/[venueSlug]`, matchplay, kink-frame (unwired) |

**Explicitly out of scope for the new model:** FLIC hardware/physical court
buttons, player self-serve QR setup (`/setup`, `/playing`, `sessions` table),
Raspberry Pi/WebSocket bridges, per-court display URLs as the primary
product surface. Don't design or build against these.

**Corrected route table** (supersedes any earlier version of this doc that
cited `/control/[company]/[venue]/[court]` or `/live/[company]/[venue]/[court]`
as current — those are the *legacy* pattern; the Integration Brief's "Display
URL Structure" section describing them is stale):

| Route | Audience | Status |
|---|---|---|
| `/screen/[screenSlug]` | Venue TV | **Current** — orchestrated display, reads `venue_screens` |
| `/staff/[venueSlug]` | Staff phone | **Current** — pairing + mode control |
| `/kink-frame`, `/kink-frame/skeleton(/display)` | Design prototype | **Current, but unwired** — see §0.2 |
| `/matchplay/*` | Staff | Kept — core of Social Night, feeds into `/staff/[venueSlug]/social-night` |
| `/control/[court]` | Staff | Legacy — scoring UX reusable, URL scope changing |
| `/live/*`, `/court/*` | Display | Legacy, per-court |
| `/setup/*`, `/playing/*` | Player | Legacy, parked (self-serve/session model) |

### 3.2 `venue_screens` — exact current schema

Two migrations, `20250701120000_venue_screens.sql` and
`20250701120100_venue_screen_secrets.sql` (the second moves `pairing_code`
into its own service-role-only table). Effective schema:

| column | type | notes |
|---|---|---|
| `id` | uuid | PK |
| `screen_slug` | text | NOT NULL, UNIQUE — the public TV URL key |
| `venue_slug`, `company_slug` | text | NOT NULL — staff app resolution |
| `display_name` | text | NOT NULL |
| `court_id` | uuid | FK → `courts.id`, nullable, `ON DELETE SET NULL` — internal plumbing for Showcase branding/`useLiveMatch`, not user-facing |
| `active_mode` | text | NOT NULL, default `'idle'`, CHECK IN (`idle`, `social_night`, `showcase_game`) |
| `active_matchplay_event_id` | uuid | FK → `matchplay_events.id`, nullable |
| `active_showcase_match_id` | uuid | FK → `live_matches.id`, nullable |
| `created_at`, `updated_at` | timestamptz | auto-managed |

`pairing_code` lives separately in `venue_screen_secrets` (PK `screen_id`,
`UNIQUE pairing_code`, RLS deny-all except service role). `venue_screens`
itself has `REPLICA IDENTITY FULL` + is added to the `supabase_realtime`
publication (required for live mode-switching), RLS enabled with a public
`SELECT` policy only — all writes go through the edge function.

**Mode-switch side effects** (enforced in the edge function, not a DB
constraint): switching to `idle` nulls both event/match FKs; switching to
`social_night` nulls the showcase FK; switching to `showcase_game` nulls the
matchplay FK. Mutual exclusivity is app-level, not schema-level.

**How `/screen/[screenSlug]` picks what to render** (`VenueScreenDisplay` via
`useVenueScreen`, which does an initial fetch + a Realtime subscription +
a 5s poll fallback), branching purely on `active_mode`:
- `idle` → `ScreenIdle`
- `social_night` + event linked → `MatchplayBoard`; not linked → placeholder
- `showcase_game` + court + match linked → `SpectatorDisplay`; not linked →
  placeholder

This is real, working, production code today — not a stub.

### 3.3 Known issues to fix, not port as-is

Pulled from the existing audit docs in `palapoint-v4/docs/` — read the full
docs before building, this is a condensed pointer, not a replacement:

- **`docs/full-codebase-review-2026-06-19.md`** (start here):
  - The *older* core tables (`courts`, `live_matches`, `matches`, `sessions`,
    etc.) have **no baseline schema in the repo** — only incremental
    migrations, predating the `venue_screens`-era migrations which *are*
    properly done (full `CREATE TABLE`, RLS, triggers, seed data — see 3.2).
    Get a full schema dump from the live dashboard before relying on
    anything not already migrated in-repo.
  - Live-match data fetching is duplicated 4× (`ControlPanel`,
    `CourtDisplay`, `PlayingDisplay` each hand-roll fetch+Realtime instead of
    sharing `useLiveMatch`).
  - Americano pairing algorithm (`lib/matchplay-americano-pairings.ts`) has
    real bugs: silent sit-outs, court count computed as `floor(n/4)` instead
    of honoring configured `court_labels.length`.
  - Scoring engine is duplicated verbatim between `lib/scoring/engine.ts` and
    the Deno copy in `supabase/functions/_shared/scoring/engine.ts` (513
    lines, drift risk).
  - Also documents what's working well: the token system,
    `useLiveMatch`/`useCourtRoute` hooks, spectator component decomposition.
- **`docs/design-system-audit.md`** — flags `setup-form.css` as a fully
  disconnected token universe (hex/HSL not wired to `:root`).
- **`docs/matchplay-audit-report.md`** — full Matchplay feature inventory: 3
  edge functions (`matchplay-event`, `matchplay-player`, `matchplay-round`,
  POST+`action` style), no `components/matchplay/` (UI inline in page files).
- **`docs/matchplay-event-hub.md`** — score entry is a bottom-sheet modal
  with a number pad (matches "Score Entry" in our mockups). Round pairing is
  generated **client-side in the browser**, then persisted — not
  server-authoritative. Round-count cap is read from a `localStorage` key
  (`palapoint_matchplay_settings`) — a hidden dependency, don't carry over
  blindly.
- **`docs/matchplay-design-alignment.md`**, **`docs/matchplay-board-audit-v2.md`**
  — token-migration and UX-spec gap analysis for Matchplay CSS/TV board.
  Relevant only if that board gets picked up.
- **`docs/venue-display-product-inventory.md`** — the original audit
  proposing the Idle/Social-Night/Showcase-Game model. Per
  `DEVELOPERHANDOVER.md`: still useful, but "some 'doesn't exist' items now
  exist" — the venue-screen layer (§3.1-3.2 here) has evolved since it was
  written. Verify against current code, don't trust it blindly.
- **`docs/ui-components.md`** — canonical CSS primitives (`.card`, `.btn`).

### 3.4 kink-frame — file map (parked; reference only, do not extend)

Per the locked decision (§0.3), kink-frame is **not** the base to finish —
`design-mockups/` is. Kept here only so a future session can cherry-pick a
motion pattern or token value without re-discovering where they live.

| Area | Path |
|---|---|
| v1 geometry/colors | `lib/layout/kink-frame-geometry.ts` |
| v2 geometry/colors | `lib/layout/kink-frame-v2-geometry.ts` |
| Mode constants | `lib/layout/kink-frame-venue-mode.ts` |
| Transitions | `lib/layout/kink-frame-transitions.ts` |
| Styles | `app/styles/kink-frame.css` |
| Full demo (v1, mode-switching) | `components/layout/KinkFrameVenueScreen.tsx` |
| v2 skeleton (geometry preview only, no modes) | `components/layout/KinkFrameSkeletonDisplay.tsx` |
| Hardcoded social demo data | `lib/layout/kink-frame-social-data.ts` (note: `lib/layout/kink-frame-social-players.ts`'s `KINK_FRAME_SOCIAL_PLAYERS` is defined but dead/unused — nothing imports it) |
| Routes | `app/kink-frame/page.tsx`, `app/kink-frame/skeleton/page.tsx`, `app/kink-frame/skeleton/display/page.tsx` |

**Note:** an earlier revision of `DEVELOPERHANDOVER.md` had a §10 "near-term
next steps" list that started with "wire kink-frame skeleton to
`/screen/[screenSlug]`." The current (July 2026) version supersedes that —
its locked decisions explicitly park kink-frame and its own §10 now reads
"Idle TV shell **from mockups**," "Social Night TV **from mockups**," etc.
Don't act on the older kink-frame-first sequencing if you see it referenced
elsewhere (e.g. `docs/venue-display-product-inventory.md` predates the
parking decision).

---

## 4. Data requirements per screen state (from the Integration Brief)

### Idle
- **Left panel**: video player, self-hosted MP4 clips, looped playlist — no
  DB dependency, just a per-venue video-source config (**missing today** —
  no video playlist config table/mechanism exists; kink-frame's idle hardcodes
  a single YouTube video ID, not venue-configurable).
- **Right panel**: court bookings — next booking per court, in-use/available
  state. **Source: Playtomic API, not yet integrated** (confirmed zero
  references to "Playtomic" anywhere in the current codebase). Needs
  illustrative/mock data now, with the interface built to accept real
  Playtomic data later without a rewrite (see §5).
- **Moment layer** (rotating): next event, sponsor content, recent result.
  Needs a `sponsors` table (**does not exist** — confirmed via migration
  grep) and an events/"next event" source (**check whether Social Night
  setup already implies one before creating a new table** — not confirmed
  either way).
- **Fixed layer**: logo, clock (client-side), weather (needs a weather API
  call per venue location — **not integrated**, no existing code found).

### Social Night
Most data already exists — this is the most-connected state:
- Round fixtures by court: already in the Americano/matchplay tables
  (`matchplay_events`/`matchplay_rounds`/`matchplay_matches`) — needs
  surfacing in the display format, not new backend work.
- Player list → live leaderboard → final standings: all derivable from
  existing `matchplay_players` + round/match data.
- Realtime: display should update on new round, score entry, event end —
  `venue_screens` + `MatchplayBoard`'s existing Realtime wiring already
  covers the "is there an active event / what round" part; verify it also
  covers live score/standings updates within a round.

### Showcase Game
- Live score + sets: already exists (`live_matches`, scoring engine) — needs
  connecting to the display, which for the *current* real display
  (`SpectatorDisplay` via `/screen/[screenSlug]`) is already done. Only
  relevant if building new components against this state.
- Match card: player photos (**already in Supabase Storage**, existing
  player-photo feature), full names, VS divider, no ratings shown here.
- Realtime: updates on every point scored.

## 5. Playtomic integration architecture (build for this now, connect later)

Per the Integration Brief, and confirmed there is genuinely nothing to
reconcile against (zero existing Playtomic code):

- Court booking component should consume a **normalised** booking object
  regardless of source (mock now, real later):
  ```typescript
  type CourtBooking = {
    court_name: string
    court_number: number
    next_booking_start: string  // ISO datetime
    next_booking_name: string   // booker name or session type
    session_type: 'private' | 'coaching' | 'club_event' | 'social_night' | 'available'
    is_available_now: boolean
    available_from?: string     // ISO datetime, if currently in use
  }
  ```
- The real Playtomic call belongs in a **Supabase Edge Function**, not
  client-side (credentials must stay server-side). It should accept
  `venue_id`, look up that venue's Playtomic `tenant_id`/credentials from a
  `venue_integrations` table (**does not exist yet** — needs creating),
  call `https://thirdparty.playtomic.io/api/v1/bookings` (Bearer auth,
  Client ID + Secret from the venue's Playtomic Manager → Settings →
  Developer Tools) with today's date range, and return the normalised shape
  above.
- Raw Playtomic fields available: `booking_id`, `resource_name` (court name),
  `booking_start_date`, `booking_end_date`, `booking_type`,
  `participant_info.participants[0].name`.
- **The Edge Function is the integration point, not the component** — build
  the front-end against the normalised type now with mock data; swapping in
  the real function later shouldn't touch the component.

## 6. Locked component/interaction decisions (from the Integration Brief)

These come from a document marked "locked — do not re-litigate," so treat
them as settled unless someone explicitly reopens them:

- **Court booking cards**: primary info is next booking *time* + booking
  name (not current in-use/available state as the headline). Session type
  label shown only when not obvious from the name ("Coaching Session",
  "Club Americano"); dropped entirely for named private bookings. Lime court
  label top-left, time pill top-right, no clock icon. Available courts get
  lime accent treatment; in-use courts are muted but same card weight.
- **Leaderboard pill**: score and movement combined in *one* pill, e.g.
  `19 ↑2` — green up-arrow, red/muted down. (Note: our current Matchplay
  mockup renders these as two separate elements — a colored delta text next
  to a round pill — not one combined pill. Worth reconciling against this
  locked spec if the Matchplay standings design gets revisited.) Player
  rating pill (`3.5`) appears on the pre-game player list only, never on the
  leaderboard.
- **Social Night fixture cards**: full names (`Glen Noble`, not `G. Noble`),
  court label as a quiet identifier, VS divider, overlapping circular player
  photos.
- **Showcase serving indicator**: lime border on the serving team's score
  panel, **minimum 10px border width** to read at 3-5m TV viewing distance.
  (Our TV mockup's serving bracket is thinner than this at native scale —
  worth checking against the 10px-at-1920×1080 minimum before finalizing.)
- **Transitions** (not represented in any static mockup — motion spec only):
  Main Stage = soft crossfade with subtle scale shift. Fixed Layer = content
  swaps in place, almost no movement. Moment Layer = slides in from a
  consistent direction, holds, slides out.

## 7. Working style (from the Integration Brief — carries over regardless of path)

- Strategy/design direction decisions happen in the main Claude chat; build
  implementation happens in Claude Code.
- **One focused phase per prompt** — don't combine everything into one giant
  build.
- SQL runs directly in the Supabase dashboard where possible.
- Edge Functions deployed via `npx supabase functions deploy [function] --no-verify-jwt`.
- **Git revert preferred over code-removal edits** when a change affects all
  deployed venues.
- Before making changes on a new phase: review the existing code against
  whatever spec is in play, identify what already exists vs. what's missing,
  and **report findings before writing code** — this document is itself a
  product of following that instruction.

---

## 8. Immediate next step

§0.3 and §2 are now resolved (extend v4, `design-mockups/` is canonical, kink-frame
parked). Per `DEVELOPERHANDOVER.md` §10 "Suggested next steps," the build
order is:

1. **Idle TV shell from mockups** — frame, bottom bar, panels; mount under
   `/screen`'s idle branch.
2. **Social Night TV** — fixtures + players/standings from mockups; replace
   the `MatchplayBoard` branch with live event data.
3. **Showcase TV** — scoreboard from mockups; replace `SpectatorDisplay`;
   keep the existing live-match subscription.
4. **Staff visual pass** — align phone UI to the showcase + matchplay mockup
   flows (staff logic mostly already exists — see `DEVELOPERHANDOVER.md` §6).
5. **Idle integrations** — Playtomic bookings (§5 above), sponsors, weather,
   video playlist config.

Hand this document plus `DEVELOPERHANDOVER.md`,
`docs/venue-display-product-inventory.md`, and
`docs/full-codebase-review-2026-06-19.md` to a dedicated session, scoped to
§7's "one phase per prompt" rule rather than attempting the whole rebuild in
one pass. New PalaLive components should go under a clear prefix
(`components/palalive/`, `app/styles/palalive-*`) per `DEVELOPERHANDOVER.md`
§5 — don't mix them into the legacy court-session paths.
