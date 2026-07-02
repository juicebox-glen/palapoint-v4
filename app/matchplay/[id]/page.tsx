'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'
import { formatPlayerName, formatTeamDisplay } from '@/lib/utils/name-format'
import { generateAmericanoPairings, getMatchplayTotalRoundsFromStorage } from '@/lib/matchplay-americano-pairings'
import {
  callMatchplayEvent,
  callMatchplayPlayer,
  callMatchplayRound,
} from '@/lib/api/matchplay'
import { resetVenueScreenAfterEventEnd } from '@/lib/venue-screen-staff-context'
import { useStaffSocialNightPaths } from '@/lib/hooks/useStaffSocialNightPaths'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'

interface MatchplayEvent {
  id: string
  name: string
  status: string
  venue_id: string
  format?: string
  match_target_score?: number
  court_count?: number
  court_labels?: string[]
}

interface MatchplayRound {
  id: string
  event_id: string
  round_number: number
  status: string
  match_count?: number
  completed_count?: number
  matches?: MatchplayMatch[]
}

interface MatchplayMatch {
  id: string
  round_id: string
  event_id: string
  court_label: string
  team_a_player_1_id: string
  team_a_player_2_id: string
  team_b_player_1_id: string
  team_b_player_2_id: string
  team_a_player_1_name?: string
  team_a_player_2_name?: string
  team_b_player_1_name?: string
  team_b_player_2_name?: string
  status: string
  team_a_score: number | null
  team_b_score: number | null
  result: string | null
}

interface MatchplayPlayer {
  id: string
  event_id: string
  name: string
  photo_url?: string | null
  total_points: number
  matches_played: number
  matches_won: number
  matches_drawn: number
  matches_lost: number
  games_won: number
  games_lost: number
  game_difference: number
  rank?: number
}

function MatchplayHubPlayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MatchplayHubStandingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M8 6v14" />
      <path d="M16 10v10" />
      <path d="M12 13v7" />
      <path d="M4 20h16" />
    </svg>
  )
}

function MatchplayHubMoreVerticalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

function MatchplayHubStopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <rect x="9" y="9" width="6" height="6" />
    </svg>
  )
}

function resolveMatchPlayerName(players: MatchplayPlayer[], id: string, embedded?: string | null): string {
  const row = players.find((p) => p.id === id)
  if (row?.name?.trim()) return row.name.trim()
  return embedded?.trim() ?? ''
}

function HubCompactCenter({ courtLabel }: { courtLabel: string }) {
  return (
    <div className="matchplay-hub-match-vs-column">
      <div className="matchplay-hub-match-vs-wrap">
        <span className="matchplay-hub-match-vs-badge">VS</span>
        <span className="matchplay-hub-match-court">{courtLabel}</span>
      </div>
    </div>
  )
}

function initialStandardScoreState(
  match: MatchplayMatch,
  draft: { a: number; b: number } | undefined,
  isAmericano: boolean
): { phase: 0 | 1 | 2; correctNext: 'a' | 'b' } {
  if (isAmericano) {
    return { phase: 0, correctNext: 'b' }
  }
  const isCompleted = match.status === 'completed'
  const a = draft?.a ?? (isCompleted ? Number(match.team_a_score) || 0 : 0)
  const b = draft?.b ?? (isCompleted ? Number(match.team_b_score) || 0 : 0)
  if (a === 0 && b === 0) return { phase: 0, correctNext: 'b' }
  if (b === 0) return { phase: 1, correctNext: 'b' }
  return { phase: 2, correctNext: 'b' }
}

function MatchplayHubScoreModal({
  match,
  players,
  isAmericano,
  maxScore,
  draft,
  isSubmitting,
  onClose,
  onDraftChange,
  onConfirm,
}: {
  match: MatchplayMatch
  players: MatchplayPlayer[]
  isAmericano: boolean
  maxScore: number
  draft: { a: number; b: number } | undefined
  isSubmitting: boolean
  onClose: () => void
  onDraftChange: (scores: { a: number; b: number }) => void
  onConfirm: (teamAScore: number, teamBScore: number) => void
}) {
  /** Standard (non-Americano): 0 = enter A, 1 = enter B, 2 = both set — further taps alternate A/B. */
  const [standardScorePhase, setStandardScorePhase] = React.useState<0 | 1 | 2>(() =>
    initialStandardScoreState(match, draft, isAmericano).phase
  )
  const [standardCorrectNext, setStandardCorrectNext] = React.useState<'a' | 'b'>(() =>
    initialStandardScoreState(match, draft, isAmericano).correctNext
  )

  const teamANames = [
    resolveMatchPlayerName(players, match.team_a_player_1_id, match.team_a_player_1_name),
    resolveMatchPlayerName(players, match.team_a_player_2_id, match.team_a_player_2_name),
  ].filter(Boolean)
  const teamBNames = [
    resolveMatchPlayerName(players, match.team_b_player_1_id, match.team_b_player_1_name),
    resolveMatchPlayerName(players, match.team_b_player_2_id, match.team_b_player_2_name),
  ].filter(Boolean)

  const teamADisplay = teamANames.map((n) => formatPlayerName(n, 'first')).join(' & ')
  const teamBDisplay = teamBNames.map((n) => formatPlayerName(n, 'first')).join(' & ')

  const isCompleted = match.status === 'completed'
  const draftScoreA = draft?.a ?? (isCompleted ? Number(match.team_a_score) || 0 : 0)
  const draftScoreB = draft?.b ?? (isCompleted ? Number(match.team_b_score) || 0 : 0)

  const hasScores = draftScoreA > 0 || draftScoreB > 0
  const winner = draftScoreA > draftScoreB ? 'a' : draftScoreB > draftScoreA ? 'b' : null

  const confirmDisabled = isSubmitting || !hasScores

  const baseDraft = React.useCallback((): { a: number; b: number } => {
    return draft ?? { a: draftScoreA, b: draftScoreB }
  }, [draft, draftScoreA, draftScoreB])

  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleQuickScore = (score: number) => {
    const n = Math.min(Math.max(score, 0), maxScore)
    const fb = baseDraft()
    if (isAmericano) {
      if (n === 0) {
        onDraftChange({ a: 0, b: 0 })
      } else {
        onDraftChange({ a: n, b: Math.max(0, maxScore - n) })
      }
      return
    }
    if (standardScorePhase === 0) {
      onDraftChange({ ...fb, a: n })
      setStandardScorePhase(1)
      return
    }
    if (standardScorePhase === 1) {
      onDraftChange({ ...fb, b: n })
      setStandardScorePhase(2)
      setStandardCorrectNext('b')
      return
    }
    if (standardCorrectNext === 'a') {
      onDraftChange({ ...fb, a: n })
      setStandardCorrectNext('b')
    } else {
      onDraftChange({ ...fb, b: n })
      setStandardCorrectNext('a')
    }
  }

  const courtLabel = match.court_label?.trim() || 'Court'

  const scoreModalHeading = isAmericano
    ? 'Score'
    : standardScorePhase === 0
      ? `Score for ${teamADisplay}`
      : standardScorePhase === 1
        ? `Score for ${teamBDisplay}`
        : `Score for ${standardCorrectNext === 'a' ? teamADisplay : teamBDisplay}`

  return (
    <div className="matchplay-score-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="matchplay-score-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="matchplay-score-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="matchplay-score-modal-close" onClick={onClose} aria-label="Close score entry">
          ✕
        </button>

        <h3 className="matchplay-score-modal-title" id="matchplay-score-modal-title">
          {scoreModalHeading}
        </h3>
        <p className="matchplay-score-modal-court">{courtLabel}</p>

        <div className="matchplay-hub-score-entry matchplay-hub-score-entry--modal">
          <div className="matchplay-hub-quick-score-grid" role="group" aria-label="Pick score">
            {Array.from({ length: maxScore + 1 }, (_, i) => i).map((s) => (
              <button
                key={s}
                type="button"
                className="matchplay-hub-quick-score-cell"
                onClick={() => handleQuickScore(s)}
              >
                {String(s).padStart(2, '0')}
              </button>
            ))}
          </div>

          {hasScores && (
            <p className="matchplay-hub-match-entry-result matchplay-hub-score-result">
              Result:{' '}
              {winner === null ? 'Draw' : winner === 'a' ? `${teamADisplay} win` : `${teamBDisplay} win`}
            </p>
          )}

          <div className="matchplay-hub-score-actions">
            <button type="button" onClick={onClose} className="btn btn--secondary btn--full">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(draftScoreA, draftScoreB)}
              disabled={confirmDisabled}
              className="btn btn--primary btn--full"
            >
              {isSubmitting ? 'Saving...' : isCompleted ? 'Update' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HubMatchCard({
  match,
  players,
  draft,
  isSetup,
  canEditLineup,
  onOpenScore,
  onEditLineup,
}: {
  match: MatchplayMatch
  players: MatchplayPlayer[]
  draft: { a: number; b: number } | undefined
  isSetup: boolean
  canEditLineup: boolean
  onOpenScore: () => void
  onEditLineup: () => void
}) {
  const teamANames = [
    resolveMatchPlayerName(players, match.team_a_player_1_id, match.team_a_player_1_name),
    resolveMatchPlayerName(players, match.team_a_player_2_id, match.team_a_player_2_name),
  ].filter(Boolean)
  const teamBNames = [
    resolveMatchPlayerName(players, match.team_b_player_1_id, match.team_b_player_1_name),
    resolveMatchPlayerName(players, match.team_b_player_2_id, match.team_b_player_2_name),
  ].filter(Boolean)

  const teamACompactNames = teamANames.map((n) => formatPlayerName(n, 'abbreviated'))
  const teamBCompactNames = teamBNames.map((n) => formatPlayerName(n, 'abbreviated'))

  const courtLabel = match.court_label?.trim() || 'Court'

  const isCompleted = match.status === 'completed'
  const draftScoreA = draft?.a ?? (isCompleted ? Number(match.team_a_score) || 0 : 0)
  const draftScoreB = draft?.b ?? (isCompleted ? Number(match.team_b_score) || 0 : 0)

  const displayScoreA = isCompleted ? (match.team_a_score ?? 0) : draftScoreA
  const displayScoreB = isCompleted ? (match.team_b_score ?? 0) : draftScoreB

  if (isSetup) {
    return (
      <div className="matchplay-hub-match matchplay-card matchplay-hub-match--setup">
        <div className="matchplay-hub-match-fixture matchplay-hub-match-compact">
          <div className="matchplay-hub-match-side matchplay-hub-match-side--a">
            <div className="matchplay-hub-match-score-row">
              <div className="matchplay-hub-match-score matchplay-hub-match-score--placeholder">
                <span className="matchplay-hub-match-score-num">—</span>
              </div>
            </div>
            <div className="matchplay-hub-match-names">
              {teamACompactNames.map((name, i) => (
                <span key={i} className="matchplay-hub-match-surname">
                  {name}
                </span>
              ))}
            </div>
          </div>
          <HubCompactCenter courtLabel={courtLabel} />
          <div className="matchplay-hub-match-side matchplay-hub-match-side--b">
            <div className="matchplay-hub-match-score-row">
              <div className="matchplay-hub-match-score matchplay-hub-match-score--placeholder">
                <span className="matchplay-hub-match-score-num">—</span>
              </div>
            </div>
            <div className="matchplay-hub-match-names">
              {teamBCompactNames.map((name, i) => (
                <span key={i} className="matchplay-hub-match-surname">
                  {name}
                </span>
              ))}
              {canEditLineup && (
                <button
                  type="button"
                  className="matchplay-hub-match-edit"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditLineup()
                  }}
                >
                  EDIT
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`matchplay-hub-match matchplay-card ${isCompleted ? 'matchplay-hub-match--completed' : 'matchplay-hub-match--pending'}`}
      onClick={onOpenScore}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenScore()
        }
      }}
    >
      <div className="matchplay-hub-match-fixture matchplay-hub-match-compact">
        <div className="matchplay-hub-match-side matchplay-hub-match-side--a">
          <div className="matchplay-hub-match-score-row">
            <div className="matchplay-hub-match-score">
              <span className="matchplay-hub-match-score-num">{displayScoreA}</span>
            </div>
          </div>
          <div className="matchplay-hub-match-names">
            {teamACompactNames.map((name, i) => (
              <span key={i} className="matchplay-hub-match-surname">
                {name}
              </span>
            ))}
          </div>
        </div>
        <HubCompactCenter courtLabel={courtLabel} />
        <div className="matchplay-hub-match-side matchplay-hub-match-side--b">
          <div className="matchplay-hub-match-score-row">
            <div className="matchplay-hub-match-score">
              <span className="matchplay-hub-match-score-num">{displayScoreB}</span>
            </div>
          </div>
          <div className="matchplay-hub-match-names">
            {teamBCompactNames.map((name, i) => (
              <span key={i} className="matchplay-hub-match-surname">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
      {isCompleted && (
        <div className="matchplay-hub-match-completed-badge" aria-hidden>
          ✓
        </div>
      )}
    </div>
  )
}

export default function MatchplayEventPage() {
  const params = useParams()
  const router = useRouter()
  const { path: staffPath, base: staffBase, venueSlug } = useStaffSocialNightPaths()
  const eventId = params.id as string

  const [event, setEvent] = useState<MatchplayEvent | null>(null)
  const [players, setPlayers] = useState<MatchplayPlayer[]>([])
  const [rounds, setRounds] = useState<MatchplayRound[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [scoreModalMatch, setScoreModalMatch] = useState<MatchplayMatch | null>(null)
  const [draftScores, setDraftScores] = useState<Record<string, { a: number; b: number }>>({})
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null)

  const [showEditMatchModal, setShowEditMatchModal] = useState<MatchplayMatch | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const [editMatchAssignments, setEditMatchAssignments] = useState<{ a1: string; a2: string; b1: string; b2: string }>({ a1: '', a2: '', b1: '', b2: '' })

  const roundTabsRef = useRef<HTMLElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const pairingGeneratedRef = useRef(false)

  const getCourtLabels = useCallback(() => {
    const labels = event?.court_labels
    if (labels && labels.length > 0) return labels
    const count = event?.court_count ?? 2
    return Array.from({ length: count }, (_, i) => `Court ${i + 1}`)
  }, [event])

  const loadEvent = useCallback(async () => {
    const result = await callMatchplayEvent({ action: 'get', event_id: eventId })
    if (result.success === false) {
      setError(typeof result.error === 'string' ? result.error : 'Event not found')
      return
    }
    if (result.event) {
      setEvent(result.event as MatchplayEvent)
    } else {
      setError('Event not found')
    }
  }, [eventId])

  const loadPlayers = useCallback(async () => {
    const result = await callMatchplayPlayer({ action: 'list', event_id: eventId })
    setPlayers((result.players as MatchplayPlayer[] | undefined) ?? [])
  }, [eventId])

  const loadRounds = useCallback(async () => {
    const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
    const list = (listResult.rounds as MatchplayRound[] | undefined) ?? []
    const withMatches = await Promise.all(
      list.map(async (r) => {
        const getResult = await callMatchplayRound({ action: 'get_round', round_id: r.id })
        const round = getResult.round as { matches?: MatchplayMatch[] } | undefined
        return { ...r, matches: round?.matches ?? [] } as MatchplayRound
      })
    )
    const sorted = withMatches.sort((a, b) => (a.round_number ?? 0) - (b.round_number ?? 0))
    setRounds(sorted)
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    async function init() {
      setLoading(true)
      await loadEvent()
      await loadPlayers()
      await loadRounds()
      setLoading(false)
    }
    init()
  }, [eventId, loadEvent, loadPlayers, loadRounds])

  useEffect(() => {
    pairingGeneratedRef.current = false
  }, [eventId])

  useEffect(() => {
    if (loading) return
    if (!event || !players.length || rounds.length > 0 || pairingGeneratedRef.current) return
    if (event.status !== 'setup') return

    pairingGeneratedRef.current = true
    const courtLabels = getCourtLabels()
    const playerIds = players.map((p) => p.id)

    if (playerIds.length < 4) return

    const allPairings = generateAmericanoPairings(playerIds, courtLabels)
    const cap = getMatchplayTotalRoundsFromStorage()
    const pairings = allPairings.slice(0, Math.min(allPairings.length, cap))

    async function createRounds() {
      const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
      const existing = (listResult.rounds ?? []) as { round_number?: number }[]
      const existingNumbers = new Set(existing.map((r) => r.round_number ?? 0))

      for (const p of pairings) {
        if (existingNumbers.has(p.roundNumber)) continue
        const result = await callMatchplayRound({
          action: 'create_round',
          event_id: eventId,
          round_number: p.roundNumber,
          matches: p.matches,
        })
        if (!result.round) {
          if (result.error?.includes('duplicate') || result.error?.includes('unique')) {
            existingNumbers.add(p.roundNumber)
            continue
          }
          setError(result.error || 'Failed to create rounds')
          pairingGeneratedRef.current = false
          return
        }
        existingNumbers.add(p.roundNumber)
      }
      await loadRounds()
    }
    createRounds()
  }, [loading, event, players, rounds.length, eventId, getCourtLabels, loadRounds])

  useEffect(() => {
    if (rounds.length === 0) return
    const ids = new Set(rounds.map((r) => r.id))
    if (!selectedRoundId || !ids.has(selectedRoundId)) {
      const current = rounds.find((r) => r.status !== 'completed') ?? rounds[rounds.length - 1]
      setSelectedRoundId(current?.id ?? rounds[0].id)
    }
  }, [rounds, selectedRoundId])

  useEffect(() => {
    if (!roundTabsRef.current || !selectedRoundId) return
    const el = roundTabsRef.current.querySelector(`[data-round-id="${selectedRoundId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedRoundId])

  useEffect(() => {
    if (!showMenu) return
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [showMenu])

  useEffect(() => {
    if (!eventId) return
    const ch = supabase.channel(`matchplay-realtime-${eventId}`)
    ;(ch as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_players', filter: `event_id=eq.${eventId}` },
      () => {
        loadPlayers()
      }
    )
    ;(ch as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_matches', filter: `event_id=eq.${eventId}` },
      () => {
        loadRounds()
      }
    )
    ;(ch as any).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matchplay_rounds', filter: `event_id=eq.${eventId}` },
      () => {
        loadRounds()
      }
    )
    ch.subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [eventId, loadPlayers, loadRounds])

  const viewingRound = rounds.find((r) => r.id === selectedRoundId) ?? rounds[0]
  const isAmericano = event?.format === 'americano'
  const maxScore = event?.match_target_score ?? 32
  const hasCompletedMatchInCurrentRound = viewingRound?.matches?.some((m) => m.status === 'completed') ?? false
  const allMatchesScoredInCurrentRound = (viewingRound?.matches?.length ?? 0) > 0 && (viewingRound?.matches ?? []).every((m) => m.status === 'completed')
  const isFinalRound = rounds.length > 0 && (viewingRound?.round_number ?? 0) >= (rounds[rounds.length - 1]?.round_number ?? 0)
  const canShowEndEvent = event?.status === 'in_progress' && (isFinalRound ? allMatchesScoredInCurrentRound : true)
  const totalRounds = rounds.length
  const completedRoundsCount = rounds.filter((r) => r.status === 'completed').length
  const allRoundsComplete = rounds.length > 0 && rounds.every((r) => r.status === 'completed')

  const handleStartEvent = async () => {
    if (!eventId) return
    setActionLoading('start')
    setError(null)
    const result = await callMatchplayEvent({ action: 'start', event_id: eventId })
    if (result.success === false) {
      setError(typeof result.error === 'string' ? result.error : 'Failed to start event')
      setActionLoading(null)
      return
    }
    if (result.event) {
      setEvent(result.event as MatchplayEvent)
      const firstRound = rounds.find((r) => (r.round_number ?? 0) === 1)
      if (firstRound) {
        await callMatchplayRound({ action: 'start_round', round_id: firstRound.id })
        await loadRounds()
      }
    } else {
      setError('Failed to start event')
    }
    setActionLoading(null)
  }

  const handleEndEvent = async () => {
    if (!eventId) return
    setActionLoading('end')
    setError(null)
    try {
      const result = await callMatchplayEvent({ action: 'complete', event_id: eventId })
      if (!result.event) {
        throw new Error(result.error || 'Failed to end event')
      }
      await resetVenueScreenAfterEventEnd(eventId)
      setEvent(result.event as MatchplayEvent)
      router.push(staffPath(`/${eventId}/results`))
    } catch (err) {
      console.error('End event error:', err)
      setError(err instanceof Error ? err.message : 'Failed to end event')
    } finally {
      setActionLoading(null)
      setShowEndConfirm(false)
    }
  }

  const handleNextRound = async () => {
    if (!viewingRound || rounds.length === 0) return
    const idx = rounds.findIndex((r) => r.id === viewingRound.id)
    if (idx >= 0 && idx < rounds.length - 1) {
      const nextRound = rounds[idx + 1]!
      setSelectedRoundId(nextRound.id)
      if (nextRound.status === 'pending') {
        await callMatchplayRound({ action: 'start_round', round_id: nextRound.id })
        await loadRounds()
      }
    }
  }

  const handleEnterResult = async (matchId: string, teamAScore: number, teamBScore: number) => {
    setSubmittingMatchId(matchId)
    setError(null)
    const result = await callMatchplayRound({
      action: 'enter_result',
      match_id: matchId,
      team_a_score: teamAScore,
      team_b_score: teamBScore,
    })
    if (result.success) {
      setScoreModalMatch(null)
      setDraftScores((prev) => {
        const next = { ...prev }
        delete next[matchId]
        return next
      })
      loadRounds()
    } else {
      setError(result.error || 'Failed to save score')
    }
    setSubmittingMatchId(null)
  }

  const getAssignedInRound = (round: MatchplayRound, excludeMatchId?: string) => {
    const assigned = new Set<string>()
    for (const m of round.matches ?? []) {
      if (m.id === excludeMatchId) continue
      assigned.add(m.team_a_player_1_id)
      assigned.add(m.team_a_player_2_id)
      assigned.add(m.team_b_player_1_id)
      assigned.add(m.team_b_player_2_id)
    }
    return assigned
  }

  const getSitOutCounts = () => {
    const counts: Record<string, number> = {}
    for (const p of players) counts[p.id] = 0
    for (const r of rounds) {
      const playerIds = new Set<string>()
      for (const m of r.matches ?? []) {
        playerIds.add(m.team_a_player_1_id)
        playerIds.add(m.team_a_player_2_id)
        playerIds.add(m.team_b_player_1_id)
        playerIds.add(m.team_b_player_2_id)
      }
      for (const p of players) {
        if (!playerIds.has(p.id)) counts[p.id] = (counts[p.id] ?? 0) + 1
      }
    }
    return counts
  }

  const handleEditMatchSave = async () => {
    const m = showEditMatchModal
    if (!m || !eventId) return
    const { a1, a2, b1, b2 } = editMatchAssignments
    if (!a1 || !a2 || !b1 || !b2) return
    setActionLoading('edit')
    setError(null)
    const result = await callMatchplayRound({
      action: 'update_match',
      match_id: m.id,
      team_a: [a1, a2],
      team_b: [b1, b2],
    })
    if (result.success) {
      setShowEditMatchModal(null)
      setEditMatchAssignments({ a1: '', a2: '', b1: '', b2: '' })
      loadRounds()
    } else {
      setError(result.error || 'Failed to update match')
    }
    setActionLoading(null)
  }

  const openEditMatch = (match: MatchplayMatch) => {
    setEditMatchAssignments({
      a1: match.team_a_player_1_id,
      a2: match.team_a_player_2_id,
      b1: match.team_b_player_1_id,
      b2: match.team_b_player_2_id,
    })
    setShowEditMatchModal(match)
  }

  const isSetup = event?.status === 'setup'
  const isLive = event?.status === 'in_progress'

  if (loading) {
    return (
      <div className="matchplay-event-page matchplay-event-page--centered-state">
        <p className="matchplay-loading-text">Loading...</p>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="matchplay-event-page matchplay-event-page--centered-state">
        <p className="matchplay-error-text">{error}</p>
        <div className="matchplay-modal-actions">
          <Link href={staffBase ?? '/matchplay'} className="btn btn-secondary">
            Back to list
          </Link>
        </div>
      </div>
    )
  }

  if (!event) return null

  const canEditLineup = !isAmericano && (isSetup || (isLive && !hasCompletedMatchInCurrentRound))

  return (
    <StaffAppFrame venueSlug={venueSlug ?? undefined}>
      <div className="matchplay-event-page">
      <header className="matchplay-hub-header">
        <button type="button" onClick={() => router.push(staffBase ?? '/matchplay')} className="matchplay-hub-back" aria-label="Back">
          ←
        </button>
        <h1 className="matchplay-hub-title">Event</h1>
        <div className="matchplay-hub-menu-container" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((open) => !open)}
            className="matchplay-hub-menu-btn"
            aria-label="Event menu"
            aria-expanded={showMenu}
          >
            <MatchplayHubMoreVerticalIcon />
          </button>
          {showMenu && (
            <div className="matchplay-hub-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="matchplay-hub-menu-item"
                onClick={() => {
                  setShowMenu(false)
                  router.push(staffPath(`/${eventId}/players`))
                }}
              >
                <MatchplayHubPlayersIcon className="matchplay-hub-menu-icon" />
                Players
              </button>
              {event?.status === 'in_progress' && (
                <button
                  type="button"
                  role="menuitem"
                  className="matchplay-hub-menu-item"
                  onClick={() => {
                    setShowMenu(false)
                    router.push(staffPath(`/${eventId}/standings`))
                  }}
                >
                  <MatchplayHubStandingsIcon className="matchplay-hub-menu-icon" />
                  Standings
                </button>
              )}
              {event?.status === 'in_progress' && (
                <>
                  <div className="matchplay-hub-menu-divider" aria-hidden />
                  <button
                    type="button"
                    role="menuitem"
                    className="matchplay-hub-menu-item matchplay-hub-menu-item--danger"
                    onClick={() => {
                      setShowMenu(false)
                      setShowEndConfirm(true)
                    }}
                  >
                    <MatchplayHubStopIcon className="matchplay-hub-menu-icon" />
                    End Event
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {rounds.length > 0 ? (
      <nav className="matchplay-hub-rounds" ref={roundTabsRef}>
        {rounds.map((round) => {
          const isActive = round.id === selectedRoundId
          const isCompleted = round.status === 'completed'
          return (
            <button
              key={round.id}
              type="button"
              data-round-id={round.id}
              onClick={() => setSelectedRoundId(round.id)}
              className={`matchplay-hub-round-tab ${isActive ? 'matchplay-hub-round-tab--active' : ''} ${isCompleted ? 'matchplay-hub-round-tab--completed' : ''}`}
            >
              ROUND {round.round_number}
              {isCompleted && <span className="matchplay-hub-round-check">✓</span>}
            </button>
          )
        })}
      </nav>
      ) : null}

      {error && <div className="setup-error matchplay-hub-error">{error}</div>}

      {!viewingRound ? (
        <div className="matchplay-hub-empty">
          {event.status === 'setup'
            ? 'No rounds yet. Add at least four players from the menu, or wait for fixtures to generate.'
            : 'No fixtures loaded for this event.'}
        </div>
      ) : (
        <div className="matchplay-hub-matches">
          {(viewingRound.matches ?? []).map((match) => (
            <HubMatchCard
              key={match.id}
              match={match}
              players={players}
              draft={draftScores[match.id]}
              isSetup={isSetup}
              canEditLineup={canEditLineup}
              onOpenScore={() => {
                setScoreModalMatch(match)
                setDraftScores((prev) => {
                  if (prev[match.id]) return prev
                  if (match.status === 'completed') {
                    return {
                      ...prev,
                      [match.id]: {
                        a: Number(match.team_a_score) || 0,
                        b: Number(match.team_b_score) || 0,
                      },
                    }
                  }
                  return { ...prev, [match.id]: { a: 0, b: 0 } }
                })
              }}
              onEditLineup={() => openEditMatch(match)}
            />
          ))}
        </div>
      )}

      {viewingRound && (() => {
        const assignedIds = new Set<string>()
        for (const m of viewingRound.matches ?? []) {
          assignedIds.add(m.team_a_player_1_id)
          assignedIds.add(m.team_a_player_2_id)
          assignedIds.add(m.team_b_player_1_id)
          assignedIds.add(m.team_b_player_2_id)
        }
        const resting = players.filter((p) => !assignedIds.has(p.id))
        const sitOutCounts = getSitOutCounts()
        if (resting.length === 0) return null
        return (
          <div className="matchplay-hub-resting">
            <div className="matchplay-hub-resting-title">Resting this round</div>
            <div className="matchplay-hub-resting-list">
              {resting.map((p) => (
                <span key={p.id} className="matchplay-hub-resting-player">
                  {p.name}
                  {(sitOutCounts[p.id] ?? 0) > 0 && (
                    <span className="matchplay-hub-resting-count"> (rested {(sitOutCounts[p.id] ?? 0)} times)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {scoreModalMatch && (
        <MatchplayHubScoreModal
          key={scoreModalMatch.id}
          match={scoreModalMatch}
          players={players}
          isAmericano={isAmericano}
          maxScore={maxScore}
          draft={draftScores[scoreModalMatch.id]}
          isSubmitting={submittingMatchId === scoreModalMatch.id}
          onClose={() => {
            const mid = scoreModalMatch.id
            setScoreModalMatch(null)
            setDraftScores((prev) => {
              const n = { ...prev }
              delete n[mid]
              return n
            })
          }}
          onDraftChange={(scores) =>
            setDraftScores((prev) => ({ ...prev, [scoreModalMatch.id]: scores }))
          }
          onConfirm={(a, b) => handleEnterResult(scoreModalMatch.id, a, b)}
        />
      )}

      <footer className="matchplay-hub-footer">
        {isSetup && (
          <button
            type="button"
            className="btn btn--primary btn--full"
            onClick={handleStartEvent}
            disabled={!!actionLoading || players.length < 4}
          >
            {actionLoading === 'start' ? 'Starting...' : 'START EVENT'}
          </button>
        )}
        {isLive && (
          <>
            {canShowEndEvent && isFinalRound && allMatchesScoredInCurrentRound ? (
              <button
                type="button"
                className="btn btn--primary btn--full"
                onClick={() => setShowEndConfirm(true)}
                disabled={!!actionLoading}
              >
                {actionLoading === 'end'
                  ? allRoundsComplete
                    ? 'Finalizing...'
                    : 'Ending...'
                  : allRoundsComplete
                    ? 'FINALIZE RESULTS'
                    : 'END EVENT'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--full"
                onClick={handleNextRound}
                disabled={!allMatchesScoredInCurrentRound || isFinalRound}
              >
                NEXT ROUND
              </button>
            )}
          </>
        )}
      </footer>

      {showEndConfirm && (
        <div
          className="matchplay-event-modal-overlay"
          onClick={() => {
            if (!actionLoading) setShowEndConfirm(false)
          }}
        >
          <div className="matchplay-event-modal matchplay-hub-end-modal" onClick={(e) => e.stopPropagation()}>
            <div className="matchplay-event-modal-header">
              <h2>{allRoundsComplete ? 'Finalize event?' : 'End event early?'}</h2>
              <button
                type="button"
                className="matchplay-event-modal-close"
                onClick={() => !actionLoading && setShowEndConfirm(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="matchplay-event-modal-body">
              {allRoundsComplete ? (
                <p className="matchplay-hub-end-modal-text">
                  All {totalRounds} rounds are complete. Ready to finalize standings?
                </p>
              ) : (
                <>
                  <p className="matchplay-hub-end-modal-text">
                    This will end the event after {completedRoundsCount} of {totalRounds} rounds.
                  </p>
                  <p className="matchplay-hub-end-modal-text matchplay-hub-end-modal-text--muted">
                    Any unscored matches will be excluded from final standings.
                  </p>
                </>
              )}
              <div className="matchplay-hub-end-modal-actions">
                <button type="button" className="btn btn--secondary btn--full" onClick={() => setShowEndConfirm(false)} disabled={!!actionLoading}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn--full ${allRoundsComplete ? 'btn--primary' : 'btn-danger-fill'}`}
                  onClick={handleEndEvent}
                  disabled={actionLoading === 'end'}
                >
                  {actionLoading === 'end'
                    ? allRoundsComplete
                      ? 'Finalizing...'
                      : 'Ending...'
                    : allRoundsComplete
                      ? 'Finalize results'
                      : 'End event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Match Modal */}
      {showEditMatchModal && viewingRound && (
        <div className="matchplay-event-modal-overlay" onClick={() => setShowEditMatchModal(null)}>
          <div className="matchplay-event-modal matchplay-event-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="matchplay-event-modal-header">
              <h2>Edit {showEditMatchModal.court_label}</h2>
              <button type="button" className="matchplay-event-modal-close" onClick={() => setShowEditMatchModal(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="matchplay-event-modal-body">
              {error && <div className="setup-error">{error}</div>}
              <div className="matchplay-event-edit-teams">
                <div className="matchplay-event-edit-team">
                  <label>Team A</label>
                  <select
                    value={editMatchAssignments.a1}
                    onChange={(e) => setEditMatchAssignments((prev) => ({ ...prev, a1: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const assigned = getAssignedInRound(viewingRound, showEditMatchModal!.id)
                        const inThisMatch = [editMatchAssignments.a1, editMatchAssignments.a2, editMatchAssignments.b1, editMatchAssignments.b2].includes(p.id)
                        return (
                          <option key={p.id} value={p.id} disabled={assigned.has(p.id) && !inThisMatch}>
                            {p.name}
                          </option>
                        )
                      })}
                  </select>
                  <select
                    value={editMatchAssignments.a2}
                    onChange={(e) => setEditMatchAssignments((prev) => ({ ...prev, a2: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const assigned = getAssignedInRound(viewingRound, showEditMatchModal!.id)
                        const inThisMatch = [editMatchAssignments.a1, editMatchAssignments.a2, editMatchAssignments.b1, editMatchAssignments.b2].includes(p.id)
                        return (
                          <option key={p.id} value={p.id} disabled={assigned.has(p.id) && !inThisMatch}>
                            {p.name}
                          </option>
                        )
                      })}
                  </select>
                </div>
                <div className="matchplay-event-edit-team">
                  <label>Team B</label>
                  <select
                    value={editMatchAssignments.b1}
                    onChange={(e) => setEditMatchAssignments((prev) => ({ ...prev, b1: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const assigned = getAssignedInRound(viewingRound, showEditMatchModal!.id)
                        const inThisMatch = [editMatchAssignments.a1, editMatchAssignments.a2, editMatchAssignments.b1, editMatchAssignments.b2].includes(p.id)
                        return (
                          <option key={p.id} value={p.id} disabled={assigned.has(p.id) && !inThisMatch}>
                            {p.name}
                          </option>
                        )
                      })}
                  </select>
                  <select
                    value={editMatchAssignments.b2}
                    onChange={(e) => setEditMatchAssignments((prev) => ({ ...prev, b2: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {players
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const assigned = getAssignedInRound(viewingRound, showEditMatchModal!.id)
                        const inThisMatch = [editMatchAssignments.a1, editMatchAssignments.a2, editMatchAssignments.b1, editMatchAssignments.b2].includes(p.id)
                        return (
                          <option key={p.id} value={p.id} disabled={assigned.has(p.id) && !inThisMatch}>
                            {p.name}
                          </option>
                        )
                      })}
                  </select>
                </div>
              </div>
              <div className="matchplay-modal-actions">
                <button type="button" className="btn btn-primary" onClick={handleEditMatchSave} disabled={!!actionLoading || !editMatchAssignments.a1 || !editMatchAssignments.a2 || !editMatchAssignments.b1 || !editMatchAssignments.b2}>
                  Save
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditMatchModal(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </StaffAppFrame>
  )
}
