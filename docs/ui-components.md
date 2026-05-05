# UI components (CSS)

Shared primitives live in **`app/styles/components/`**, loaded globally via `app/styles/tokens/index.css`.

## Cards

Base class: **`.card`** (`cards.css`).

| Modifier | Purpose |
|----------|---------|
| `.card--elevated` | Adds `--shadow-md` (stack with `.card`). |
| `.card--interactive` | Pointer cursor; hover highlights border with `--brand-primary`. |
| `.card--selected` | Active / chosen state (brand fill). |
| `.card--completed` | Green left border (`--success`). Hub fixtures also use `.matchplay-hub-match--completed`. |
| `.card--expanded` | Brand border; hub uses `.matchplay-hub-match--expanded`. |
| `.card--padding-sm` | `padding: var(--ui-space-md)` |
| `.card--padding-md` | `padding: var(--ui-space-lg)` |
| `.card--padding-lg` | `padding: var(--ui-space-xl)` |

Inside cards:

- **`.card__label`** — uppercase section label (legacy **`.card-title`** is equivalent).
- **`.card__hint`** — muted helper text.

### Backwards-compatible aliases

| Class | Notes |
|-------|--------|
| `.card-elevated` | Standalone “card + shadow” (same idea as `.card.card--elevated`). |
| `.card-interactive` | Compact radius/padding; `.active` matches selected state. |
| `.matchplay-card` | Matchplay setup summary blocks (= `.card` + elevation). |
| `.preview-card` | Control / session-review matchup shell (`--radius-lg`, preview padding). |

Prefer **`card + modifiers`** in new markup; aliases remain for existing routes.

## Buttons

Base class: **`.btn`** (`buttons.css`). Always pair variants with **`.btn`** (except **`.matchplay-btn-primary`**, which is a full-width alias for older matchplay CTAs).

| Modifier | Purpose |
|----------|---------|
| `.btn--primary` | Main action (legacy **`.btn-primary`**). |
| `.btn--secondary` | Secondary action (legacy **`.btn-secondary`**). |
| `.btn--danger` | Destructive outline (legacy **`.btn-danger`**). |
| `.btn--ghost` | Minimal (legacy **`.btn-ghost`**). |
| `.btn--full` | Full width (legacy **`.btn-block`**). |
| `.btn--sm` / `.btn--lg` | Size (legacy **`.btn-sm`** / **`.btn-lg`**). |

Additional variants (unchanged): **`.btn-danger-fill`**, **`.btn-team-a`**, **`.btn-team-b`**.

### Matchplay

- **`.matchplay-btn-primary`** — full-width primary CTA; prefer **`btn btn--primary btn--full`** for new code.
- Hub score actions use **`btn btn--secondary btn--full`** / **`btn btn--primary btn--full`**; typography tweaks live under **`.matchplay-hub-match-entry-actions .btn`** and **`.matchplay-hub-footer .btn`** in `matchplay.css`.

## Setup screen tokens

**`.setup-screen`** maps local aliases (`--background`, `--primary`, `--card`, …) to global `:root` tokens in **`setup-form.css`** so setup UI stays theme-consistent.

## Matchplay TV board standings

- **Component:** [`components/matchplay/BoardStandings.tsx`](../components/matchplay/BoardStandings.tsx) — podium-style rows, medals for ranks 1–3, optional resting rows (live), hero variant with W-D-L line (completed).
- **Styles:** **`board-standings-root`** and related classes in **`app/styles/matchplay-board.css`**.
- **Design-system previews:** [`app/design-system/preview/matchplay/MatchplayPreviewStates.tsx`](../app/design-system/preview/matchplay/MatchplayPreviewStates.tsx) uses **`BoardStandings`** for `board_setup`, `board_live`, and `board_completed` so mocks stay aligned with [`app/matchplay/[id]/board/page.tsx`](../app/matchplay/[id]/board/page.tsx). Mock rows live at **`DS_BOARD_*`** constants in that file — update them when changing production mock data or layout.

Legacy **`board-standings-table`** rules remain in **`matchplay-board.css`** only for any stray HTML tables; prefer **`BoardStandings`** for new work.
