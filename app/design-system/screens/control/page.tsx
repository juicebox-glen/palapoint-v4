import { redirect } from 'next/navigation'

/** Staff control docs live on the unified staff & player hub. */
export default function ControlScreensPage() {
  redirect('/design-system/screens/player-mobile?flow=staff')
}
