'use client'

import Link from 'next/link'

function LauncherChevron() {
  return (
    <div className="session-review-chevron" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M7 5l5 5-5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/**
 * Matchplay launcher — “select game mode” list.
 * Uses setup-section / setup-section-title and session-review-game-row (same pattern as session review).
 */
export function MatchplayLauncherModePicker() {
  return (
    <section className="setup-section matchplay-launcher-modes">
      <h2 className="setup-section-title">Select game mode</h2>
      <div className="session-review-game-rows">
        <Link
          href="/matchplay/new"
          className="session-review-game-row session-review-game-row--launcher session-review-game-row--clickable"
        >
          <div className="matchplay-launcher-mode-copy">
            <span className="matchplay-launcher-mode-name">Americano</span>
            <span className="matchplay-launcher-mode-desc">Everyone plays with everyone once</span>
          </div>
          <LauncherChevron />
        </Link>

        <div
          className="session-review-game-row session-review-game-row--launcher session-review-game-row--disabled"
          aria-disabled
          aria-label="King of the Court, coming soon"
        >
          <div className="matchplay-launcher-mode-copy">
            <span className="matchplay-launcher-mode-name">King of the Court</span>
            <span className="matchplay-launcher-mode-desc">Elimination-style rotation</span>
          </div>
          <LauncherChevron />
        </div>

        <div
          className="session-review-game-row session-review-game-row--launcher session-review-game-row--disabled"
          aria-disabled
          aria-label="Matchplay format, coming soon"
        >
          <div className="matchplay-launcher-mode-copy">
            <span className="matchplay-launcher-mode-name">Matchplay</span>
            <span className="matchplay-launcher-mode-desc">Curated social play with manual pairings</span>
          </div>
          <LauncherChevron />
        </div>

        <div
          className="session-review-game-row session-review-game-row--launcher session-review-game-row--disabled"
          aria-disabled
          aria-label="Mexicano, coming soon"
        >
          <div className="matchplay-launcher-mode-copy">
            <span className="matchplay-launcher-mode-name">Mexicano</span>
            <span className="matchplay-launcher-mode-desc">Coming soon</span>
          </div>
          <LauncherChevron />
        </div>
      </div>
    </section>
  )
}
