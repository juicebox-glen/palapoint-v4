import type { ScreenPreviewState } from '../../components/ScreenPreview'

/** Single catalog for PalaLive DS screen tabs — keep in sync with production routes. */

export const PALALIVE_TV_STATES: ScreenPreviewState[] = [
  { name: 'idle', label: 'Idle', url: '/design-system/preview/palalive?state=idle' },
  {
    name: 'social-waiting',
    label: 'Social · Waiting',
    url: '/design-system/preview/palalive?state=social-waiting',
  },
  { name: 'social-pregame', label: 'Social · Pregame', url: '/design-system/preview/palalive?state=social-pregame' },
  { name: 'social-ingame', label: 'Social · Live', url: '/design-system/preview/palalive?state=social-ingame' },
  { name: 'social-postgame', label: 'Social · Final', url: '/design-system/preview/palalive?state=social-postgame' },
  {
    name: 'showcase-waiting',
    label: 'Showcase · Waiting',
    url: '/design-system/preview/palalive?state=showcase-waiting',
  },
  { name: 'showcase', label: 'Showcase · Live', url: '/design-system/preview/palalive?state=showcase' },
  {
    name: 'showcase-endgame',
    label: 'Showcase · End',
    url: '/design-system/preview/palalive?state=showcase-endgame',
  },
]

export const PALALIVE_STAFF_SHOWCASE_STATES: ScreenPreviewState[] = [
  {
    name: 'staff-loading',
    label: 'Loading',
    url: '/design-system/preview/control?state=loading&variant=palalive-staff',
  },
  {
    name: 'staff-setup',
    label: 'Setup',
    url: '/design-system/preview/control?state=setup&variant=palalive-staff',
  },
  {
    name: 'staff-preview',
    label: 'Confirm',
    url: '/design-system/preview/control?state=preview&variant=palalive-staff',
  },
  {
    name: 'staff-live',
    label: 'Live Scoring',
    url: '/design-system/preview/control?state=live&variant=palalive-staff',
  },
  {
    name: 'staff-endgame',
    label: 'End · Win',
    url: '/design-system/preview/control?state=endgame&variant=palalive-staff',
  },
  {
    name: 'staff-endgame-multi',
    label: 'End · 2-1',
    url: '/design-system/preview/control?state=endgame_multi&variant=palalive-staff',
  },
  {
    name: 'staff-endgame-sweep',
    label: 'End · 2-0',
    url: '/design-system/preview/control?state=endgame_sweep&variant=palalive-staff',
  },
]

const MATCHPLAY = '/design-system/preview/matchplay'

/** Social Night staff phone — production `/staff` → `/matchplay/*` with palalive chrome. */
export const PALALIVE_STAFF_SOCIAL_STATES: ScreenPreviewState[] = [
  { name: 'launcher', label: 'Home', url: `${MATCHPLAY}?state=launcher`, viewport: 'mobile' },
  { name: 'format', label: 'New Americano', url: `${MATCHPLAY}?state=format`, viewport: 'mobile' },
  { name: 'players', label: 'Add players', url: `${MATCHPLAY}?state=players`, viewport: 'mobile' },
  { name: 'event', label: 'Event hub', url: `${MATCHPLAY}?state=event`, viewport: 'mobile' },
  {
    name: 'event_finalize',
    label: 'Hub · End Event',
    url: `${MATCHPLAY}?state=event_finalize`,
    viewport: 'mobile',
  },
  {
    name: 'hub_players',
    label: 'Roster',
    url: `${MATCHPLAY}?state=hub_players`,
    viewport: 'mobile',
  },
  {
    name: 'hub_standings',
    label: 'Standings',
    url: `${MATCHPLAY}?state=hub_standings`,
    viewport: 'mobile',
  },
  {
    name: 'hub_results',
    label: 'Event complete',
    url: `${MATCHPLAY}?state=hub_results`,
    viewport: 'mobile',
  },
]
