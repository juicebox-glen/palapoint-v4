# PalaPoint V4 — Full Codebase Review

**Date:** 2026-06-19  
**Scope:** Next.js app (routes, components, styles), Supabase edge functions, migrations, and `docs/`  
**Features reviewed:** Matchplay, setup, playing, control, spectator, board, court display

---

## 1. Executive Summary — Top Issues by Impact

| Rank | Issue | Impact | Primary locations |
|------|-------|--------|-------------------|
| 1 | **Baseline schema, RLS, and indexes absent from repo** — only 3 incremental migrations exist; security and deploy reproducibility depend on Supabase dashboard state not in version control | **Critical** — onboarding, audits, disaster recovery | `supabase/migrations/` (3 files only) |
| 2 | **Live-match data layer duplicated 4×** — `ControlPanel`, `CourtDisplay`, `PlayingDisplay` each implement fetch + Realtime + polling; only `SpectatorDisplay` and partial `SetupDisplay` use `useLiveMatch` | **High** — bugs drift, memory/network cost at venues | `lib/hooks/useLiveMatch.ts`, `components/displays/*.tsx` |
| 3 | **Americano pairing algorithm has silent sit-outs and ignores configured court count** — leftover pairs not scheduled; `floor(n/4)` courts used instead of `court_labels.length` | **High** — unfair rest distribution in real events | `lib/matchplay-americano-pairings.ts:43–70`, hub auto-gen in `app/matchplay/[id]/page.tsx:598–639` |
| 4 | **`matchplay.css` (~3100 lines) globally imported with large dead sections** — steppers, format setup, old pill UI ship on every route including court/spectator TVs | **High** — bundle/CSS bloat, maintenance confusion | `app/globals.css:6–7`, `app/styles/matchplay.css` |
| 5 | **Edge function + client response contracts inconsistent** — three response shapes; hub checks `result.event` instead of `result.success` in places | **High** — silent failures, fragile error handling | `supabase/functions/*`, `app/matchplay/[id]/page.tsx:557–561,713–726` |
| 6 | **Documentation drift on core flows** — `matchplay-event-hub.md` still describes inline stepper score entry; code uses bottom-sheet modal + number pad | **Medium** — misleads future contributors | `docs/matchplay-event-hub.md:55–92` vs `page.tsx:535,1032–1053` |
| 7 | **Parallel UI/CSS implementations without shared primitives** — 4 card systems, 5 pill variants, 3 modal/sheet families, duplicated medal colors | **Medium** — visual drift, fix-one-miss-three | `app/styles/components/`, feature CSS files |
| 8 | **Monolithic page components** — `matchplay/[id]/page.tsx` (1259 lines) and 600–750 line display components mix data, business logic, and rendering | **Medium** — hard to test and refactor safely | `app/matchplay/[id]/page.tsx`, `ControlPanel.tsx`, etc. |
| 9 | **Scoring engine duplicated Deno/client-side** — identical 513-line files with import-only diff | **Medium** — drift on every scoring change | `lib/scoring/engine.ts`, `supabase/functions/_shared/scoring/engine.ts` |
| 10 | **Accessibility gaps on modals and small touch targets** — only score modal has Escape; no focus traps; 22px photo remove, 32px modal close | **Medium** — staff mobile UX, WCAG risk | `matchplay.css:1934–1939`, `setup-form.css:711–716`, modal components |

---

## 2. Findings by Category

### 2.1 Design System & Styling Consistency

#### Token foundation is solid but adoption is uneven

**Well-defined tokens** live in `app/styles/tokens/` (`colors.css`, `spacing.css`, `typography.css`, `components.css`) and load via `app/globals.css` → `tokens/index.css`.

**Gaps:**

- **`--display-font-*`** defined in `typography.css` but never referenced in any CSS file.
- **`--display-space-*`** used only in `matchplay-board.css`; TV spectator/court use ad hoc `clamp(...vh/vw...)`.
- **Z-index tokens ignored:** `--z-modal: 400` in `tokens/components.css:39` vs hardcoded `z-index: 1000` in `control-panel.css:443`, `setup-form.css:792`, and `z-index: 50` in `matchplay.css:691,2187`.

#### Hardcoded values that should reference tokens

| File | Lines / classes | Issue |
|------|-----------------|-------|
| `setup-form.css` | 261, 271, 334, 375 | `#395FF9` ≠ token `--brand-primary` `#5B6CFF` |
| `setup-form.css` | 413 | Team B dot `#ec4899` ≠ `--team-b` `#E84A8A` |
| `setup-form.css` | 186, 595 | `#ef4444` instead of `--error` |
| `control-panel.css` | 656, 1044 | `#1c2129` — ad hoc row bg between `--bg-secondary` and `--bg-tertiary` |
| `matchplay.css` / `matchplay-board.css` | ~2901–3014, 452–477, 1047–1161 | Gold/silver/bronze podium hex duplicated; board comment at `matchplay-board.css:452` acknowledges no tokens |
| `court-display.css` | 79, 83, 235–236, 306 | V3 legacy `#121212`, `#FFA500` vs `--bg-primary`, `--court-accent` |
| `spectator.css` | 297 | `#d0ff14` instead of `--court-ball` `#D0FF14` |
| `session-review.css` | 4–111 | Pre-V4 fallback palette (`#121212`, `#03a97c`) — file is unused (see dead CSS) |

#### Responsive width ladder duplicated 4×

Same breakpoint progression (`28rem → 40rem → 48rem → 52rem`) copy-pasted in:

- `setup-form.css:39–97`
- `control-panel.css:24–52`
- `matchplay.css:25,320,2490`
- `session-prompt.css:22–40`

No shared `--layout-max-*` tokens or utility class.

#### Parallel UI pattern implementations

**Cards (4 systems):**

| Pattern | Location | Used by |
|---------|----------|---------|
| `.card`, `.card--elevated` | `components/cards.css:6–11` | `app/game/[id]/page.tsx` |
| `.matchplay-card` | `components/cards.css:132–138` | Matchplay hub/setup |
| `.setup-section` (glass) | `setup-form.css:216–226` | `MatchSetupForm`, launcher |
| `.preview-card` | `components/cards.css:141–148` | Control preview, session review |
| `.session-prompt-card` | `session-prompt.css:16–28` | `SessionProtectionPrompt` |

Dead variants in `cards.css` with no TSX usage: `.card-elevated` (85), `.card-interactive` (93), `.card-result` (115).

**Buttons:**

- Shared `.btn` system in `components/buttons.css` — good baseline.
- Duplicate CTA: `.matchplay-btn-primary` (148–181) mirrors `.btn.btn--primary.btn--full`.
- Legacy `.playing-btn-*` in `playing.css:190–225` — unused.
- Bespoke `.control-score-button` in `control-panel.css:256–274` — intentional for team-colored thumb zone.

**Pill / segmented selectors (5 variants):**

| Class | File | TSX usage |
|-------|------|-----------|
| `.pill`, `.pill-group` | `components/toggles.css:36–63` | **None** |
| `.setup-sets-pill` | `setup-form.css:318–341` | `MatchSetupForm.tsx` |
| `.setup-mode-card` | `setup-form.css:252–282` | `MatchSetupForm.tsx` |
| `.matchplay-pill` | `matchplay.css:375–399` | **None** (dead) |
| `.matchplay-pill-bar` | `matchplay.css:2549–2599` | `matchplay/new/page.tsx` |

**Modals / bottom sheets (3 families):**

| Pattern | File | z-index |
|---------|------|---------|
| `.control-modal-overlay` | `control-panel.css:434–472` | `1000` |
| `.setup-photo-sheet-backdrop` | `setup-form.css:789–898` | `1000` |
| `.matchplay-score-modal-overlay` | `matchplay.css:1894–1977` | `var(--z-modal)` ✓ |
| `.matchplay-event-modal-overlay` | `matchplay.css:2182–2269` | `50` |

Photo sheet and score sheet share concepts (scrim, safe-area, slide-up) but differ in radius, animation, and z-index.

**Steppers vs number pad:**

- Dead stepper CSS: `.matchplay-score-stepper-*` (`matchplay.css:1233–1279`), `.matchplay-hub-stepper-*` (`matchplay.css:2078–2109`) — no TSX references.
- Active pattern: `.matchplay-hub-quick-score-grid` / `-cell` (`matchplay.css:1998–2024`) in `MatchplayHubScoreModal` (`page.tsx:341–347`).
- Not retrofitted to control panel (uses `.control-score-button`), setup, or session prompt.

#### Dead / unused CSS

| File | Evidence |
|------|----------|
| `session-review.css` | Not imported anywhere; classes like `.review-container` have zero TSX matches. Live session review uses `control-panel.css` `.session-review-*` |
| `playing.css` | Imported in `globals.css:5`; no TSX uses `.playing-container`, `.playing-btn-*`, etc. Player UI now uses `control-panel.css` via `PlayingDisplay.tsx` |
| `components/inputs.css` | Entire `.input` system unused — forms use `.setup-input` |
| `components/toggles.css` | `.toggle`, `.pill`, `.pill-group` unused — setup uses `.setup-switch` |
| Large blocks in `matchplay.css` | `.matchplay-format-*`, `.matchplay-mode-card`, `.matchplay-create-round-*`, `.matchplay-pill` — no TSX references |

#### Cross-viewport consistency

**Staff mobile:** Good token usage for bg, touch targets (`--touch-target-min: 44px`), safe-area on footers/sheets. Drift on brand color in setup, mixed typography (`--ui-font-*` + ad hoc `0.9375rem`, `94px` control scores).

**TV board / spectator:** Good `clamp()` scaling in `spectator.css` and `matchplay-board.css`. Spectator uses `GradientWaveDrift`; board has TODO at `matchplay-board.css:1` to add it. `court-display.css` uses a third bg palette closer to V3.

**Logo sizing duplicated:** `globals.css:50–58` (`!important`) and `setup-form.css:148–156`.

---

### 2.2 Component Architecture

#### `components/ui/` is thin; real reuse is in `components/shared/`

| File | Consumers |
|------|-----------|
| `ScoreSepBar.tsx` | Control, court, spectator, overlays, matchplay — excellent reuse |
| `Header.tsx` | Only `SetupDisplay`, `PlayingDisplay` loading states |
| `PlayerPhotoCapture.tsx` | `MatchSetupForm` only |

Most reusable UI lives in `components/shared/` (`MatchConfirmation`, `MatchFinishedPanel`, `ControlScoreboard`, `ControlMatchPreview`) or is inlined in displays.

#### Duplicate header implementations

- `SetupScreenHeader.tsx` — CSS classes; used across staff/player flows.
- `Header.tsx` — inline styles; overlaps logo logic (lines 20–28 vs `SetupScreenHeader` 17–33).

#### Orphaned components

| Path | Evidence |
|------|----------|
| `components/ScoreDisplay.tsx` | Zero production imports; scoring reimplemented in `CourtDisplay`, `ControlScoreboard`, `SpectatorLive` |
| `app/teams/[id]/page.tsx` (543 lines) | No navigation to `/teams/...` found |
| `app/game/[id]/page.tsx` | Uses hardcoded `dummyGameData`; `id` param unused for fetching |

#### Monolithic components (data + logic + UI)

| Component | Lines | Concerns bundled |
|-----------|-------|------------------|
| `app/matchplay/[id]/page.tsx` | 1259 | Event hub UI, fetch, Realtime, score modal, round management |
| `CourtDisplay.tsx` | 746 | 2 Realtime channels + WebSocket, keyboard scoring, overlays, scoreboard |
| `PlayingDisplay.tsx` | 705 | Session validation, fetch + Realtime + adaptive poll, rematch/end session |
| `SetupDisplay.tsx` | 704 | Session API, court takeover, form draft, match CRUD |
| `ControlPanel.tsx` | 647 | Fetch + Realtime, stage machine, scoring, modals |

**Contrast — good decomposition:** `SpectatorDisplay.tsx` (93 lines) delegates to `SpectatorIdle`, `SpectatorPregame`, `SpectatorLive`, `SpectatorEndgame` using `useLiveMatch`.

#### Inline styles that should be CSS classes

Repeated loading shell pattern (15+ occurrences):

```tsx
<div className="page page-padded" style={{ paddingTop: '1rem' }}>
  <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
    <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
```

In `ControlPanel.tsx:476–479`, `PlayingDisplay.tsx:548–551`, `SetupDisplay.tsx:601–604`, and all catch-all route pages.

**Branding CSS variables** duplicated identically on 5 route pages (`control`, `setup`, `playing`, `court`, `live`). Helper exists only in design-system preview: `brandingStylesFor()` in `app/design-system/preview/court/court-preview-states.ts:56–62` — should live in `lib/venue.ts`.

#### No React Context anywhere

Grep for `createContext` returns zero matches. Props drilled: `courtId`, `courtSlug`, `courtName`, `branding` through every route page → display.

**Candidates:** `CourtRouteProvider` (from `useCourtRoute`), `LiveMatchProvider`, player-only `SessionProvider`.

#### Duplicated business logic across displays

| Logic | Locations |
|-------|-----------|
| Live match fetch + Realtime | `ControlPanel.tsx:117–217`, `CourtDisplay.tsx:166–299`, `PlayingDisplay.tsx:302–417` vs `useLiveMatch.ts` (used by `SpectatorDisplay`, partial `SetupDisplay`) |
| Endgame detection | `ControlPanel.tsx:500–503`, `PlayingDisplay.tsx:599–601`, `SpectatorDisplay.tsx:63–66` — same predicate, three names |
| Prefill form from match | `ControlPanel.prefillFormFromMatch` (380–397), `SetupDisplay.prefillFromMatch` (312–329) |
| Rematch/create body | `ControlPanel.handleRematch`, `PlayingDisplay.handlePlayAgain`, `SetupDisplay.handleContinueFromForm` |
| Mode/sets badge labels | `MatchConfirmation.tsx:12–21` vs `spectator/utils.ts:22–30` |
| Side-swap calculation | `CourtDisplay.calculateSidesSwapped` (53–69) vs `supabase/functions/score/index.ts:11` |
| Score formatting | `CourtDisplay.formatPoints` (46–51) vs `lib/utils/score-format.ts` (`formatPointDisplay`) |

#### Matchplay is a separate island

`app/matchplay/*` does not use `components/displays/*` or `useLiveMatch`. Own CSS, Supabase channels, components (`BoardStandings`, `CourtIcon`). Intentionally separate but increases maintenance surface.

#### Naming inconsistencies

- Route `/live` → component `SpectatorDisplay` (not `LiveDisplay`)
- `courtSlug` vs `setupSlug` — same value, different prop names on `CourtDisplay`
- Page names: `LivePage` vs `SpectatorPage` pattern

---

### 2.3 File Structure & Organization

#### Route map (logical and mostly clear)

| Route | Component | Audience |
|-------|-----------|----------|
| `/control/[[...segments]]` | `ControlPanel` | Staff |
| `/setup/[[...segments]]` | `SetupDisplay` | Player |
| `/playing/[[...segments]]` | `PlayingDisplay` | Player |
| `/court/[[...segments]]` | `CourtDisplay` | Court hardware |
| `/live/[[...segments]]` | `SpectatorDisplay` | Spectator TV |
| `/session-review/[id]` | `SessionReviewDisplay` | Player post-session |
| `/matchplay/*` | Inline pages | Event staff/players |
| `/game/[id]`, `/teams/[id]` | Stubs/legacy | Unclear |

**Good patterns:**

- Thin route pages delegate to `*Display` components.
- `useCourtRoute` (`lib/hooks/useCourtRoute.ts`) resolves slug → courtId/branding once.
- `LIVE_MATCH_FULL_SELECT` (`lib/live-match-select.ts`) documents column alignment.
- Design-system mirror at `app/design-system/` with preview configs per display.

#### Supabase edge functions organization

```
supabase/functions/
  match/           — court match CRUD
  score/           — point scoring + FLIC ack
  session/         — player sessions
  matchplay-event/
  matchplay-player/
  matchplay-round/
  _shared/scoring/ — Deno copy of lib/scoring
```

**Duplicated client wrappers:** `callMatchplayEvent`, `callMatchplayPlayer`, `callMatchplayRound` copied in 7+ matchplay pages. Only `app/matchplay/new/players/page.tsx:105–129` validates HTTP status and non-JSON bodies.

**Duplicated server logic:**

- Active match lookup in `match/index.ts:169–175`, `score/index.ts:113–116`, `session/index.ts` (multiple), client displays — with inconsistent `order`/`limit`.
- Standings rank calculation duplicated in `matchplay-player/index.ts:226–246` and `matchplay-round/index.ts:416–434`.

---

### 2.4 Code Quality & Logic

#### Error handling inconsistency

| Pattern | Where |
|---------|-------|
| `if (!data.success)` | `ControlPanel.tsx:331,351,372`, `SetupDisplay.tsx:359,519` |
| `if (data.success === false \|\| ...)` | `PlayingDisplay.tsx:517` (also checks `!response.ok`) |
| `if (result.event)` / `if (result.round)` — ignores `success` | `page.tsx:557–561,626,713–726` |
| `if (result.success)` | `page.tsx:771,828` (score entry only) |

**Risk:** `handleStartEvent` and `loadEvent` can silently succeed UI-wise on error responses that lack `event`/`round` keys but have `success: false`.

#### Loading state — 7+ distinct patterns

| Pattern | Example |
|---------|---------|
| `.page-loading` | `SetupDisplay`, `PlayingDisplay`, route pages |
| `.spectator-loading` | `SpectatorDisplay`, `/live` route |
| `.matchplay-loading-text` | Event hub |
| `.board-loading` | Board TV |
| Hook `isLoading` | `useLiveMatch`, `useCourtRoute` |

Design system acknowledges this at `app/design-system/screens/matchplay/page.tsx:108–109`.

#### Magic numbers / strings (should be constants)

| Value | Locations | Purpose |
|-------|-----------|---------|
| `32` | `page.tsx:704`, `board/page.tsx:138` | Default `match_target_score` |
| `5000` / `2000` ms | `useLiveMatch.ts:46`, `PlayingDisplay.tsx:388` | Poll intervals |
| `30000` ms | `board/page.tsx:469` | TV sleep keep-alive |
| Status arrays | ControlPanel, PlayingDisplay, useLiveMatch | `['setup','in_progress',...]` duplicated |
| `'americano'` / `'curated'` | Event format strings | No shared enum |

**Partially centralized:** `LIVE_MATCH_*_SELECT`, `MATCHPLAY_AMERICANO_PLAYER_OPTIONS` in `lib/matchplay-americano-setup.ts:2`.

#### Realtime subscription handling

**Good cleanup:** `useLiveMatch.ts:159–167`, `PlayingDisplay.tsx:372–374`, `board/page.tsx:455–459`.

**Issues:**

- **3–4 parallel channels** on same `courtId` when control + court + playing open simultaneously (each display rolls its own subscription instead of shared hook).
- **`CourtDisplay` initial fetch** (`173–178`): `status IN ('setup','in_progress')`, no `order` — can return wrong row if multiple exist.
- **`match/index.ts` `getActiveMatch()`** (`169–175`): same `maybeSingle()` without `order`.
- **Board page:** 4 separate Realtime channels vs hub's 1 multiplexed channel.
- **Hub `loadRounds` on every match update** triggers N+1 edge calls (`list_rounds` + `get_round` per round) — `page.tsx:569–579,682–687`.

#### Americano pairing algorithm — specific unfair scenarios

File: `lib/matchplay-americano-pairings.ts`

**A. Silent sit-outs from odd pair count**

Loop at lines 63–70 pairs consecutive partner pairs into matches (`i += 2`). With 6 players → 3 pairs → **1 match** (4 play, **2 sit out**). `resting` field only set for bye/null partner (lines 57–58), not for these leftovers. Hub compensates downstream via `getSitOutCounts()` (`page.tsx:797–809`) but algorithm doesn't expose per-round rest list.

**B. Court count ignores configured courts**

```typescript
const numCourts = Math.max(1, Math.floor(total / 4))  // line 43
const courts = courtLabels.slice(0, numCourts)         // line 45
```

6 players + 2 configured courts → only **1 court** used. Setup UI warns (`new/page.tsx:91–104`) but algorithm doesn't honor `courtLabels.length`.

**C. Comment vs implementation**

Comment says "everyone partners with everyone once" but implementation is circle-method singles pairing grouped into doubles — does not guarantee full partner coverage in doubles Americano.

**D. Duplicate generation paths**

- Primary: `new/players/page.tsx:369–390` during setup.
- Fallback: `page.tsx:598–639` if `status === 'setup'` && no rounds — does **not** check `event.format === 'americano'`.

**E. Round cap from localStorage**

Hub fallback uses `getMatchplayTotalRoundsFromStorage()` (default 4) — can diverge if localStorage cleared.

**F. No unit tests** for `generateAmericanoPairings` (only `name-format.test.ts`, `scoring/engine.test.ts` exist).

#### Debug logging in production path

`PlayingDisplay.tsx:293–300` — `console.log` on every match update (Realtime + poll).

---

### 2.5 Database & Edge Functions

#### Migrations

Only 3 files in `supabase/migrations/`:

| File | Purpose |
|------|---------|
| `20250304000000_ensure_started_at_null_on_create.sql` | Drop default on `live_matches.started_at` |
| `20250324120000_live_matches_player_photos.sql` | Photo columns on `live_matches` |
| `20260415120000_matchplay_players_photo_url.sql` | `photo_url` on `matchplay_players` |

**Issues:**

- No baseline migration for core tables.
- Timestamp `20260415120000` (April 2026) after March 2025 files — likely typo for `20250415`.
- Mixed schema qualifiers (`public.live_matches` vs unqualified).
- **No RLS, indexes, FKs, or triggers** in repo.

#### Edge function response contracts

**Three styles coexist:**

1. **Matchplay helpers** — `jsonResponse()` / `errorResponse()` with domain keys (`{ success: true, event }`), not unified `{ data }` wrapper.
2. **Match/score/session** — inline `JSON.stringify({ success: false, error: 'snake_case' })`.
3. **Extended shapes** — `session check`: `{ success, has_active_session, session }`; `score`: `{ success, action, match_id, new_state, effects }`.

Error codes mix snake_case (`event_not_found`) with raw Postgres messages (`matchplay-event/index.ts:162,204`).

#### RLS

All edge functions use `SUPABASE_SERVICE_ROLE_KEY`. Client uses anon key with direct table reads (`live_matches`, `matchplay_players`, `control_tokens` PIN in `lib/supabase.ts:113–119`). **RLS policies not in repo** — security depends on dashboard config.

#### Missing indexes (inferred hot paths)

| Query pattern | Suggested index |
|---------------|-----------------|
| `live_matches WHERE court_id = ? AND status IN (...)` | `(court_id, status, created_at DESC)` |
| `sessions WHERE court_id = ? AND status = 'active'` | `(court_id, status)` |
| `matchplay_matches WHERE event_id = ? AND status = 'completed'` | `(event_id, status)` |
| `matchplay_players ORDER BY total_points...` | `(event_id, total_points DESC, game_difference DESC)` |

#### Inefficient query patterns

- `recalculateStandings()` + per-player UPDATE loop (`matchplay-round/index.ts:370–387`) on every score entry.
- `list_rounds`: 2×N count queries per round (`matchplay-round/index.ts:606–616`).
- Client `loadRounds()` N+1: `list_rounds` + `get_round` per round.

---

### 2.6 Performance

#### Unnecessary re-renders

- **Polling always `setMatch(row)`** even when unchanged — `PlayingDisplay.tsx:390–394`, `useLiveMatch.ts:84,154–156`.
- **Inline callbacks in `.map()`** on hub match cards — `page.tsx:982–997`; `HubMatchCard` not memoized.
- **`MatchSetupForm`** passes new `onPhotoChange` lambdas each render to 4 `PlayerPhotoCapture` instances (`MatchSetupForm.tsx:172–177`).
- **Hub Realtime → full `loadRounds()`** on every match change — expensive N+1.

#### No code splitting

Zero uses of `next/dynamic`, `React.lazy`, or `React.memo`. Large client pages load entirely on first visit.

#### Global CSS on every route

`globals.css` imports ~3100 lines of `matchplay.css` plus `playing.css`, `court-display.css`, `spectator.css` on all routes including `/setup`.

#### Cache headers

`next.config.js:7–18` — `Cache-Control: no-store, must-revalidate` on `/:path*` disables static asset caching globally.

#### Dependencies

`vercel` and `ts-node` in `dependencies` (`package.json:35–37`) — should be `devDependencies`.

#### Polling redundancy

| Surface | Interval | Realtime? |
|---------|----------|-----------|
| `PlayingDisplay` | 2s (awaiting FLIC ack) / 5s (live) | Yes — justified |
| `useLiveMatch` (Spectator) | 5s default | Yes — likely redundant when channel healthy |
| `SetupDisplay` | Off | Yes — good |

PlayingDisplay poll uses `select('*')` (`PlayingDisplay.tsx:59–63`) instead of narrower `LIVE_MATCH_SCORE_SELECT`.

#### Image uploads

**Good:** Client-side crop/resize to 400×400 JPEG @ 0.8 (`PlayerPhotoCapture.tsx:14–47`).

**Issues:**

- Same `processImage` logic duplicated in `new/players/page.tsx` and `[id]/players/page.tsx`.
- Court setup uploads **immediately** on pick; matchplay defers to save — inconsistent.
- Sequential `await` uploads in save loops; could `Promise.all`.
- No `capture="environment"` on file inputs — mobile opens gallery, not camera-first.
- `.setup-photo-remove` is **22×22px** (`setup-form.css:711–716`).

---

### 2.7 Accessibility & Mobile UX

#### Touch targets

| Element | Size | File |
|---------|------|------|
| Token minimum | 44px | `tokens/components.css:45–46` |
| Hub quick-score cells | 44px min-height | `matchplay.css:2005–2007` ✓ |
| Score modal close | **32×32px** | `matchplay.css:1934–1939` ✗ |
| Photo remove (×) | **22×22px** | `setup-form.css:711–716` ✗ |

#### Modal accessibility

| Modal | Escape | Focus trap | `role="dialog"` |
|-------|--------|------------|-----------------|
| `MatchplayHubScoreModal` | Yes (`page.tsx:274–279`) | No | Yes |
| End event confirm | No | No | No |
| Edit match modal | No | No | No |
| Control end-match | No | No | No |
| `SessionProtectionPrompt` | No | No | No |

#### Color contrast

`--text-muted: #606068` on `--bg-secondary: #151A22` (`colors.css:53–55`) — likely borderline for small text at WCAG AA.

#### Safe area

Present on matchplay hub, setup, control, session prompt. **Missing:** `viewport-fit=cover` in root `app/layout.tsx:15–21` — iOS notch safe-area may not apply on full-bleed views.

#### Good a11y patterns

- Hub match cards: `role="button"`, `tabIndex={0}`, Enter/Space (`page.tsx:470–479`).
- `PlayerPhotoCapture`: `aria-label`s, decorative SVG `aria-hidden`.
- `SessionProtectionPrompt`: `role="alert"` on error.

---

### 2.8 Documentation

#### File inventory

| Doc | Status |
|-----|--------|
| `docs/ui-components.md` | Current — cards, buttons, `BoardStandings` |
| `docs/design-system-audit.md` | Mostly current (April 2026) |
| `docs/matchplay-design-alignment.md` | Roadmap / token migration checklist |
| `docs/matchplay-event-hub.md` | **Stale** — inline stepper score entry; code uses modal |
| `docs/matchplay-audit-report.md` | **Partially stale** — standings modal, no `components/matchplay/`, activity ticker |
| `docs/matchplay-board-audit-v2.md` | **Mixed** — some fixes landed (resting, flash), doc not fully updated |

#### Critical doc/code drift

`docs/matchplay-event-hub.md:79–92` states:

> "Score entry flow (**inline**, not modal)"  
> "There is **no** score modal."

Code at `app/matchplay/[id]/page.tsx:535,1032–1053` uses `scoreModalMatch` + `MatchplayHubScoreModal` bottom sheet with number pad. State table still lists `expandedMatchId` (doc line 55) — removed from code.

#### Onboarding gaps

- **No root `README.md`** — env vars, dev setup, Supabase deploy undocumented.
- Edge function contracts for `match`, `score`, `session` not documented (matchplay functions partially covered in `matchplay-audit-report.md` §3).
- FLIC acknowledge behavior only in code comments (`score/index.ts:383`, `PlayingDisplay.tsx:38`).
- Design-system routes (`/design-system`) serve as informal UI docs — good complement.

---

## 3. Quick Wins

Low effort, high value — can be done in single sessions:

1. **Update `docs/matchplay-event-hub.md`** — document `scoreModalMatch`, `MatchplayHubScoreModal`, number pad; remove `expandedMatchId` / stepper references.
2. **Add root `README.md`** — env vars (`NEXT_PUBLIC_SUPABASE_*`), `npm run dev`, edge function deploy, route map.
3. **Remove/gate debug logging** — `PlayingDisplay.tsx:293–300`.
4. **Fix setup brand color drift** — replace `#395FF9` / `#ec4899` with `var(--brand-primary)` / `var(--team-b)` in `setup-form.css`.
5. **Delete or stop importing dead CSS** — remove `playing.css` from `globals.css` (or delete file); delete unreferenced `session-review.css`; prune dead blocks in `matchplay.css` (steppers, `.matchplay-pill`, format setup).
6. **Extract shared utilities** — `isMatchEndgame()`, `brandingStylesFor()` → `lib/venue.ts`, `pregameModeLabel` → single export used by spectator + `MatchConfirmation`.
7. **Consistent error checks in matchplay hub** — check `result.success === false` before `result.event` in `loadEvent`, `handleStartEvent` (`page.tsx:557–561,713–726`).
8. **Bump undersized touch targets** — score modal close and photo remove to 44px minimum.
9. **Move `vercel` / `ts-node` to devDependencies** in `package.json`.
10. **Add medal tokens** — `--medal-gold`, `--medal-silver`, `--medal-bronze` in `colors.css`; replace duplicated hex in `matchplay.css` and `matchplay-board.css`.
11. **Diff before `setMatch` on poll** — shallow compare scores/status in `PlayingDisplay` and `useLiveMatch` to avoid pointless re-renders.
12. **Extract `callMatchplay*` helpers** to `lib/api/matchplay.ts` with consistent `response.ok` + `success === false` handling.

---

## 4. Larger Refactors

Items needing dedicated sessions with rough scope:

| Refactor | Scope | Complexity | Notes |
|----------|-------|------------|-------|
| **Baseline migration + RLS + indexes in repo** | Export current Supabase schema; add RLS policies; create indexes for hot paths | **Large** (1–2 days) | Prerequisite for safe onboarding and audits |
| **`useLiveMatch` migration** | Extend hook with normalize callback, adaptive polling, visibility refetch; migrate ControlPanel + PlayingDisplay first, CourtDisplay last | **Large** (2–3 days) | Spectator proves the pattern; CourtDisplay needs session channel + overlay side effects |
| **Split `matchplay/[id]/page.tsx`** | Extract hooks (`useMatchplayEvent`, `useMatchplayRounds`), presentational subcomponents, shared API module | **Large** (2 days) | Mirror spectator decomposition |
| **Unified bottom-sheet primitive** | Shared overlay/handle/safe-area/z-index for photo sheet, score sheet, event modal | **Medium** (1 day) | CSS + optional React wrapper |
| **Consolidate pill/segmented controls** | One component + CSS; migrate `setup-sets-pill`, `setup-mode-card`, `matchplay-pill-bar` | **Medium** (1 day) | Retire dead `.pill`, `.matchplay-pill` |
| **Americano pairing fixes + tests** | Fix odd-pair sit-outs, respect `courtLabels.length`, add unit tests, guard hub auto-gen by format | **Medium** (1 day) | Product decision needed on partner-coverage algorithm |
| **Edge function contract normalization** | Unified `{ success, data?, error? }`; shared `getActiveMatch()` helper; extract standings rank logic | **Medium** (1–2 days) | Coordinate client parsing updates |
| **Scoring engine single source** | Build step to sync `lib/scoring` → `_shared/scoring`, or shared npm package | **Medium** (0.5–1 day) | Prevent drift |
| **Route-scoped CSS imports** | Remove feature CSS from `globals.css`; import per layout (`matchplay`, `court`, staff) | **Medium** (1 day) | Reduces CSS payload on unrelated routes |
| **`CourtRouteProvider` + loading shell component** | Context for court/branding; `.page-loading-shell` CSS class | **Small–Medium** (0.5 day) | Removes 5× duplicated inline styles |
| **Modal a11y pass** | Focus trap, Escape, return focus, `role="dialog"` on all modals | **Medium** (1 day) | Consider shared `Modal` component |
| **Photo upload consolidation** | Shared `processImageToJpeg`, deferred upload pattern everywhere, `Promise.all` on save | **Small–Medium** (0.5 day) | |
| **Remove legacy routes** | Delete or wire up `teams/[id]`, `game/[id]`, `ScoreDisplay.tsx` | **Small** (2–4 hours) | Confirm with product first |
| **Hub Realtime optimization** | Patch single match in state vs full `loadRounds()` N+1 | **Medium** (1 day) | Big perf win during busy events |
| **Lazy-load heavy displays** | `next/dynamic` for CourtDisplay, matchplay hub, board | **Small–Medium** (0.5 day) | |

---

## 5. Things That Are Working Well

Preserve and extend these patterns:

1. **Central design tokens** — `app/styles/tokens/` with clear naming (`--ui-*` staff, `--display-*` TV, `--court-*` theming). Good documentation in token file headers.

2. **`useLiveMatch` hook design** — Combines fetch, Realtime, optional polling, and cleanup in one place (`lib/hooks/useLiveMatch.ts`). `SetupDisplay` correctly disables polling when Realtime suffices.

3. **Spectator architecture** — `SpectatorDisplay` as thin state router + focused subcomponents (`SpectatorIdle`, `SpectatorPregame`, `SpectatorLive`, `SpectatorEndgame`) is the template other displays should follow.

4. **`useCourtRoute`** — Single source for slug → courtId/branding resolution across catch-all routes.

5. **Shared match UI components** — `MatchConfirmation`, `MatchFinishedPanel`, `ControlMatchPreview`, `ControlScoreboard`, `ScoreSepBar` demonstrate effective cross-audience reuse without over-abstracting.

6. **`.btn` system** — `components/buttons.css` with BEM + legacy aliases; documented in design-system showcase.

7. **Adaptive FLIC polling** — `PlayingDisplay` 2s while awaiting court ack, 5s during live play, stops when not needed (`PlayingDisplay.tsx:381–398`). Pragmatic response to Realtime reliability gaps.

8. **`LIVE_MATCH_FULL_SELECT` / `LIVE_MATCH_SCORE_SELECT`** — Column alignment intent documented; use should expand to edge functions and inline queries.

9. **Design-system preview pattern** — Each display exports preview config types; `app/design-system/preview/*` consumes them without mocking Supabase. Excellent for visual regression and onboarding.

10. **Session review row reuse** — `.session-review-game-row` styling in `control-panel.css` reused by `MatchplayLauncherModePicker` with launcher overrides in `matchplay.css:49–99`. Good cross-feature UX consistency.

11. **Matchplay photo deferral** — Roster pages hold blobs in memory and batch upload on save (`players/page.tsx:209–232`) — better than immediate upload in court setup.

12. **Lean runtime stack** — Next 14 + React 18 + Supabase + qrcode.react only. No heavy UI kit bloat.

13. **Board improvements** — Extracted `BoardStandings`, resting players display, row flash animation (`components/matchplay/BoardStandings.tsx`).

14. **Scoring engine tests** — `lib/scoring/engine.test.ts` provides a foundation; extend to Americano pairings.

---

## Appendix: Key File Index

| Area | Paths |
|------|-------|
| Tokens | `app/styles/tokens/` |
| Shared CSS | `app/styles/components/{buttons,cards,layout,inputs,toggles}.css` |
| Feature CSS | `setup-form.css`, `control-panel.css`, `matchplay.css`, `matchplay-board.css`, `playing.css`, `spectator.css`, `court-display.css` |
| Displays | `components/displays/{ControlPanel,CourtDisplay,PlayingDisplay,SetupDisplay,spectator/*}.tsx` |
| Hooks | `lib/hooks/{useLiveMatch,useCourtRoute}.ts` |
| Live match | `lib/live-match-select.ts` |
| Americano | `lib/matchplay-americano-pairings.ts`, `lib/matchplay-americano-setup.ts` |
| Edge functions | `supabase/functions/{match,score,session,matchplay-*}/index.ts` |
| Migrations | `supabase/migrations/*.sql` (3 files) |
| Matchplay UI | `app/matchplay/[id]/page.tsx`, `board/page.tsx`, `new/players/page.tsx` |
| Docs | `docs/*.md` (6 files) |

---

*Review conducted 2026-06-19 against the full Next.js application, Supabase edge functions, and migrations present in the repository.*
