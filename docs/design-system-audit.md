# Design system & component consistency audit

**Scope:** PalaPoint V4 — tokens, shared CSS components, `components/` usage, and cross-feature duplication.  
**Generated:** April 2026 · Sources: `app/globals.css`, `app/styles/tokens/*`, `app/styles/components/*`, `app/design-system/**`, `components/**`, key feature CSS files.

---

## 1. Design system definition

### 1.1 Entry points & cascade

| Layer | Path | Role |
|-------|------|------|
| App shell | `app/globals.css` | Imports fonts → tokens bundle → global feature sheets (`court-display`, `playing`, `spectator`, `matchplay`) + reset/base |
| Token bundle | `app/styles/tokens/index.css` | Imports `colors`, `typography`, `spacing`, `components` (radii/shadows/z-index/containers) then `components/index.css` |
| Shared UI primitives | `app/styles/components/index.css` | Buttons, cards, inputs, toggles, layout helpers |
| Design system showcase | `app/design-system/layout.tsx` | Adds `control-panel.css` + `design-system.css` wrapper `.ds-layout` with token aliases |

**Note:** There is **no** root file literally named `globals.css` under `app/styles/` — the canonical root is **`app/globals.css`**.

### 1.2 `app/design-system/` — preview pages & content

| Route area | Purpose |
|------------|---------|
| **`/design-system`** | Hub linking Foundations, Components, Screens, Layouts, Match play previews |
| **`/design-system/tokens`** | Color/spacing/type samples (`ScreenDesignTokens` patterns + grids) |
| **`/design-system/colors`**, **`typography`** | Focused foundation pages |
| **`/design-system/components/*`** | `buttons`, `badges`, `cards`, `headers`, `photos`, `scores` — static showcases |
| **`/design-system/layouts`** | Page layout zones (`ds-layout-card`) |
| **`/design-system/screens/*`** | Thin wrappers embedding previews: spectator, court, player-mobile, setup, playing, matchplay |
| **`/design-system/preview/*`** | Stateful mocks: `control`, `court`, `matchplay`, `playing`, `setup`, `session-review`, `spectator` |

Supporting files: `ScreenPreview.tsx`, `ScreenDesignTokens.tsx`, `squareone-mock-branding.ts`, various `*-preview-config.ts` / `*-preview-states.ts`.

### 1.3 Existing documentation

Related feature audits:

- [Matchplay event hub](matchplay-event-hub.md)
- [Matchplay audit report](matchplay-audit-report.md)
- [Matchplay board audit v2](matchplay-board-audit-v2.md)

**There is no `DESIGN_SYSTEM_AUDIT.md`** prior to this file.

---

## 2. Token inventory

Tokens live under **`app/styles/tokens/`** unless noted.

### 2.1 Colors (`tokens/colors.css`)

**Brand:** `--brand-primary`, `--brand-primary-hover`, `--brand-primary-glow`, `--brand-secondary`

**Team:** `--team-a`, `--team-a-light`, `--team-a-dark`, `--team-a-bg`, `--team-a-glow`, `--team-b`, `--team-b-light`, `--team-b-dark`, `--team-b-bg`, `--team-b-glow`, `--team-a-color`, `--team-b-color` (aliases → `--team-a/b`)

**Surfaces:** `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-hover`, `--bg-active`

**Text:** `--text-primary`, `--text-secondary`, `--text-muted`, `--text-disabled`

**Borders:** `--border-default`, `--border-light`, `--border-focus` · Showcase-only alias on `.ds-layout`: **`--border-subtle`** → `var(--border-light)` (`app/styles/design-system.css`)

**Semantic:** `--success`, `--success-rgb`, `--success-dark`, `--success-bg`, `--error`, `--error-dark`, `--error-bg`, `--warning`, `--warning-dark`, `--warning-bg`, `--info`, `--info-dark`, `--info-bg`

**Overlays:** `--overlay-light`, `--overlay-medium`, `--overlay-dark`, `--overlay-darker`

**Court / VW displays:** `--court-bg`, `--court-accent`, `--court-ball`, `--court-ball-border`

### 2.2 Typography (`tokens/typography.css`)

**Family:** `--font-family` (Inter stack)

**UI sizes:** `--ui-font-xs` … `--ui-font-3xl`

**Display sizes (vw):** `--display-font-sm`, `--display-font-md`, `--display-font-lg`, `--display-font-xl`, `--display-font-2xl`

**Weights:** `--font-weight-normal` … `--font-weight-bold`

**Button label tokens:** `--btn-font-size`, `--btn-font-weight`, `--btn-letter-spacing`

**Line heights:** `--line-height-tight`, `--line-height-snug`, `--line-height-normal`

### 2.3 Spacing (`tokens/spacing.css`)

**UI:** `--ui-space-xs` … `--ui-space-3xl`

**Display:** `--display-space-sm` … `--display-space-xl`

### 2.4 Components / structural (`tokens/components.css`)

**Radii:** `--radius-sm` … `--radius-full`

**Shadows:** `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow-primary`, `--shadow-glow-team-a`, `--shadow-glow-team-b`

**Motion:** `--transition-fast`, `--transition-normal`, `--transition-slow`

**Z-index:** `--z-base` … `--z-toast`

**Touch:** `--touch-target-min`, `--touch-target-comfortable`

**Containers:** `--container-sm` … `--container-xl`

### 2.5 Fonts (`app/styles/fonts.css`)

Self-hosted **Inter** (variable) and **Space Grotesk** (500/700). Body defaults use **`--font-family`** (Inter); Space Grotesk is available for display/showcase (`design-system.css` `--font-display`).

### 2.6 Parallel / conflicting palettes

**`app/styles/setup-form.css`** defines **`.setup-screen`**-scoped variables (`--background`, `--foreground`, `--primary`, `--card`, `--border`, etc.) in **HSL / hex** that **overlap semantically** with global tokens but are **not wired to `:root` tokens**. Control panel partially bridges via `control-panel { --background: var(--bg-primary); … }`.

---

## 3. Shared CSS components (`app/styles/components/`)

| File | Main patterns |
|------|----------------|
| `buttons.css` | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-danger-fill`, `.btn-ghost`, `.btn-team-a`, `.btn-team-b`, `.btn-block`, `.btn-danger-outline`, disabled/hover |
| `cards.css` | `.card`, `.card-elevated`, `.card-title`, `.card-interactive`, `.card-result` (+ winner modifiers) |
| `inputs.css` | Shared field/input styling |
| `toggles.css` | Toggle UI |
| `layout.css` | Layout helpers |

**Gap:** `.matchplay-card`, `.matchplay-hub-*`, `.setup-*`, `.control-*`, `.board-*` etc. live in **feature CSS**, not under `components/`.

---

## 4. Component inventory (`components/`)

### 4.1 `components/ui/` (thin React wrappers)

| Component | Props (summary) | Used where |
|-----------|-----------------|------------|
| **`Header`** | `showLogo?`, `status?`, `statusText?`, `courtName?`, `branding?` | `PlayingDisplay`, `SetupDisplay` only |
| **`ScoreSepBar`** | `className?` | `CourtDisplay`, `ScoreDisplay`, overlays (`MatchWinOverlay`, `SetWinOverlay`), `ControlScoreboard`, `SessionReviewDisplay`, `MatchFinishedPanel`, `SpectatorEndgame`, etc. |
| **`PlayerPhotoCapture`** | `playerId`, `matchId`, `currentPhotoUrl?`, `onPhotoChange` | `MatchSetupForm` |

**Observations:** `Header` uses **inline styles** + `setup-logo-img` / `status-badge` classes — not token-driven layout. Only **two** flows use it.

### 4.2 `components/displays/` (full screens)

Large route-mounted UIs: `ControlPanel`, `CourtDisplay`, `PlayingDisplay`, `SetupDisplay`, `SessionReviewDisplay`, `SpectatorDisplay` (+ spectator sub-states), `ControlMatchPreview`.

### 4.3 `components/matchplay/`

**`CourtIcon.tsx`** — icon asset helper; not a layout system.

### 4.4 Other notable components

Overlays (`MatchWinOverlay`, `SetWinOverlay`, …), `MatchSetupForm`, `SetupScreenHeader`, `GradientWaveDrift`, shared `ControlScoreboard`, `MatchFinishedPanel`, `MatchConfirmation`, etc.

---

## 5. Page-specific CSS audit (patterns & tokens vs hardcoded)

### 5.1 `app/styles/matchplay.css`

- **Cards:** `.matchplay-card` (aligned with token surfaces + shadow), `.matchplay-event-card`, `.matchplay-mode-card`, `.matchplay-round-card`, `.matchplay-match-card`, hub `.matchplay-hub-match` + compact grid, modals.
- **Buttons:** `.matchplay-footer`, `.matchplay-btn-primary`, `.matchplay-hub-btn` / `--primary` / `--secondary` (hub score entry — **parallel to** `.btn` system).
- **Forms:** Uses `.setup-error`, `.input` from setup-form in places.
- **Mix:** Mostly **`var(--*)`**; hub compact still uses **literal px/rem** for grid tuning (e.g. score well `--hub-score-w`, typography `0.8125rem`, `1.375rem`).

### 5.2 `app/styles/setup-form.css`

- **Separate token universe** on `.setup-screen` (see §2.6).
- **Cards:** `.setup-mode-card` mirrors “selectable card” pattern (similar intent to `.card-interactive` / `.matchplay-mode-card`).
- **Hardcoded:** Various `#hex`, `hsl()`, fixed `rem` padding breakpoints (`28rem`, `40rem`, …) duplicated conceptually with **`control-panel`** / **`matchplay`** max-width ladders.

### 5.3 `app/styles/control-panel.css`

- Explicitly maps local aliases → **global tokens** for controller shell.
- **Cards:** `.control-scoreboard`, `.preview-card`, `.playing-finished-card`, `.session-review-games-card`.
- **Buttons:** Mix of `.btn` and bespoke control classes.
- Some **magic numbers** (e.g. scoreboard `padding-bottom: 30px`).

### 5.4 `app/styles/matchplay-board.css`

- TV/board layout: `.board-*`, `.board-players-card`, `.board-winner-card`.
- Uses tokens heavily; **vw/clamp** sizing appropriate for display context.

### 5.5 `app/styles/playing.css` & `spectator.css`

- Imported from **`globals.css`** — full-screen display layouts.
- Distinct **card** metaphors: e.g. spectator `.spectator-live-card`, playing-specific panels.
- Mix **`--display-*`** spacing/typography with feature-local classnames.

### 5.6 Other feature sheets (imported selectively)

| File | Typical patterns |
|------|------------------|
| `game-detail.css` | Uses shared `.card` / `.card-title` |
| `session-prompt.css` | Session guard overlay |
| **`session-review.css`** | Defines `.review-container`, `.review-header`, … — **not imported anywhere** (dead stylesheet); live session review UI uses **`control-panel.css`** |
| `court-display.css` | Large display; court tokens |
| `design-system.css` | Showcase-only; aliases `--font-primary`, `--space-*`, layout grids |

**Note:** There is no standalone `app/styles/setup.css`; setup flows use **`setup-form.css`**.

---

## 6. Duplication map & inconsistencies

### 6.1 Card/container naming (same idea, different classes)

| Pattern | Examples |
|---------|-----------|
| Generic shared | `.card`, `.card-elevated`, `.card-interactive`, `.card-result` |
| Matchplay flows | `.matchplay-card`, `.matchplay-hub-match.matchplay-card`, `.matchplay-event-card`, `.matchplay-mode-card`, `.matchplay-match-card` |
| Setup | `.setup-mode-card`, `.setup-section` blocks |
| Control | `.control-scoreboard`, `.preview-card`, `.playing-finished-card` |
| Board / spectator | `.board-players-card`, `.spectator-live-card` |

**Inconsistency:** `.matchplay-card` duplicates **surface treatment** of `.card` / `.card-elevated` (bg-secondary, border, radius-xl, shadow) with **different padding tokens** (`var(--ui-space-lg)` vs `.card`’s fixed `1.25rem`).

### 6.2 Button systems

| System | Where |
|--------|--------|
| Global `.btn` + variants | Setup/matchplay pages in many places |
| `.matchplay-btn-primary` | Matchplay launcher/footer flows |
| `.matchplay-hub-btn--primary|secondary` | Event hub expanded score actions |
| Raw `<button>` + utility | Various |

**Impact:** Typography (uppercase, letter-spacing) **mostly** shared via `--btn-*` on `.btn`, but **hub-specific buttons** reimplement sizing/colors in CSS.

### 6.3 Pill / segmented controls

- **`.matchplay-pill-bar`** + items — matchplay setup only.
- No shared `PillBar` React component; pattern not reused in control/setup via same API.

### 6.4 Headers / footers

- **`SetupScreenHeader`** component vs **`Header`** (logo/status) vs bespoke **`matchplay-hub-header`** vs board **`board-header`** — **four parallel header patterns**.

### 6.5 Forms & inputs

- Shared **`inputs.css`** + **`setup-form.css`** field classes (`.setup-input`, `.input`) — overlapping responsibilities.

### 6.6 Hardcoded vs tokens

- **`components/ui/Header.tsx`:** layout `paddingBottom: '40px'`, etc.
- **`app/globals.css`:** `.setup-logo-img` fixed **40px / 180px** bounds.
- **`setup-form.css`:** duplicate palette + scattered **raw hex** (`#ef4444`, `#151A22`, …) that often **match** tokens numerically but bypass **`var(--*)`**.
- **Feature CSS:** occasional **`px`** breakpoints and one-off shadows independent of `--shadow-*`.
- **`session-review.css`:** duplicate/alternate session-review shell (`.review-container`) — **unused import graph**; confuses where session-summary styling lives (**`control-panel.css`**).

---

## 7. Recommendations (prioritized)

| Priority | Action | Rationale |
|----------|--------|-----------|
| **P0** | **Collapse setup-screen palette into global tokens** (or explicit `theme.setup` layer that references `:root`) | Single source of truth; avoids drift between setup & matchplay/control |
| **P1** | **Unify card primitives:** extend `.card` variants OR formalize `matchplay-card` as `@extend`/shared mixin semantics documented in one place | `.matchplay-card` vs `.card` duplication |
| **P1** | **Replace `matchplay-hub-btn*` with `.btn` + size modifiers** (or one `Button` component) | Fewer button dialects; accessibility consolidated |
| **P2** | **Extract `<PillBar>` / `<SegmentedControl>`** from `.matchplay-pill-bar` | Reusable for future filters/toggles |
| **P2** | **Header abstraction:** single props-driven header using tokens (logo strip, optional status, actions slot) | Reduce `SetupScreenHeader` vs `Header` vs hub header divergence |
| **P2** | **Migrate `Header` inline styles → CSS classes** using `--ui-space-*` | Consistency + theming |
| **P3** | **React wrappers for DS primitives:** optional `Card`, `PageFooter`, `IconButton` aligned with `components/` + documented on `/design-system/components/cards` | Bridges TSX and CSS |
| **P3** | **Document CSS import map** (what globals pull vs route-level imports) in README or DS hub | Onboarding & audit hygiene |
| **P3** | **Remove or adopt `session-review.css`** | Eliminates dead stylesheet / naming collision with live `.session-review-*` classes |

### 7.1 Suggested extraction table

| Pattern | Appears in | Candidate shared artifact |
|---------|------------|---------------------------|
| Elevated card with label row | `matchplay-card`, DS previews | `Card` + `Card.Label` or CSS modifier on `.card` |
| Pill selector | `matchplay-pill-bar` | `<PillBar>` + tokens |
| Primary sticky footer CTA | `matchplay-footer`, hub footer | `<StickyFooter>` or `.footer-cta` utility |
| Score wells (compact fixture) | `matchplay-hub-match-score` | Optional `<FixtureScoreWell>` if reused on board/mobile |
| Mode picker tiles | `setup-mode-card`, `matchplay-mode-card` | Shared `.mode-tile` base |

---

## 8. Appendix — global CSS import graph (simplified)

```
app/globals.css
├── fonts.css
├── tokens/index.css → colors, typography, spacing, components (tokens)
│                    → components/index.css → buttons, cards, inputs, toggles, layout
├── score-separator.css
├── court-display.css
├── playing.css
├── spectator.css
└── matchplay.css (+ nested feature concerns)

Route/component-specific:
├── setup-form.css (setup, matchplay flows, control, MatchSetupForm, PlayerPhotoCapture, …)
├── control-panel.css (design-system layout, control, shared panels)
├── matchplay-board.css (board route + previews)
└── game-detail.css (game/[id])
```

---

*This audit is descriptive; implementation sequencing should be validated against product priorities and regression risk on TV + mobile layouts.*
