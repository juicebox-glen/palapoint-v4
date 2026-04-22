# Matchplay CSS — design token alignment report

**Repo:** PalaPoint V4  
**Scope:** `app/styles/matchplay.css` (~1,939 lines), `app/styles/matchplay-board.css` (~610 lines), and inline styles on matchplay pages.  
**Token sources:** `app/styles/tokens/colors.css`, `spacing.css`, `typography.css`, `components.css` (via `tokens/index.css` + `components/index.css`).

---

## 1. Executive summary

| Area | `matchplay.css` (staff UI) | `matchplay-board.css` (TV board) |
|------|---------------------------|----------------------------------|
| **Colors** | **Mixed:** large areas already use `--bg-*`, `--text-*`, `--border-*`, `--brand-*`, `--error`. Remaining issues are **semantic/status hex** (`#22C55E`, `#F59E0B`, `#fff`, yellow/amber text) that map cleanly to `--success`, `--warning`, `--text-primary`, and **token bg variants** (`--success-bg`, `--warning-bg`, `--overlay-dark`). | **Mostly hardcoded hex** that **duplicate `colors.css` values** (e.g. `#0E1116` = `--bg-primary`, `#151A22` = `--bg-secondary`, `#2A3140` = `--border-default` / `--bg-tertiary`, `#FFFFFF` / `#A0A0A8` / `#606068` = text tokens, `#22C55E` = `--success`). |
| **Spacing** | Uses **literal `rem`** (`1rem`, `0.5rem`, …) not `--ui-space-*`. Acceptable but inconsistent with newer screens that use tokens. | Uses **`clamp()` + `vh`/`vw`** (appropriate for TV); few opportunities for `--display-space-*` without harming scale. |
| **Typography** | Uses **literal `rem` font sizes**; tokens provide `--ui-font-xs` … `--ui-font-3xl` for alignment. | Same; board correctly uses `clamp()` for TV — optionally reference `--display-font-*` where scale fits. |
| **Radius** | **Good:** widespread `var(--radius-md|lg|xl)`. | **Custom** `clamp(8px, …)` — can align to `var(--radius-lg)` / `var(--radius-xl)` where max matches design intent. |
| **Components** | Some actions already use **`.btn` + variants** in TSX; CSS still defines **parallel button/stepper** classes (`.matchplay-stepper-btn`, `.matchplay-event-footer-btn`, …). | N/A (mostly layout). |

**Estimated scope:** ~**80–150** token substitutions in `matchplay-board.css`; ~**40–80** color/semantic fixes + optional spacing/type pass in `matchplay.css`; **~10** TSX edits to remove inline styles. **Low risk** if done file-by-file with visual QA on launcher, event hub, and board (three states).

**Recommended order:** (1) `matchplay-board.css` — pure CSS, high visual win, maps 1:1 to existing color tokens. (2) `matchplay.css` — replace remaining hex/rgba with semantic tokens. (3) TSX — move inline styles to utility classes. (4) Optional refactor — adopt `.btn` / shared stepper patterns where duplicate CSS is obvious.

---

## 2. Task 1 — Audit by file

### 2.1 `matchplay.css` (staff)

- **Colors:** Majority of surfaces use `var(--bg-primary|secondary|tertiary)`, `var(--text-primary|secondary|muted)`, `var(--border-default)`, `var(--brand-primary|hover)`, `var(--error)`. **Exceptions (grep):** `#fff` on active cards (use `var(--text-primary)`), `#22C55E` / `#F59E0B` / `#facc15` / `#a1a1aa` / `#b45309` and several `rgba(...)` badge/row backgrounds (map to `--success`, `--warning`, `--text-muted`, `--warning-dark`, `--success-bg`, `--warning-bg`, `--overlay-dark`, `--team-a-bg` where appropriate).
- **Spacing:** Padding/gap mostly `0.25rem`–`2rem` literals. Token file exposes **`--ui-space-xs`** … **`--ui-space-3xl`** — no `--space-md` name in this repo.
- **Typography:** `font-family: var(--font-family)` ✓. Sizes like `0.6875rem`, `0.875rem`, `1.25rem`, `1.75rem` → align to **`--ui-font-xs`**, **`--ui-font-sm`**, **`--ui-font-xl`**, or keep one step off-token with a comment if design requires exact px.
- **Radius:** Heavy use of **`var(--radius-sm|md|lg|xl|full)`** ✓.
- **Duplication:** Stepper / pill patterns overlap conceptually with **`control-panel.css`** / **`.btn`** / **`.input`** from `components/buttons.css` & forms — not identical selectors; consolidation is a larger refactor.

### 2.2 `matchplay-board.css` (TV)

- **Colors:** Root `.board-container` and most sections use **raw hex** that match token definitions exactly — safe mechanical replace. **Podium / medals** use gold/silver/bronze (`#FFD700`, `#C0C0C0`, `#CD7F32`, gradients) — **no named tokens** today; either **keep as “board-only” exceptions** or add optional tokens (e.g. `--podium-gold`) in `colors.css` if reused elsewhere.
- **Spacing:** TV-appropriate `clamp` + vh; optional sprinkle of **`--display-space-sm|md|...`** only where it does not fight `clamp`.
- **Typography:** `clamp(...rem, vh, ...)` — optional tie-in **`--display-font-sm|md|...`** for mid-range values; verify legibility on 1080p.
- **Radius:** Replace `clamp(8px, 1.5vh, 12px)`-style with **`var(--radius-lg)`** / **`var(--radius-xl)`** if the clamp was only approximating 8–12px.
- **Duplication:** Standings table styling parallels **`.matchplay-standings`** / control patterns but uses **`board-*`** classes — acceptable to keep layout-specific.

---

## 3. Task 2 — Available tokens (reference)

### From `tokens/colors.css`

| Token | Value (approx.) | Use for board / matchplay |
|-------|-----------------|---------------------------|
| `--bg-primary` | `#0E1116` | Board root bg |
| `--bg-secondary` | `#151A22` | Headers, cards |
| `--bg-tertiary` | `#2A3140` | Borders / inactive |
| `--text-primary` | `#FFFFFF` | Primary text on dark |
| `--text-secondary` | `#A0A0A8` | Secondary labels |
| `--text-muted` | `#606068` | Tertiary / disabled feel |
| `--border-default` | `#2A3140` | 1px borders |
| `--success` / `--success-bg` | green + rgba | Live dot, wins |
| `--warning` / `--warning-bg` | amber + rgba | Warnings (if used) |
| `--overlay-dark` / `--overlay-darker` | black alpha | Scrim-style overlays |
| `--brand-primary` | blue | Accents already in board header path |

### From `tokens/spacing.css`

- `--ui-space-xs` … `--ui-space-3xl` — staff UI padding/gap.
- `--display-space-sm` … `--display-space-xl` — vw-based display screens (optional on board).

### From `tokens/typography.css`

- `--ui-font-xs` … `--ui-font-3xl`, `--font-weight-*`, `--line-height-*`, `--btn-font-size`, etc.

### From `tokens/components.css`

- `--radius-sm` … `--radius-full`, `--shadow-*`, `--transition-*`, `--z-*`, `--touch-target-min` (44px) / `--touch-target-comfortable` (48px).

**Note:** There is **no** `--space-md` in this codebase; use **`--ui-space-md`** (0.75rem) or named rem in tables below.

---

## 4. Task 3 — Replacement tables

### 4.1 Colors to replace (`matchplay-board.css` priority)

| Current (approx.) | Should be |
|-------------------|-----------|
| `#0E1116` | `var(--bg-primary)` |
| `#FFFFFF` | `var(--text-primary)` |
| `#151A22` | `var(--bg-secondary)` |
| `#2A3140` (border/bg) | `var(--border-default)` or `var(--bg-tertiary)` by context |
| `#A0A0A8` | `var(--text-secondary)` |
| `#606068` | `var(--text-muted)` |
| `#22C55E` | `var(--success)` |
| `#1a1a1a` (on gradient text) | `var(--bg-primary)` or high-contrast token if contrast passes |
| `rgba(255, 215, 0, 0.1)` / `0.3` | Consider `color-mix` with `--warning` or new `--podium-gold-bg` token |
| Gold/silver/bronze gradients | **Keep** or add **`--podium-*`** tokens in `colors.css` if product wants them global |

### 4.1b Colors to replace (`matchplay.css` remainder)

| Current | Should be |
|---------|-----------|
| `#fff` | `var(--text-primary)` |
| `#22C55E` / `rgba(34, 197, 94, 0.25)` | `var(--success)` / `var(--success-bg)` |
| `#F59E0B` / `#facc15` / `rgba(245, 158, 11, 0.25)` | `var(--warning)` / `var(--warning-bg)` / text on dark |
| `#a1a1aa` | `var(--text-secondary)` or `var(--text-muted)` |
| `#b45309` | `var(--warning-dark)` |
| `rgba(91, 108, 255, 0.15)` | `var(--team-a-bg)` or `var(--info-bg)` by meaning |
| `rgba(0, 0, 0, 0.6)` | `var(--overlay-dark)` (or slightly custom if 0.6 vs 0.5) |

### 4.2 Spacing to replace (incremental)

| Current | Should be (optional pass) |
|---------|----------------------------|
| `padding: 1rem` (repeated patterns) | `padding: var(--ui-space-lg)` (1rem) |
| `gap: 0.5rem` | `gap: var(--ui-space-sm)` |
| `margin-bottom: 1.5rem` | `margin-bottom: var(--ui-space-xl)` |
| `min-height: 44px` / `48px` | Consider `min-height: var(--touch-target-min)` / `var(--touch-target-comfortable)` |

Board file: prefer **keeping `clamp`+vh** for TV; only replace obvious `rem` gaps with `--ui-space-*` where values match exactly.

### 4.3 Typography to replace (incremental)

| Current | Should be |
|---------|-----------|
| `font-size: 0.875rem` | `font-size: var(--ui-font-sm)` |
| `font-size: 0.75rem` / `0.6875rem` | `var(--ui-font-xs)` (closest) |
| `font-size: 1.25rem` | `var(--ui-font-xl)` |
| `font-size: 1.75rem` | `var(--ui-font-3xl)` is 2rem — use token or `clamp` if 1.75rem is intentional |
| `font-weight: 600` | `var(--font-weight-semibold)` |

### 4.4 Components to reuse (opportunistic)

| Custom pattern | Existing / direction |
|----------------|----------------------|
| Primary CTAs already using `.btn.btn-primary` in TSX | Keep; trim duplicate `.matchplay-*-btn` rules that only restate button look |
| `.matchplay-stepper-btn` / `.matchplay-event-stepper-btn` | Long-term: shared **stepper** partial or align colors only to `--bg-tertiary` / `--border-default` / `--touch-target-min` |
| Cards (`.matchplay-active-event-card`, modals) | Already close to **card** token usage; could add shared **`.ds-card`** only if design system defines one used elsewhere |
| Format pills | Unique to matchplay; **keep** classes, align colors to tokens only |

### 4.5 Unique styles to keep

- **Round tabs** (`.matchplay-event-round-tab*`) — layout + state machine specific.
- **Event match cards** expanded/collapsed — layout-specific.
- **Standings table** column layout (`.matchplay-standings`, `.board-standings`) — domain-specific.
- **Board:** podium geometry, `board-pulse` animation, split main columns, activity ticker — **layout/TV-specific**.
- **Medal gradients** — decorative; keep in `matchplay-board.css` unless promoted to tokens.

---

## 5. Task 4 — Inline styles on matchplay pages

| File | Line(s) (approx.) | Inline style | Suggested class / approach |
|------|-------------------|--------------|----------------------------|
| `app/matchplay/page.tsx` | ~192 | `color: var(--text-secondary)` on loading | `.matchplay-loading-text` or reuse global `.control-loading` pattern |
| `app/matchplay/new/page.tsx` | ~133, ~166 | loading color; `marginBottom: 0.5rem` on hint | Utility class `mt-0` / `mb-sm` using `--ui-space-sm` |
| `app/matchplay/new/players/page.tsx` | ~148, ~201 | loading color; error `marginTop` | Same |
| `app/matchplay/[id]/page.tsx` | ~592–601, ~1031, ~1105, ~1182 | loading, error, link margin, `overflowX`, flex gap | `.matchplay-table-scroll`, `.matchplay-modal-actions`, `.matchplay-stack` with token gap |
| `app/matchplay/[id]/board/page.tsx` | — | **None** (`style={{` not found) | ✓ |

---

## 6. Scope estimate

| Deliverable | Approx. touches |
|-------------|-----------------|
| `matchplay-board.css` hex → tokens | **~45–60** declarations |
| `matchplay.css` hex/rgba → tokens | **~25–35** declarations |
| Spacing/type token pass (either file) | **~30–120** optional line edits |
| TSX inline → classes | **~8–12** lines across 4 files |
| New small utility classes | **~5–15** rules in `matchplay.css` or `components` |

**Files touched:** 2 CSS (+ optional `colors.css` for podium), 4 TSX pages.

---

## 7. Recommended order of work

1. **`matchplay-board.css`** — Replace hardcoded palette with `var(--bg-*)`, `var(--text-*)`, `var(--border-default)`, `var(--success)`, etc. QA on `/matchplay/[id]/board` (setup / live / completed).
2. **`matchplay.css`** — Clear remaining hex/rgba semantic colors; align overlays to `--overlay-*`.
3. **Typography pass (optional)** — Map common `rem` font sizes to `--ui-font-*` in launcher + event hub.
4. **Spacing pass (optional)** — Replace repeated `1rem`/`0.5rem` with `--ui-space-*` where exact match.
5. **TSX** — Remove inline styles per §5.
6. **Refactor (later)** — Extract shared stepper / primary button styles to reduce drift from `buttons.css`.

---

## 8. Risk & testing checklist

- [ ] Launcher: active vs coming-soon cards (contrast on `--brand-primary` + `--text-primary`).
- [ ] Format + players: pills, footers, errors (`--error`).
- [ ] Event hub: round tabs, expanded score entry, modals, standings table.
- [ ] Board: live badge pulse, standings legibility, completed podium + final table.
- [ ] Zoom browser to ~375px width for staff routes; 1920×1080 (or design-system TV preview) for board.

---

## 9. Outcome

This report is the roadmap to **token-align matchplay** without changing behavior: **mechanical color mapping first** (especially `matchplay-board.css`), then **semantic cleanup** in `matchplay.css`, then **inline style removal**, with **layout- and podium-specific CSS** intentionally retained unless product adds new global tokens.

**Saved as:** `docs/matchplay-design-alignment.md`
