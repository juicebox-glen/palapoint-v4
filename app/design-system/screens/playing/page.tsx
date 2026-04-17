import { redirect } from 'next/navigation'

/** @deprecated Use `/design-system/screens/player-mobile` for the full player flow. */
export default function PlayingScreensRedirectPage() {
  redirect('/design-system/screens/player-mobile')
}
