import type { CSSProperties } from 'react'

import { FixtureCard } from '@/components/palalive/FixtureCard'
import { PalaLiveClock } from '@/components/palalive/PalaLiveClock'
import { PalaLiveScrollList } from '@/components/palalive/PalaLiveScrollList'
import { PalaLiveShell } from '@/components/palalive/PalaLiveShell'
import { PalaLiveWeatherStub } from '@/components/palalive/PalaLiveWeatherStub'
import { PlayerRow } from '@/components/palalive/PlayerRow'
import { SocialEndgameTopThree } from '@/components/palalive/SocialEndgameTopThree'
import type { SocialNightEventData, SocialNightPlayer } from '@/lib/palalive/social-types'
import type { VenueBranding } from '@/lib/venue'

import '@/app/styles/palalive-social.css'

interface PalaLiveSocialViewProps {
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
  data: SocialNightEventData
}

const PANEL_COPY = {
  pregame: { label: 'Players', panelClass: '' },
  ingame: { label: 'Live Scores', panelClass: ' palalive-social-panel--solid' },
  postgame: { label: 'Final Standings', panelClass: ' palalive-social-panel--solid' },
} as const

function formatLabel(format: string): string {
  return format === 'americano' ? 'Americano' : format
}

function rightPanelRows(phase: SocialNightEventData['phase'], roster: SocialNightPlayer[], standings: SocialNightPlayer[]) {
  if (phase === 'pregame') {
    return roster.map((p) => <PlayerRow key={p.id} name={p.name} photoUrl={p.photoUrl} />)
  }
  if (phase === 'postgame') {
    return standings.map((p) => (
      <PlayerRow
        key={p.id}
        name={p.name}
        photoUrl={p.photoUrl}
        chipLabel={String(p.totalPoints)}
      />
    ))
  }
  return standings.map((p) => (
    <PlayerRow
      key={p.id}
      name={p.name}
      photoUrl={p.photoUrl}
      chipLabel={String(p.totalPoints)}
      delta={
        p.rankDelta != null && p.rankDelta !== 0
          ? { direction: p.rankDelta > 0 ? 'up' : 'down', value: Math.abs(p.rankDelta) }
          : null
      }
    />
  ))
}

export function PalaLiveSocialView({ branding, brandingStyles, data }: PalaLiveSocialViewProps) {
  const { phase, eventName, format, courtLabels, roundNumber, totalRounds, matches, roster, standings } = data
  const copy = PANEL_COPY[phase]
  const rowCount = phase === 'pregame' ? roster.length : standings.length
  const isEndgame = phase === 'postgame'

  return (
    <PalaLiveShell
      branding={branding}
      brandingStyles={brandingStyles}
      bottomBarRight={
        <>
          <PalaLiveWeatherStub />
          <PalaLiveClock />
        </>
      }
      mainStage={
        <>
          {!isEndgame ? (
            <div className="palalive-social-ambient" aria-hidden="true">
              <div className="palalive-social-ambient__wash" />
              <div className="palalive-social-ambient__orb palalive-social-ambient__orb--a" />
              <div className="palalive-social-ambient__orb palalive-social-ambient__orb--b" />
              <div className="palalive-social-ambient__orb palalive-social-ambient__orb--c" />
              <div className="palalive-social-ambient__vignette" />
            </div>
          ) : null}

          {isEndgame ? (
            <SocialEndgameTopThree eventName={eventName} standings={standings} />
          ) : (
            <div className="palalive-event-card">
              <div className="palalive-event-header">
                <span className="palalive-event-title">{eventName}</span>
                {phase === 'pregame' ? (
                  <div className="palalive-event-pregame-meta">
                    <span className="palalive-event-format">
                      {formatLabel(format)} &middot; {roster.length} players &middot; {courtLabels.length} courts
                    </span>
                    <span className="palalive-event-starting-soon">Starting Soon</span>
                  </div>
                ) : (
                  <span className="palalive-event-round">
                    Round {roundNumber}/{totalRounds}
                  </span>
                )}
              </div>
              <div className="palalive-event-grid">
                {matches.length === 0 ? (
                  <div className="palalive-event-grid-empty">
                    {phase === 'pregame'
                      ? 'No fixtures yet — round 1 will appear when generated.'
                      : 'No matches this round.'}
                  </div>
                ) : (
                  matches.map((match) => <FixtureCard key={match.id} match={match} variant={phase} />)
                )}
              </div>
            </div>
          )}

          <div className={`palalive-social-panel${copy.panelClass}`}>
            <div className="palalive-stack-header">
              <span className="palalive-title-label">
                {phase === 'ingame' ? `${copy.label} · Round ${roundNumber}` : copy.label}
              </span>
              <span className="palalive-title-count">{rowCount} Total</span>
            </div>
            <PalaLiveScrollList>{rightPanelRows(phase, roster, standings)}</PalaLiveScrollList>
          </div>
        </>
      }
    />
  )
}
