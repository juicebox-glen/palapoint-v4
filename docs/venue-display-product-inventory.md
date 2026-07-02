# Structural inventory: current codebase vs venue display product

**Date:** 2026-06-30  
**Status:** Audit only — no code changes  
**Verdicts:** KEEP AS-IS · MODIFY · PARK · DOESN'T EXIST YET

---

## New product direction (reference)

PalaPoint becomes a **venue display product**, not an on-court scoring system.

- **One staff phone app**, **one permanent display URL per venue screen**
- **Two staff-driven modes:**
  - **Social Night** — Americano/matchplay setup, fixtures, manual results, standings on screen
  - **Showcase Game** — staff/ref scores a single match from their phone; live scoreboard on display
- **Idle** when neither mode is active — branding, sponsor content, upcoming events, potentially an embedded stream
- **Out of scope:** FLIC hardware, per-court physical buttons, player self-serve QR setup, Raspberry Pi

**Confirmed:** Showcase Game is 100% phone-tap scoring from staff/ref. Zero hardware, zero physical buttons, zero FLIC dependency anywhere in the new model. Any button-press/gesture/WebSocket-listening code in CourtDisplay is entirely legacy for this direction.

---

## Executive summary

The codebase is really **three parallel products** sharing branding and Supabase:

| Stack | Role today | New direction fit |
|-------|------------|-------------------|
| **Matchplay** (`/matchplay/*`) | Staff-run Americano + event TV board | **Social Night** — closest direct match |
| **Court stack** (`/court`, `/setup`, `/playing`, `/control`, `/live`) | Per-court FLIC + player QR + staff control | Mostly **legacy assumptions** |
| **Ops** (`/status`) | Live activity dashboard | Orthogonal — still useful |

Nothing today implements **one permanent URL per venue screen** that switches **idle → Social Night → Showcase Game**. That orchestration layer is missing.

---

## 1. Matchplay flow (`app/matchplay/*`)

**Verdict: KEEP AS-IS (core) · MODIFY (integration)**

| Piece | Verdict | Reason |
|-------|---------|--------|
| Event setup (`/new`, `/new/players`) | **KEEP AS-IS** | Staff-driven Americano setup already matches Social Night |
| Staff hub (`/[id]`) | **KEEP AS-IS** | Manual results, round advance, edit match — correct model |
| TV board (`/[id]/board`) | **MODIFY** | Fixtures + standings work, but URL is **per event**, not per venue screen |
| Standings / results / player photos | **KEEP AS-IS** | Staff + display surfaces for Social Night |
| `matchplay-*` edge functions + tables | **KEEP AS-IS** | Isolated from FLIC/sessions/courts |
| Launcher mode picker | **MODIFY** | Only Americano live; others are placeholders |
| Logical “court labels” in matchplay | **KEEP AS-IS** | String labels only — not tied to physical courts or FLIC |

### Assumption check

Matchplay already assumes **no FLIC, no player self-serve, no `sessions`**. It does **not** assume a unified venue display URL or idle screen when no event is running (board shows generic “Next event coming soon” if event id is invalid, not a venue-branded idle hub).

### Gap vs new model

Social Night is a **mode** on a venue screen; today it’s a **separate route tree** staff must navigate to explicitly.

### Key files

| Path | Purpose |
|------|---------|
| `app/matchplay/page.tsx` | Launcher — list/continue events |
| `app/matchplay/new/page.tsx` | Setup wizard (players, courts, points, rounds) |
| `app/matchplay/new/players/page.tsx` | Roster + photos → create event |
| `app/matchplay/[id]/page.tsx` | Staff event hub (scoring, rounds) |
| `app/matchplay/[id]/board/page.tsx` | TV board (fixtures + standings) |
| `app/matchplay/[id]/standings/page.tsx` | Tablet standings |
| `app/matchplay/[id]/results/page.tsx` | Post-event recap |
| `app/matchplay/[id]/players/page.tsx` | Mid-event roster edit |
| `components/matchplay/BoardStandings.tsx` | Reusable TV standings list |
| `lib/api/matchplay.ts` | Client for matchplay edge functions |
| `supabase/functions/matchplay-event/` | Event CRUD lifecycle |
| `supabase/functions/matchplay-player/` | Players + standings |
| `supabase/functions/matchplay-round/` | Rounds, matches, results |

Matchplay uses **logical court labels** (strings like "Court 1") — no FK to the `courts` table. No reads/writes to `live_matches` or `sessions`.

---

## 2. ControlPanel (staff scoring interface)

**Verdict: MODIFY · core candidate for Showcase Game staff phone**

| Piece | Verdict | Reason |
|-------|---------|--------|
| `ControlPanel.tsx` stage machine (`setup → preview → live`) | **MODIFY** | Same staff-tap scoring UX Showcase needs; rename/re-scope, not rewrite |
| `MatchSetupForm`, `ControlMatchPreview`, `ControlScoreboard` | **KEEP AS-IS** | Shared setup + live score UI — hardware-agnostic |
| `MatchFinishedPanel`, end/rematch flows | **MODIFY** | Useful for showcase; drop session/rematch-to-session paths |
| Coupling to **`court_id` + latest `live_matches` row** | **MODIFY** | Showcase may be **venue-screen-scoped**, not “one match per physical court” |
| Coupling to **`/control/{company}/{venue}/{court}`** | **MODIFY** | Staff app should be **venue-level** (or mode-level), not per-court |
| `SessionPromptCard` on control | **PARK** | Session exclusivity is self-serve model |
| Scoring via `score` API (`source: 'control_panel'`) | **KEEP AS-IS** | Already 100% phone-tap — aligns with confirmed Showcase direction |

### Coupling summary

ControlPanel is **not session-aware** (good). It **is court-bound** via `useCourtRoute` and “latest match for this court” (needs rethinking). It is the **best starting point for Showcase staff phone** — closer than CourtDisplay or PlayingDisplay.

### Key files

| Path | Purpose |
|------|---------|
| `components/displays/ControlPanel.tsx` | Staff match lifecycle controller |
| `components/displays/ControlMatchPreview.tsx` | Staff preview wrapper |
| `components/shared/ControlScoreboard.tsx` | In-game score UI (also used on `/playing`) |
| `components/shared/MatchSetupForm.tsx` | Shared setup form |
| `components/shared/MatchConfirmation.tsx` | Pre-game preview shell |
| `components/shared/MatchFinishedPanel.tsx` | Endgame panel |
| `app/control/[[...segments]]/page.tsx` | Route shell |

---

## 3. CourtDisplay

**Verdict: PARK (input/flow) · MODIFY (display chrome only if reused)**

| Piece | Verdict | Reason |
|-------|---------|--------|
| Live scoreboard markup + overlays (`SideSwap`, `SetWin`, `MatchWin`, `ServerAnnouncement`) | **MODIFY** | Generic broadcast moments — reusable if Showcase display wants court-TV styling |
| `SpectatorPregameTeamInner` reuse | **KEEP AS-IS** | Already shared with spectator stack |
| Idle screen (logo + **QR to `/setup`** + “HOLD BUTTON TO START”) | **PARK** | Built for player self-serve + FLIC walk-up |
| Keyboard sim (`q`/`p`/`a`/`r`), dev WebSocket bridge | **PARK** | Legacy hardware / Pi path — zero role in new model |
| `sendCourtPress` → `button_a`/`button_b`/`hold` | **PARK** | Confirmed dead for Showcase |
| Quick Play / phone pre-game branching (`session_id`, `started_at` ack) | **PARK** | Three-way flow logic tied to old product |
| Realtime on `sessions` table | **PARK** | Session lifecycle for self-serve |
| 5s poll, 90s score warm-up ping | **MODIFY** | Resilience patterns useful; FLIC warm-up rationale goes away |
| ~970-line monolith mixing IO + policy + render | **PARK** as unit | **SpectatorDisplay** is the better display template |

### For Showcase Game display

Prefer **`SpectatorDisplay` + shared scoreboard components** over refactoring CourtDisplay. CourtDisplay’s button/gesture/WebSocket layer is **entirely legacy** per confirmed direction.

### Key files

| Path | Purpose |
|------|---------|
| `components/displays/CourtDisplay.tsx` | Court TV + hardware input + overlays |
| `components/SideSwapOverlay.tsx` | Side swap broadcast moment |
| `components/SetWinOverlay.tsx` | Set win overlay |
| `components/MatchWinOverlay.tsx` | Match complete overlay |
| `components/ServerAnnouncementOverlay.tsx` | Server select overlay |
| `app/court/[[...segments]]/page.tsx` | Route shell |

---

## 4. PlayingDisplay, SetupDisplay, `/setup` QR, sessions

**Verdict: PARK (almost entirely self-serve / FLIC-sync model)**

| Piece | Verdict | Reason |
|-------|---------|--------|
| `SetupDisplay` + `/setup/[[...segments]]` | **PARK** | Player phone creates session + match; court QR funnel |
| `PlayingDisplay` + `/playing/[[...segments]]` | **PARK** | Player companion waiting on FLIC ack, session validation, END SESSION |
| `PlayingReadyHero` (“press button on court”) | **PARK** | Exists only to sync phone UI with first hardware press |
| `SessionProtectionPrompt`, takeover prompts | **PARK** | Multi-player court exclusivity — not staff-driven venue model |
| `sessions` table + `session` edge function | **PARK** | Court-scoped player sessions with 30-min expiry |
| `live_matches.session_id` linkage | **MODIFY** | Column can stay in DB but **Showcase path should not use it** |
| `sessionStorage` draft keys (`setup_session_id_*`, etc.) | **PARK** | Browser persistence for player flow |
| `/session-review/[id]` | **PARK** | Post-session player recap — no player sessions in new model |
| `buildSetupPageUrl()` in `lib/venue.ts` | **PARK** | Generates QR targets for idle court display |

### Scope

This entire stack assumes **anonymous player self-serve at the court + hardware start signal**. None of it maps to “one staff phone, one venue screen.”

### Key files

| Path | Purpose |
|------|---------|
| `components/displays/SetupDisplay.tsx` | Player phone setup flow |
| `components/displays/PlayingDisplay.tsx` | Player phone in-game companion |
| `components/PlayingReadyHero.tsx` | “Press button on court” hero |
| `components/SessionProtectionPrompt.tsx` | Court takeover prompts |
| `lib/api/session.ts` | Session client API |
| `supabase/functions/session/index.ts` | Session edge function |
| `app/setup/[[...segments]]/page.tsx` | Setup route |
| `app/playing/[[...segments]]/page.tsx` | Playing route |
| `app/session-review/[id]/page.tsx` | Session recap |

---

## 5. SpectatorDisplay

**Verdict: MODIFY · best existing Showcase display shell**

| Piece | Verdict | Reason |
|-------|---------|--------|
| `SpectatorDisplay` orchestrator | **MODIFY** | Thin `MatchState` router — good pattern for Showcase live scoreboard |
| `SpectatorLive`, `SpectatorPregame`, `SpectatorEndgame` | **KEEP AS-IS** | Read-only match phases without sessions/hardware |
| `SpectatorIdle` | **MODIFY** | Branding + logo works; **court label** and “waiting for court match” framing wrong for venue screen |
| `/live/[[...segments]]` route | **MODIFY** | Per-court URL; new model wants **per venue screen** |
| `useLiveMatch` hook | **MODIFY** | Subscribes to **`court_id`** — needs venue-screen scope or explicit “showcase match id” |
| vs Matchplay board | **KEEP AS-IS** (both) | Spectator = **single match**; Matchplay board = **Social Night** — different modes, both valid |

### Purpose today

Read-only **court spectator TV** parallel to CourtDisplay, not event standings. It maps to **Showcase Game display**, not Social Night (use matchplay board for that).

### Key files

| Path | Purpose |
|------|---------|
| `components/displays/spectator/SpectatorDisplay.tsx` | Thin orchestrator |
| `components/displays/spectator/SpectatorIdle.tsx` | Idle / loading |
| `components/displays/spectator/SpectatorPregame.tsx` | Pre-game lineup |
| `components/displays/spectator/SpectatorLive.tsx` | Live scoreboard |
| `components/displays/spectator/SpectatorEndgame.tsx` | Brief winner screen |
| `lib/hooks/useLiveMatch.ts` | Realtime + poll hook |
| `app/live/[[...segments]]/page.tsx` | Route shell |

---

## 6. VenueBranding / company config

**Verdict: KEEP AS-IS (branding) · DOESN'T EXIST YET (idle content)**

| Piece | Verdict | Reason |
|-------|---------|--------|
| `VenueBranding` + `getVenueBranding()` / `brandingStylesFor()` | **KEEP AS-IS** | Company/venue colours, logo, CSS vars — reusable on idle + both modes |
| `companies.config.branding` JSON | **KEEP AS-IS** | Single source for theming across surfaces |
| `VenueLogo`, `GradientWaveDrift`, token CSS | **KEEP AS-IS** | Visual primitives for idle/venue screen |
| Sponsor slots, upcoming events, embedded stream | **DOESN'T EXIST YET** | Idle screen content model not in config or components |
| `isShowCourt` flag on branding | **MODIFY** | Naming/concept tied to old “show court” idea — may need “venue screen” semantics |
| Matchplay header branding path (`getMatchplayVenueHeaderBranding`) | **MODIFY** | Duplicate resolution path — unify under venue-screen config |

### Idle today

`SpectatorIdle` and CourtDisplay idle show **logo + gradient** only. Matchplay board idle is a **generic PalaPoint placeholder**, not venue-configured sponsors/events/stream.

### Key files

| Path | Purpose |
|------|---------|
| `lib/venue.ts` | `VenueBranding`, resolution, CSS injection, `buildSetupPageUrl` |
| `components/shared/VenueLogo.tsx` | Logo component |
| `components/backgrounds/GradientWaveDrift.tsx` | Idle background |
| `lib/supabase.ts` | `getMatchplayVenueHeaderBranding()` (parallel path) |

---

## 7. Routing model

**Verdict: MODIFY (new model) · PARK (court-centric URLs)**

| Route pattern | Verdict | Reason |
|---------------|---------|--------|
| `/court/{company}/{venue}/{court}` | **PARK** | FLIC court TV + QR idle — physical court assumption |
| `/setup/`, `/playing/` | **PARK** | Player self-serve |
| `/control/{company}/{venue}/{court}` | **MODIFY → PARK?** | Staff scoring works but URL is per-court; Showcase staff app likely **`/staff/{venue}`** or single app with mode picker |
| `/live/{...}` | **MODIFY** | Becomes Showcase display or folds into **`/display/{venue-screen}`** |
| `/matchplay/[id]/board` | **MODIFY** | Social Night content OK; should be **selected by venue screen mode**, not manual event URL on TV |
| `/matchplay/*` staff routes | **MODIFY** | Becomes Social Night mode inside **one staff app** |
| `useCourtRoute` + `courts` table resolution | **MODIFY** | Entire resolver assumes **court slug** as primary key for displays |
| `/status` | **KEEP AS-IS** | Ops telemetry — orthogonal to product UX |

### Current court URL resolution

Shared hook: `lib/hooks/useCourtRoute.ts`

Two URL shapes for all court-scoped pages:

1. **Three segments:** `/page/{company}/{venue}/{courtNumber}` → `getVenueBranding()`
2. **One segment:** `/page/{slug}` or UUID → `getCourtBySlug()` → `getVenueBrandingForCourtId()`

Examples:

- Production: `/court/padel4all/eastbourne/1`
- Dev: `/court/court-1`

### New model implication

**Per venue screen** URL (e.g. `/display/padel4all/eastbourne/main-hall`) replaces **per physical court** URLs. The `courts` table and court slug may become **legacy** or shrink to “logical court labels inside Social Night only” (matchplay already uses string labels, not FKs).

---

## 8. Venue screen mode / state machine

**Verdict: DOESN'T EXIST YET (orchestration) · scattered implicit state today**

| What exists | Verdict | Reason |
|-------------|---------|--------|
| Unified **idle \| social \| showcase** venue-screen mode | **DOESN'T EXIST YET** | No table, flag, or route that picks what the TV shows |
| Matchplay board states (`setup` / `in_progress` / `completed`) | **KEEP AS-IS** | Event-level state inside Social Night only |
| `ControlPanel` `ControlStage` | **KEEP AS-IS** | Staff-side match lifecycle, not venue-screen mode |
| `CourtDisplay` overlay stack | **PARK** | Court-TV state machine with FLIC/quick-play/phone branches |
| `SpectatorDisplay` phase tree | **MODIFY** | Single-match display phases — subset of Showcase mode, not full venue orchestration |
| “Always exactly one live match per court” | **Assumption today** | `live_matches` latest row per `court_id` drives court/spectator/control displays |
| Staff picks mode on phone → display follows | **DOESN'T EXIST YET** | No pub/sub or `venue_screens.active_mode` equivalent found |

### Distributed state machines today

There is **no central state-machine module**. Each display owns implicit or explicit UI state:

**Court TV (`CourtDisplay.tsx`):** `idle → ready → server_announcement → scoreboard → overlays` — branches on `session_id`, `started_at`, Quick Play vs phone setup.

**Spectator TV (`SpectatorDisplay.tsx`):** `idle → pregame → live → endgame` — driven by `live_matches.status`.

**Staff control (`ControlPanel.tsx`):** explicit `ControlStage = 'setup' | 'preview' | 'live'`.

**Matchplay board:** event-level `setup / in_progress / completed`.

**Today:** Staff open **different URLs** for different jobs. The TV has **no concept** of “venue screen is in Social Night” vs “Showcase” vs “idle branding.”

---

## 9. FLIC / hardware / gesture / WebSocket scope (dead in new direction)

**Verdict: PARK (all below)**

| Area | Files / surfaces | Reason |
|------|------------------|--------|
| Score API **`button_a` / `button_b`** paths | `supabase/functions/score/index.ts` | Physical button scoring |
| **`gesture: hold`** Quick Play create | `score/index.ts`, CourtDisplay idle | Walk-up play without staff |
| **`ready_ack`** (`started_at` on first click, no point) | `score/index.ts`, CourtDisplay, PlayingDisplay | Phone/hardware sync |
| **`double_click` undo** from buttons | `score/index.ts` | Hardware gesture |
| CourtDisplay **WebSocket listener** | `CourtDisplay.tsx` (HTTP dev, disabled on HTTPS) | Pi bridge → keyboard |
| CourtDisplay **keyboard simulation** | `CourtDisplay.tsx` | Dev stand-in for buttons |
| **`PlayingReadyHero`**, “PRESS BUTTON TO START” copy | setup/playing/court ready states | Hardware start signal UX |
| **`started_at` null until FLIC ack** split | match create + score + playing poll | Dual start path (staff `start` vs hardware ack) |
| Score function **90s warm-up ping** from CourtDisplay | `CourtDisplay.tsx` | Pi/edge latency for button path |
| README/docs referencing FLIC, Pi, QR idle | docs, README | Product docs for old model |

### Keep from score API for Showcase

**`source: 'control_panel'`** path only (staff tap scoring + undo via control UI calling match/score functions).

### Keep from match API

create / start / end / undo for staff-driven single match — **MODIFY** to drop session_id and hardware-ack semantics.

---

## Cross-cutting inventory

| Concern | Verdict | Reason |
|---------|---------|--------|
| **One staff phone app** | **DOESN'T EXIST YET** | Today: `/matchplay` launcher + `/control/{court}` are separate apps/routes |
| **One permanent display URL per screen** | **DOESN'T EXIST YET** | Today: `/court/...`, `/live/...`, `/matchplay/[id]/board` |
| **Idle venue screen** (brand, sponsors, events, stream) | **DOESN'T EXIST YET** | Only minimal logo idle exists |
| Scoring engine (`lib/scoring/*`, `_shared/scoring`) | **KEEP AS-IS** | Domain logic — mode-agnostic |
| `useLiveMatch`, Supabase Realtime patterns | **KEEP AS-IS** | Transport layer — re-scope subscription target |
| Design system previews | **KEEP AS-IS** | Useful for iterating venue-screen modes without backend |
| `control_tokens` / PIN validation | **PARK** | Helpers exist; unused in matchplay; not part of new staff-app story yet |
| `/game/[id]`, `/teams/[id]` | **PARK** | Stubs / peripheral — not core to either new mode |
| `/status` + `/api/status` | **KEEP AS-IS** | Ops dashboard — orthogonal to venue display UX |

---

## Mode mapping at a glance

```
NEW MODEL                         CURRENT CODEBASE
─────────────────────────────────────────────────────────────
Idle venue screen                 SpectatorIdle (partial) + no sponsors/stream/events
Social Night staff phone          app/matchplay/* hub (KEEP)
Social Night venue display        app/matchplay/[id]/board (MODIFY URL/orchestration)
Showcase Game staff phone         ControlPanel (MODIFY scope/URL)
Showcase Game venue display       SpectatorDisplay (MODIFY scope/URL)
                                  (NOT CourtDisplay input layer)
```

---

## Architecture today (high level)

```mermaid
flowchart TB
  subgraph staff [Staff surfaces — separate URLs]
    MP[/matchplay/*]
    CP[/control/{court}]
  end

  subgraph player [Player self-serve — PARK]
    SU[/setup]
    PL[/playing]
  end

  subgraph display [Display surfaces — separate URLs]
    CD[/court — FLIC + QR]
    SP[/live — spectator]
    MB[/matchplay/id/board]
  end

  subgraph backend [Supabase]
    LM[(live_matches)]
    SE[(sessions)]
    ME[(matchplay_*)]
    SC[score fn]
    MA[match fn]
    SS[session fn]
  end

  MP --> ME
  CP --> MA & SC
  SU & PL --> SS & LM
  CD --> SC & LM & SE
  SP --> LM
  MB --> ME
```

---

## Bottom line

- **Social Night** is largely **built** in matchplay — best **KEEP AS-IS** candidate, needs **MODIFY** only for unified venue-screen URL and mode switching.
- **Showcase Game** is **half-built**: staff side ≈ **ControlPanel**; display side ≈ **SpectatorDisplay**; scoring engine **KEEP AS-IS**. No unified mode orchestration.
- **On-court self-serve** (`/setup`, `/playing`, sessions, QR, FLIC ack) → **PARK**.
- **CourtDisplay as a product surface** → **PARK** (legacy hardware/QR/quick-play); steal overlays/scoreboard styling if needed.
- **Venue branding** → **KEEP AS-IS** for theming; idle **content** → **DOESN'T EXIST YET**.
- **Per-court routing** → **MODIFY/PARK** in favour of **per venue screen** — **DOESN'T EXIST YET**.

---

## Related docs

- `docs/matchplay-event-hub.md` — Matchplay hub behaviour
- `docs/matchplay-board-audit-v2.md` — TV board vs UX spec
- `docs/full-codebase-review-2026-06-19.md` — Prior codebase review (SpectatorDisplay called out as good template)
- `docs/design-system-audit.md` — Design system route inventory
