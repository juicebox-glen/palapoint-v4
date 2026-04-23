# Matchplay TV Board — V2 Audit

Audit of `app/matchplay/[id]/board/page.tsx` and `app/styles/matchplay-board.css` against **PalaPoint TV Board — Spectator Display UX Spec V2** (Studio Juicebox, April 2026). Spec source: `PalaPoint-TVBoard-UX-Spec-V2.docx` (machine-readable text extracted from document XML).

---

## Summary

| Feature | V2 Spec | Current Status | Action Needed |
|---------|---------|----------------|---------------|
| Results panel | NOT WANTED | **Partial violation:** No dedicated “last round results” panel, but a **cycling activity feed** (`board-activity-feed`) shows per-match results (“X beat Y …”) and advances every 6s | **Remove** feed or replace with non-results messaging (e.g. static “LIVE” strip only); aligns with “results deliberately excluded” |
| Auto-rotation | NOT WANTED | **Violation:** `setInterval` every **6s** cycles `activityFeedIndex` through feed items | **Remove** rotation; 30s title keep-alive is fine (not UI rotation) |
| Fixtures always shown | Required | **Met** for `in_progress`: main area is always fixture list for `currentRound` | Keep; ensure `currentRound` always matches staff “active” round (data contract) |
| Resting player display | Required | **Missing** — no “Resting this round: …” | **Add** from round/match data (needs API or derived list of non-playing players) |
| Idle state (no event) | Required | **Missing** on this route — board is always `/matchplay/[id]/board`; missing/invalid id shows error, not venue idle | **New route or redirect:** venue logo + “Next event coming soon” when no active board target |
| Score flash animation | Required | **Missing** — no row highlight on standings update | **Add** CSS animation + React state when `standings` changes after realtime |
| Tied row highlighting | Required | **Partial:** `groupStandings` + `board-tie-cont` rank styling; **no** shared row background tint | **Add** subtle background on all rows in a tie group |
| P column brand highlight | Required | **Wrong column styled:** `Pts` uses brand emphasis; **P** (matches played) is generic `.board-th-num` | **Restyle** header so **P** (points) uses brand per spec; align column set with spec (# / Player / P / +/-) |
| Standings columns (in play) | # / Player / P / +/- | **Different:** #, Player, P, W, D, L, GD, Pts | **Simplify** in-play table to spec or document intentional extras |
| Resting row in standings (·, 0 pts, muted) | Required | **Missing** | **Add** when odd count / bye data available |
| Empty standings (pre-start) | “Standings will appear after Round 1” | **N/A in UI** — pre-start is not two-panel | **Restructure** setup state (see Pre-Start) |
| Panel layout (fixtures vs standings) | ~65% main **fixtures**, ~35% **standings** right | **Reversed:** `.board-leaderboard` is **first** (left ~60%), `.board-fixtures` **second** (right) | **Swap** order and/or flex so fixtures are dominant left, standings right |
| Round advance cross-fade | 300ms | **Missing** | **Add** on `currentRound` / matches key change |
| State transition fade | 500ms | **Missing** between setup / live / completed | **Add** optional wrapper transition |
| Position arrows (↑↓, 10s) | Optional | **Missing** | Optional backlog |
| Winner reveal (80% → 100%) | Optional | **Partial:** podium uses scale **0.95→1**, not 0.8 | Tune if matching spec literally |
| Typography minima (48px name, etc.) | Required | **Below spec:** headers use `clamp` with **max ~32px** event title on live header | **Raise** floors/mins for TV legibility at 3–5m |
| Persistent shell (venue logo, footer credit) | Required | **Partial:** “PalaPoint” only on **setup**; live header has no venue logo; footer lacks explicit **PalaPoint** credit right | **Add** header logo slot + footer layout per spec |
| Final: full screen, no split | Required | **Met** — `board-completed` uses `board-main-single` | Keep |
| Final: FINAL in header | Required | **Met** — `board-badge-final` | Keep |
| Final: podium + full table | Required | **Mostly met** — podium + wide table; spec shows **+/-** column vs our **GD** + separate points | Align naming/columns with spec if strict |

---

## State-by-State Review

### Idle

**V2:** When no active event — venue logo centred, “Next event coming soon”, dark theme; exit when staff creates/starts an event.

**Current:** No idle branch in `board/page.tsx`. The page requires `eventId`; `error || !event` renders `board-error` text only (e.g. “Event not found”). No venue branding, no “coming soon” copy.

**Gap:** **Critical** — idle is a separate product/route concern unless `/matchplay/[id]/board` is never used without a valid live event.

---

### Pre-Start (V2 “State 1”: `status: setup`)

**V2:** Two-column shell — **ROUND 1 FIXTURES** in main, court cards + vs + resting line; **Standings** panel with empty message *“Standings will appear after Round 1”*; no timer.

**Current (`isSetup`):** Full-screen **centred** layout: “PalaPoint”, event name, date, “STARTING SOON”, **player grid** only. **No** fixtures, **no** standings column, **no** round 1 heading, **no** empty-standings message.

**Gap:** **Major** — pre-start does not match V2 layout or content. Player list is extra vs spec (spec focuses on round 1 assignments).

---

### In Play (`status: in_progress`)

**V2:** Fixtures always in main (~65%); standings always visible (~35%); no results panel, no rotation; **ROUND N FIXTURES** heading; court cards; resting line; standings # / Player / P / +/- with P header brand, ties tinted, resting row at bottom, score flash on update.

**Current:**

- **Layout:** Leaderboard **left**, fixtures **right** — **opposite** of V2 diagram.
- **Heading:** Panel title is `ROUND {roundNum}` — missing **“FIXTURES”**.
- **Fixtures:** Court label, team A/B, “vs”, scores when completed, in-progress status — **generally good** for “where do I go”.
- **Standings:** Full W/D/L/GD/Pts table; **no** +/--only simplification; **no** P-header brand highlight as specified; **no** flash; **no** resting row; tie handling is rank-column only.
- **Results / rotation:** **Activity feed** at bottom cycles recent match **results** every 6s — conflicts with V2 “no results” and “no auto-rotation”.

**Gap:** **Must** swap panels, remove/replace feed, add resting + flash + column/branding alignment.

---

### Final Results (`status: completed`)

**V2:** Full screen (no split); header **FINAL**; winner very large + trophy; podium 1st centred, 2nd/3rd flanking; full W/T/L/P/+/- table.

**Current:**

- Full-width **single** column — **good**.
- Header with event name + **FINAL** badge — **good**.
- Trophy + winner card + podium (2nd / 1st / 3rd DOM order with flex `align-items: flex-end`) — **largely aligned** with podium intent.
- Table includes W, D, L, GD, Pts — **close** to spec; “+/-” is represented as GD in spirit but not labelled per spec.
- Winner typography uses `clamp(1.5rem, 4vh, 3rem)` — **below** spec **72px** minimum for winner name at TV distance.

**Gap:** Typography scale; optional column header rename (+/-); winner scale-in from **80%** not implemented (currently 0.95).

---

## Animations

| Animation | V2 | Current |
|-----------|----|--------|
| Standings row flash on score confirm | Required | **Not implemented** |
| Round advance main panel cross-fade | 300ms | **Not implemented** |
| State transition full-screen fade | 500ms | **Not implemented** |
| Position arrows 10s | Optional | **Not implemented** |
| Winner reveal scale 80% → 100% | Optional one-time | **Partial:** podium `board-podium-scale` 0.95→1; fade-in on section |
| Pulse dots (LIVE / in progress) | Not in V2 table | **Present** (`board-pulse`) — acceptable if not distracting |

---

## Typography (spec minimums vs CSS)

Spec (minimums for 3–5m viewing):

- Event name header: **48px bold**
- Round indicator: **32px regular**
- Court label: **28px bold**
- Fixture player names: **34px regular**
- Standings position: **32px bold**; player name **28px**; P **28px bold**; +/- **24px**
- Winner name (final): **72px bold**
- Podium 2nd/3rd: **40px bold**
- Footer: **20px regular** muted

**Current (representative):**

- `.board-header-title`: `clamp(1.2rem, 2.5vh, 2rem)` → **max ~32px** — under 48px.
- `.board-round-indicator`: max ~22.4px — under 32px.
- `.board-fixture-team`: max ~24px — under 34px.
- `.board-standings` body: max ~19.2px — under 28px for names.
- `.board-winner-name`: max ~48px — under 72px.

**Gap:** **Should fix** — introduce TV-oriented `min()`/`max()` or `clamp` **floors** so minima meet spec on 1080p bar displays.

---

## Recommended Actions

### Must fix

1. **Remove** the 6-second **activity feed rotation** and the **results-style feed** (or reduce to non-scrolling, non-results info only).
2. **Swap** live layout so **fixtures ≈65% left**, **standings ≈35% right** (persistent shell per V2).
3. **Rebuild Pre-Start** to two-panel shell: Round **1** fixtures + empty standings message; drop full-screen-only player grid **or** demote it below fixtures if still wanted.
4. **Implement Idle** path (new board entry without event, or venue default) with logo + “Next event coming soon”.

### Should fix

5. **Standings:** In-play columns and labels to match V2 (**# / Player / P / +/-**); **brand highlight on P (points)** header; **row flash** on realtime standings change; **tied-row background** tint.
6. **Resting:** “Resting this round: …” under fixtures; **·** resting row in standings (0 pts, muted) — requires reliable data for who sits out.
7. **Fixtures heading:** `ROUND N FIXTURES` (not `ROUND N` alone).
8. **Typography:** Raise minimum font sizes toward V2 table (especially event name, fixture names, winner).
9. **Header/footer shell:** Venue logo top-left, event name centre, round top-right; footer left format string + **right PalaPoint credit** (muted).

### Nice to have

10. **300ms** cross-fade when round fixtures change; **500ms** fade on state changes.
11. **Position arrows** (↑↓) for 10s after standings update.
12. **Winner** scale-in from **80%** once on final state load.

---

## File references (quick)

| Concern | Location |
|---------|----------|
| Feed + 6s rotation | `page.tsx` ~355–362, 635–639 |
| 30s keep-alive (OK) | `page.tsx` ~324–332 |
| Setup vs live vs completed | `page.tsx` ~387–535, 537–646 |
| Panel order | `page.tsx` ~554–632; `.board-leaderboard` / `.board-fixtures` in `matchplay-board.css` ~117–126 |
| Standings table (live + final) | `page.tsx` ~494–525, 557–588 |
| Podium animations | `matchplay-board.css` ~537–565 |

---

## Spec attachment note

Detailed copy and ASCII diagrams were cross-checked against text extracted from `PalaPoint-TVBoard-UX-Spec-V2.docx`. If the Word doc is updated after this audit, re-run comparison against the new revision.
