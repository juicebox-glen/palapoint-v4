import { redirect } from 'next/navigation'

/** Legacy path — PalaLive catalog lives under /design-system/palalive. */
export default function PalaLiveScreensRedirectPage() {
  redirect('/design-system/palalive/screens')
}
