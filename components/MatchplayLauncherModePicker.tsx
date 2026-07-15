'use client'

import Link from 'next/link'

import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-staff.css'

function ListRowChevron() {
  return (
    <span className="palalive-staff-list-row-chevron" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M7 5l5 5-5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

interface MatchplayLauncherModePickerProps {
  /** When set, links stay under /staff/[venue]/social-night/… for home-screen PWA continuity. */
  staffVenueSlug?: string
}

/**
 * Matchplay launcher — game mode list, per
 * design-mockups/palalive-matchplay-flow.html screen 1.
 */
export function MatchplayLauncherModePicker({ staffVenueSlug }: MatchplayLauncherModePickerProps) {
  const americanoHref = staffVenueSlug
    ? `/staff/${staffVenueSlug}/social-night/new`
    : '/matchplay/new'

  return (
    <div className="palalive-staff-list-group">
      <p className="palalive-staff-section-label">Select game mode</p>

      <Link href={americanoHref} className="palalive-staff-list-row">
        <span className="palalive-staff-list-row-copy">
          <span className="palalive-staff-list-row-title">Americano</span>
          <span className="palalive-staff-list-row-desc">Everyone plays with everyone once</span>
        </span>
        <ListRowChevron />
      </Link>

      <div
        className="palalive-staff-list-row is-disabled"
        aria-disabled
        aria-label="King of the Court, coming soon"
      >
        <span className="palalive-staff-list-row-copy">
          <span className="palalive-staff-list-row-title">King of the Court</span>
          <span className="palalive-staff-list-row-desc">Elimination-style rotation</span>
        </span>
        <ListRowChevron />
      </div>

      <div
        className="palalive-staff-list-row is-disabled"
        aria-disabled
        aria-label="Matchplay format, coming soon"
      >
        <span className="palalive-staff-list-row-copy">
          <span className="palalive-staff-list-row-title">Matchplay</span>
          <span className="palalive-staff-list-row-desc">Curated social play with manual pairings</span>
        </span>
        <ListRowChevron />
      </div>

      <div className="palalive-staff-list-row is-disabled" aria-disabled aria-label="Mexicano, coming soon">
        <span className="palalive-staff-list-row-copy">
          <span className="palalive-staff-list-row-title">Mexicano</span>
          <span className="palalive-staff-list-row-desc">Coming soon</span>
        </span>
        <ListRowChevron />
      </div>
    </div>
  )
}
