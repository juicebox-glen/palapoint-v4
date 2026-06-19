# PalaPoint V4

Next.js app for live padel court scoring, player setup, staff control, spectator TV, and matchplay events.

## Prerequisites

- Node.js 18+
- A Supabase project with edge functions deployed

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: default venue for matchplay when not inferred from DB
NEXT_PUBLIC_MATCHPLAY_VENUE_ID=
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test
```

Runs scoring engine and name-format unit tests.

## Routes

| Route | Audience | Purpose |
|-------|----------|---------|
| `/control/{company}/{venue}/{court}` | Staff | Score, setup, end match |
| `/setup/{...}` | Player | Session + match setup on phone |
| `/playing/{...}` | Player | Live match view + rematch |
| `/court/{...}` | Court display | FLIC buttons, overlays, QR idle |
| `/live/{...}` | Spectator TV | Read-only match view |
| `/matchplay` | Staff | Event launcher and hub |
| `/session-review/{id}` | Player | Post-session game summary |

Design system previews: `/design-system`.

## Supabase edge functions

Deploy from this repo:

```bash
supabase functions deploy match
supabase functions deploy score
supabase functions deploy session
supabase functions deploy matchplay-event
supabase functions deploy matchplay-player
supabase functions deploy matchplay-round
```

Matchplay API helpers live in [`lib/api/matchplay.ts`](lib/api/matchplay.ts). Function action tables are documented in [`docs/matchplay-audit-report.md`](docs/matchplay-audit-report.md).

## Documentation

- [`docs/ui-components.md`](docs/ui-components.md) — shared UI patterns
- [`docs/matchplay-event-hub.md`](docs/matchplay-event-hub.md) — event hub behaviour
- [`docs/full-codebase-review-2026-06-19.md`](docs/full-codebase-review-2026-06-19.md) — codebase audit
