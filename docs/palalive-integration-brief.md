# PalaLive — Integration Brief

## What We're Integrating

PalaLive is a venue display OS for padel clubs. It runs on a Fire TV Stick via Silk Browser, permanently on in a clubhouse, viewed from 3-5 metres. Three screen states — Idle, Social Night, Showcase — share the same grid and visual system. The front-end design is built. Now we're connecting it to real data.

---

## The Tech Stack

- **Next.js** (existing V4 repo)
- **Supabase** — database, Edge Functions, Realtime subscriptions
- **Vercel** — deployment
- **Supabase Realtime** — how the display updates without polling
- **Playtomic API** — third-party court booking data (future, but architecture should accommodate it)

---

## The Three States and Their Data Needs

### State 1 — Idle

**Left panel**: Video player (self-hosted MP4 clips, looped playlist). No database dependency — just a static video source config per venue.

**Right panel**: Court Bookings
- Shows next booking per court (time + booking name + session type)
- Current court state (in use / available) as secondary
- Data source: **Playtomic API** (not yet integrated — needs illustrative/mock data for now)
- Architecture must accommodate real Playtomic data dropping in later
- Playtomic third-party API endpoint: `https://thirdparty.playtomic.io/api/v1/bookings`
- Auth: Bearer token (Client ID + Client Secret from venue's Playtomic Manager → Settings → Developer Tools)
- Returns: `booking_id`, `resource_name` (court name), `booking_start_date`, `booking_end_date`, `booking_type`, `participant_info.participants[0].name`

**Moment Layer** (bottom-left, rotating):
- Next event — needs an `events` table or similar (may already exist in V4 as part of Social Night setup)
- Sponsor content — needs a `sponsors` table with venue_id, name, message, logo_url
- Recent result — can pull from existing match/event results

**Fixed Layer**: venue logo, clock, weather. Weather needs a weather API call (OpenWeatherMap or similar) using venue location. Clock is client-side.

---

### State 2 — Social Night

This is the most data-connected state. Most of the backend already exists in V4.

**Left panel**: Round fixtures by court
- Already exists in V4 Americano module: pairings generated per round, stored per event
- Need to surface current round's fixtures in the display format
- Each fixture card: court number, team 1 names, team 2 names, score if entered

**Right panel**: Player list → Leaderboard → Final standings
- Pre-game: player list with photos and ratings
- In-game: live leaderboard (cumulative points, position change since last round)
- Post-game: final standings with podium treatment for top 3
- All of this derives from existing Americano event data in Supabase

**What the display needs to know**:
- Is there an active Social Night event for this venue?
- What round is it on?
- What are the current round's fixtures?
- What are the current standings?

**Realtime subscription**: display should update automatically when:
- A new round starts
- A score is entered for a fixture
- Event ends

---

### State 3 — Showcase Game

**Left panel**: Live score
- Two teams, large score numbers
- Sets score as secondary
- Lime border on serving team (serving indicator, not decoration — minimum 10px to read at TV distance)
- Already exists in V4 match scoring — needs connecting to display

**Right panel**: Match card
- Player photos (already in Supabase Storage from existing player photo feature)
- Full player names
- VS divider
- No ratings on this card

**Realtime subscription**: display updates on every point scored

---

## Existing V4 Data That's Already There

Based on the full V4 build history, these tables/features already exist:

- `venues` — venue_id, name, location
- `courts` — court_id, venue_id, court_number
- `live_matches` — active match state, scores, player names, player photo URLs, serving team
- `matches` — completed match history
- Americano event tables — event setup, players, rounds, pairings, scores, standings
- `player-photos` Supabase Storage bucket — player photo URLs
- Multi-company/venue URL routing — `/[page]/[company]/[venue]/[court]`
- Supabase Realtime — already used for live score updates

---

## What's Likely Missing

- `sponsors` table — venue_id, name, tagline, logo_url, active boolean
- `venue_events` table (or equivalent) — for the "next event" Moment Layer card (Social Night tonight at 7pm etc). May already exist as part of Social Night setup — check before creating
- Court booking mock data — since Playtomic isn't integrated yet, need either a `court_bookings` mock table or a static JSON fixture per venue
- Weather API integration — per-venue location → current conditions + temperature
- Video playlist config — per-venue list of MP4 URLs for idle state video

---

## Playtomic Integration Architecture (Build for This Now, Connect Later)

The court booking panel needs to be built with a data interface that accepts either:
1. Mock/static data (now)
2. Real Playtomic API data (later)

The Playtomic API call will eventually live in a Supabase Edge Function (not client-side, to keep credentials server-side). The Edge Function will:
- Accept venue_id
- Look up that venue's Playtomic tenant_id and credentials from a `venue_integrations` table
- Call `https://thirdparty.playtomic.io/api/v1/bookings` with date range (today)
- Return normalised booking data to the display

Build the front-end component to consume a normalised booking object regardless of source. The Edge Function is the integration point, not the component.

**Normalised booking shape:**

```typescript
type CourtBooking = {
  court_name: string          // "Court 1", "Court 2" etc
  court_number: number
  next_booking_start: string  // ISO datetime
  next_booking_name: string   // booker name or session type
  session_type: 'private' | 'coaching' | 'club_event' | 'social_night' | 'available'
  is_available_now: boolean
  available_from?: string     // ISO datetime, if currently in use
}
```

---

## Display State Management

The display needs to know which state to show. This is controlled by:

1. **Idle** — default when nothing active
2. **Social Night** — when an active Americano event exists for this venue and is in progress
3. **Showcase** — when an active live_match exists for a court at this venue and it's been flagged as showcase

The display should poll or subscribe to know which state is active. A simple `venue_display_state` table or a derived query from existing tables (check for active events → check for showcase matches → default idle) would work. The display URL is permanent and venue-specific — it figures out its own state from the data.

---

## The Display URL Structure

Already established in V4:
- Control: `/control/[company]/[venue]/[court]`
- Display: `/live/[company]/[venue]/[court]`

PalaLive display follows the same pattern. The venue's Fire Stick permanently loads one URL and the display manages its own state from there.

---

## The Grid (Locked — Do Not Change)

- Canvas: 1920×1080
- Outer frame: 20px
- Inner margin: 60px
- Left panel: 1100px wide, full height
- Gap between panels: 60px
- Right panel: 600px wide, full height
- Bottom bar: full width, holds logo left and clock/weather right

---

## Design Tokens (Locked)

```css
--color-base: #0E1116;
--color-raised: #151A22;
--color-active: #1C2430;
--color-border: rgba(255, 255, 255, 0.08);
--color-text-muted: rgba(255, 255, 255, 0.62);
--color-text-primary: #F5F7FA;
--color-accent: #C8FF00; /* lime green */
```

Venue brand colours applied as accent tokens. Corner radius consistent across all panels and outer frame. Typography bold and large — designed for 3-5 metre TV viewing distance.

---

## State/Component Matrix

| Slot | Idle | Social Night | Showcase |
|------|------|--------------|----------|
| Left panel | Video (contained MP4) | Fixtures + event info | Live score |
| Right panel | Court bookings | Player list → Leaderboard | Match card (photos + names) |
| Moment Layer | Next event / sponsor / result | Round updates / sponsor | Match stats / sponsor |
| Fixed | Logo, clock, weather | Logo, clock, round number | Logo, clock, court number |

---

## Key Component Decisions (Locked)

**Court booking cards:**
- Primary info: next booking time + booking name (not current state)
- Session type shown when not obvious from name (Coaching Session, Club Americano)
- Dropped for named private bookings
- Lime court label top-left, time pill top-right, no clock icon
- Available courts: lime accent treatment
- In-use courts: muted, consistent card weight

**Leaderboard pill:**
- Score and movement in same pill: `19 ↑2`
- Green arrow for up, red/muted for down
- Player rating pill (`3.5`) used on player list pre-game only, not on leaderboard

**Social Night fixture cards:**
- Full names (Glen Noble, not G. Noble)
- Court label as quiet identifier
- VS divider between teams
- Overlapping circular player photos

**Showcase serving indicator:**
- Lime border on serving team's score panel
- Minimum 10px border width to read at TV distance

**Transitions:**
- Main Stage: soft crossfade with subtle scale shift
- Fixed Layer: content swaps in place, almost no movement
- Moment Layer: slides in from consistent direction, holds, slides out

---

## What To Do With This Brief

Before making any changes:

1. Review the existing V4 codebase against this brief
2. Identify which Supabase tables already exist vs what needs creating
3. Identify which Edge Functions already exist vs what needs building
4. Identify where the existing Americano/Social Night data lives and confirm it maps to what the Social Night display state needs
5. Identify the current state of the `live_matches` table and confirm it has everything the Showcase state needs (player names, photos, serving team, sets)
6. Report back with findings before writing any code

**Do not make any changes yet — review and report first.**

---

## Working Style Notes

- Strategy and design direction decisions happen in the main Claude chat (claude.ai)
- Build implementation happens in Claude Code
- One focused phase per prompt — don't combine everything
- SQL runs directly in Supabase dashboard where possible
- Edge Functions deployed via `npx supabase functions deploy [function] --no-verify-jwt`
- Git revert preferred over code-removal edits when changes affect all deployed venues
- All decisions documented in this brief are locked — do not re-litigate them
