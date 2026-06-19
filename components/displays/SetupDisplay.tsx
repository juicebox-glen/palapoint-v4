'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession, createSession, takeoverSession, validateSession } from '@/lib/api/session'
import Header from '@/components/ui/Header'
import MatchSetupForm from '@/components/MatchSetupForm'
import MatchConfirmation from '@/components/shared/MatchConfirmation'
import PlayingReadyHero from '@/components/shared/PlayingReadyHero'
import SessionProtectionPrompt from '@/components/SessionProtectionPrompt'
import { EMPTY_PLAYER_PHOTOS, type GameMode, type MatchState, type PlayerPhotosState } from '@/lib/types/match'
import { shufflePlayersWithPhotos } from '@/lib/utils/shuffle-players'
import { generateUuid } from '@/lib/utils/uuid'
import type { VenueBranding } from '@/lib/venue'
import { useLiveMatch } from '@/lib/hooks/useLiveMatch'

import { supabaseFunctionHeaders, SUPABASE_URL } from '@/lib/api/supabase-functions'

/** Design-system preview: skips session + match API and submit navigation. */
export type SetupDisplayPreviewScreen =
  | 'form'
  | 'review'
  | 'confirmation'
  | 'match_join_prompt'
  | 'session_prompt'

export interface SetupDisplayPreviewConfig {
  /**
   * `form` / `review`: `MatchSetupForm` states.
   * `confirmation`: shared pre-game confirmation (player flow).
   * `match_join_prompt` / `session_prompt`: same modals as production (`SessionProtectionPrompt`).
   */
  screen: SetupDisplayPreviewScreen
}

interface SetupDisplayProps {
  courtId: string
  courtSlug: string
  /** Display label for confirmation header (falls back to branding court name). */
  courtName?: string
  branding?: VenueBranding | null
  /** When set, skips network/session loading for design system previews. */
  preview?: SetupDisplayPreviewConfig
}

const PREVIEW_FORM_PLAYERS = ['', '', '', '']
const PREVIEW_REVIEW_PLAYERS = ['Glen Noble', 'Rob Anderson', 'Julian Waters', 'Carl Pettit']

function initialPlayersFromPreview(preview: SetupDisplayPreviewConfig | undefined): string[] {
  if (!preview) return ['', '', '', '']
  return preview.screen === 'review' ? [...PREVIEW_REVIEW_PLAYERS] : [...PREVIEW_FORM_PLAYERS]
}

function previewConfirmationMatch(): MatchState {
  return {
    id: 'preview-match',
    court_id: 'preview-court',
    version: 1,
    game_mode: 'golden_point',
    sets_to_win: 1,
    tiebreak_at: 6,
    status: 'setup',
    current_set: 1,
    is_tiebreak: false,
    team_a_points: 0,
    team_b_points: 0,
    team_a_games: 0,
    team_b_games: 0,
    set_scores: [],
    deuce_count: 0,
    serving_team: 'a',
    team_a_player_1: PREVIEW_REVIEW_PLAYERS[0],
    team_a_player_2: PREVIEW_REVIEW_PLAYERS[1],
    team_b_player_1: PREVIEW_REVIEW_PLAYERS[2],
    team_b_player_2: PREVIEW_REVIEW_PLAYERS[3],
    winner: null,
    started_at: null,
    side_swap_enabled: true,
    session_id: 'preview-session',
  }
}

async function fetchActiveMatchForCourt(courtId: string): Promise<MatchState | null> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
    method: 'POST',
    headers: supabaseFunctionHeaders(),
    body: JSON.stringify({ action: 'status', court_id: courtId }),
  })
  const data = await response.json()
  if (data.success && data.match) return data.match as MatchState
  return null
}

function storedSessionMatchesSetupMatch(
  match: MatchState,
  courtSlug: string
): boolean {
  if (match.status !== 'setup' || !match.session_id) return false
  if (typeof window === 'undefined') return false
  const stored = sessionStorage.getItem(`setup_session_id_${courtSlug}`)
  return Boolean(stored && stored === match.session_id)
}

export default function SetupDisplay({
  courtId,
  courtSlug,
  courtName: courtNameProp,
  branding,
  preview,
}: SetupDisplayProps) {
  const isPreview = Boolean(preview)
  const router = useRouter()
  const displayCourtName = courtNameProp ?? branding?.courtName ?? 'Court 1'

  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(() => !isPreview)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showSetupForm, setShowSetupForm] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(() => !isPreview)
  const [activeSession, setActiveSession] = useState<{
    minutes_active?: number
    minutes_since_activity?: number
    games_count?: number
  } | null>(null)
  const [showProtectionPrompt, setShowProtectionPrompt] = useState(false)
  const [showActiveMatchJoinPrompt, setShowActiveMatchJoinPrompt] = useState(false)
  /** Why the court take-over prompt is shown (drives abandon + fresh form vs abandon + retry create). */
  const [courtTakeoverReason, setCourtTakeoverReason] = useState<
    'load' | 'create_conflict' | null
  >(null)
  const pendingCreateBodyRef = useRef<Record<string, unknown> | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const [confirmationMatch, setConfirmationMatch] = useState<MatchState | null>(null)
  /** When set, next submit uses `update_setup` for this match id (after create or edit from confirmation). */
  const [playerSetupMatchId, setPlayerSetupMatchId] = useState<string | null>(null)

  const [gameMode, setGameMode] = useState<GameMode>('traditional')
  const [setsToWin, setSetsToWin] = useState<1 | 2>(1)
  const [players, setPlayers] = useState<string[]>(() => initialPlayersFromPreview(preview))
  const [sideSwapEnabled, setSideSwapEnabled] = useState(true)
  const [endGameInTiebreak, setEndGameInTiebreak] = useState(true)
  const [tempMatchId] = useState(() => generateUuid())
  const [playerPhotos, setPlayerPhotos] = useState<PlayerPhotosState>(EMPTY_PLAYER_PHOTOS)

  const { match: liveCourtMatch } = useLiveMatch<MatchState>(isPreview ? null : courtId, {
    enablePolling: false,
  })

  const handlePlayerPhotoChange = useCallback(
    (key: keyof PlayerPhotosState, url: string | null) => {
      setPlayerPhotos((prev) => ({ ...prev, [key]: url }))
    },
    []
  )

  const clearSetupDraftStorage = useCallback(() => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(`setup_players_${courtId}`)
    sessionStorage.removeItem(`setup_game_mode_${courtId}`)
    sessionStorage.removeItem(`setup_sets_${courtId}`)
    sessionStorage.removeItem(`setup_side_swap_${courtId}`)
    sessionStorage.removeItem(`setup_tiebreak_${courtId}`)
    sessionStorage.removeItem(`setup_photos_${courtId}`)
  }, [courtId])

  const resetFreshSetupFormState = useCallback(() => {
    setPlayers(['', '', '', ''])
    setPlayerPhotos({ ...EMPTY_PLAYER_PHOTOS })
    setGameMode('traditional')
    setSetsToWin(1)
    setSideSwapEnabled(true)
    setEndGameInTiebreak(true)
    setPlayerSetupMatchId(null)
    setConfirmationMatch(null)
    setError(null)
    clearSetupDraftStorage()
  }, [clearSetupDraftStorage])

  const finalizeMatchSaveSuccess = useCallback(
    (m: MatchState) => {
      setPlayerSetupMatchId(m.id)
      clearSetupDraftStorage()
      setConfirmationMatch(m)
      setError(null)
    },
    [clearSetupDraftStorage]
  )

  const ensureSetupSession = useCallback(async () => {
    const storageKey = `setup_session_id_${courtSlug}`
    let hasValidStoredSession = false
    if (typeof window !== 'undefined') {
      const existingSessionId = sessionStorage.getItem(storageKey)
      if (existingSessionId) {
        const validation = await validateSession(existingSessionId)
        if (validation.valid) {
          setCurrentSessionId(existingSessionId)
          hasValidStoredSession = true
        } else {
          sessionStorage.removeItem(storageKey)
        }
      }
    }

    if (!hasValidStoredSession) {
      const result = await checkSession(courtId)
      if (result.has_active_session && result.session) {
        setActiveSession(result.session)
        setShowProtectionPrompt(true)
      } else {
        const createResult = await createSession(courtId)
        if (createResult.success && createResult.session) {
          setCurrentSessionId(createResult.session.id)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(storageKey, createResult.session.id)
          }
        }
      }
    }
  }, [courtId, courtSlug])

  useEffect(() => {
    if (isPreview || !confirmationMatch) return
    const id = confirmationMatch.id
    const row = liveCourtMatch
    if (row && row.id === id && row.status === 'in_progress') {
      router.push(`/playing/${courtSlug}`)
    }
  }, [isPreview, confirmationMatch, liveCourtMatch, courtSlug, router])

  useEffect(() => {
    if (isPreview) {
      setLoading(false)
      setSessionLoading(false)
      return
    }
    async function loadData() {
      try {
        const existing = await fetchActiveMatchForCourt(courtId)
        const blocksSetup =
          existing &&
          (existing.status === 'setup' || existing.status === 'in_progress')
        if (blocksSetup) {
          if (storedSessionMatchesSetupMatch(existing, courtSlug)) {
            setPlayerSetupMatchId(existing.id)
            setConfirmationMatch(existing)
          } else {
            setActiveMatch(existing)
            setCourtTakeoverReason('load')
            setShowActiveMatchJoinPrompt(true)
            setSessionLoading(false)
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.error('Error loading match:', err)
      }

      try {
        await ensureSetupSession()
      } catch (sessionErr) {
        console.error('Error checking session:', sessionErr)
      } finally {
        setSessionLoading(false)
      }

      try {
        setShowSetupForm(true)
        if (typeof window !== 'undefined') {
          const savedPlayers = sessionStorage.getItem(`setup_players_${courtId}`)
          const savedGameMode = sessionStorage.getItem(`setup_game_mode_${courtId}`)
          const savedSets = sessionStorage.getItem(`setup_sets_${courtId}`)
          const savedSideSwap = sessionStorage.getItem(`setup_side_swap_${courtId}`)
          const savedTiebreak = sessionStorage.getItem(`setup_tiebreak_${courtId}`)
          const savedPhotos = sessionStorage.getItem(`setup_photos_${courtId}`)
          if (savedPlayers) {
            try {
              const parsed = JSON.parse(savedPlayers)
              if (Array.isArray(parsed) && parsed.length === 4) setPlayers(parsed)
            } catch {
              /* ignore */
            }
          }
          if (savedPhotos) {
            try {
              const parsed = JSON.parse(savedPhotos) as Partial<PlayerPhotosState>
              if (parsed && typeof parsed === 'object') {
                setPlayerPhotos({ ...EMPTY_PLAYER_PHOTOS, ...parsed })
              }
            } catch {
              /* ignore */
            }
          }
          if (savedGameMode && ['golden_point', 'silver_point', 'traditional'].includes(savedGameMode)) {
            setGameMode(savedGameMode as GameMode)
          }
          if (savedSets) setSetsToWin(Number(savedSets) as 1 | 2)
          if (savedSideSwap) setSideSwapEnabled(JSON.parse(savedSideSwap))
          if (savedTiebreak !== null) setEndGameInTiebreak(JSON.parse(savedTiebreak))
        }
      } catch (err) {
        console.error('Error restoring setup form:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courtId, courtSlug, isPreview, ensureSetupSession])

  const prefillFromMatch = useCallback((m: MatchState) => {
    setPlayers([
      m.team_a_player_1 ?? '',
      m.team_a_player_2 ?? '',
      m.team_b_player_1 ?? '',
      m.team_b_player_2 ?? '',
    ])
    setPlayerPhotos({
      team_a_player_1_photo: m.team_a_player_1_photo ?? null,
      team_a_player_2_photo: m.team_a_player_2_photo ?? null,
      team_b_player_1_photo: m.team_b_player_1_photo ?? null,
      team_b_player_2_photo: m.team_b_player_2_photo ?? null,
    })
    setGameMode(m.game_mode)
    setSetsToWin((m.sets_to_win === 2 ? 2 : 1) as 1 | 2)
    setSideSwapEnabled(m.side_swap_enabled ?? true)
    setEndGameInTiebreak((m.tiebreak_at ?? 6) === 6)
  }, [])

  const handleCancelSetup = () => {
    if (isPreview) return
    pendingCreateBodyRef.current = null
    setCourtTakeoverReason(null)
    window.history.back()
  }

  const handleTakeOverCourtMatch = async () => {
    if (isPreview || !courtId || !activeMatch) return
    const reason = courtTakeoverReason
    const bodyToRetry =
      reason === 'create_conflict' && pendingCreateBodyRef.current
        ? { ...pendingCreateBodyRef.current }
        : null

    setActionLoading('court-takeover')
    setError(null)
    try {
      const endRes = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
        body: JSON.stringify({
          action: 'end',
          court_id: courtId,
          reason: 'abandoned',
        }),
      })
      const endData = await endRes.json()
      if (!endData.success) {
        setError(
          typeof endData.error === 'string'
            ? endData.error
            : 'Could not clear the court.'
        )
        return
      }

      if (reason === 'create_conflict') {
        pendingCreateBodyRef.current = null
      }

      setShowActiveMatchJoinPrompt(false)
      setActiveMatch(null)
      setCourtTakeoverReason(null)

      if (bodyToRetry) {
        setActionLoading('create')
        const retryRes = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
          method: 'POST',
          headers: supabaseFunctionHeaders(),
          body: JSON.stringify(bodyToRetry),
        })
        const retryData = await retryRes.json()
        if (retryData.success && retryData.match) {
          finalizeMatchSaveSuccess(retryData.match as MatchState)
        } else if (retryData.error === 'active_match_exists') {
          const m = await fetchActiveMatchForCourt(courtId)
          pendingCreateBodyRef.current = { ...bodyToRetry }
          if (m) {
            setActiveMatch(m)
            setCourtTakeoverReason('create_conflict')
            setShowActiveMatchJoinPrompt(true)
          }
          setError(
            typeof retryData.error === 'string'
              ? retryData.error
              : 'Another match appeared on this court. Take over again to continue.'
          )
        } else {
          setError(
            typeof retryData.error === 'string'
              ? retryData.error
              : 'Could not create your match after taking over.'
          )
        }
        return
      }

      resetFreshSetupFormState()
      setShowSetupForm(true)
      await ensureSetupSession()
    } catch (err) {
      console.error('Error taking over court:', err)
      setError('Could not take over this court.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleTakeover = async () => {
    if (isPreview) return
    if (!courtId) return
    setActionLoading('takeover')
    setError(null)
    try {
      const result = await takeoverSession(courtId)
      if (result.success && result.session) {
        setCurrentSessionId(result.session.id)
        setShowProtectionPrompt(false)
        setActiveSession(null)
        setActiveMatch(null)
        setShowSetupForm(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`setup_session_id_${courtSlug}`, result.session.id)
        }
      } else {
        setError(result.error || 'Failed to take over')
      }
    } catch (err) {
      console.error('Error taking over session:', err)
      setError('Failed to take over session')
    } finally {
      setActionLoading(null)
    }
  }

  function handlePlayerChange(index: number, value: string) {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
  }

  function handleRandomize() {
    const { players: nextPlayers, playerPhotos: nextPhotos } = shufflePlayersWithPhotos(
      players,
      playerPhotos
    )
    setPlayers(nextPlayers)
    setPlayerPhotos(nextPhotos)
  }

  const handleEditFromConfirmation = () => {
    if (isPreview) return
    if (!confirmationMatch) return
    prefillFromMatch(confirmationMatch)
    setPlayerSetupMatchId(confirmationMatch.id)
    setConfirmationMatch(null)
    setShowSetupForm(true)
    setError(null)
  }

  async function handleContinueFromForm() {
    if (isPreview) return
    if (!courtId) return
    setActionLoading('create')
    setError(null)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`setup_players_${courtId}`, JSON.stringify(players))
      sessionStorage.setItem(`setup_game_mode_${courtId}`, gameMode)
      sessionStorage.setItem(`setup_sets_${courtId}`, setsToWin.toString())
      sessionStorage.setItem(`setup_side_swap_${courtId}`, JSON.stringify(sideSwapEnabled))
      sessionStorage.setItem(`setup_tiebreak_${courtId}`, JSON.stringify(endGameInTiebreak))
      sessionStorage.setItem(`setup_photos_${courtId}`, JSON.stringify(playerPhotos))
      sessionStorage.setItem(`setup_session_id_${courtSlug}`, currentSessionId || '')
    }

    const updating = !!playerSetupMatchId
    const body: Record<string, unknown> = {
      court_id: courtId,
      game_mode: gameMode,
      sets_to_win: setsToWin,
      side_swap_enabled: sideSwapEnabled,
      tiebreak_at: endGameInTiebreak ? 6 : 6,
    }
    if (players[0]?.trim()) body.team_a_player_1 = players[0].trim()
    if (players[1]?.trim()) body.team_a_player_2 = players[1].trim()
    if (players[2]?.trim()) body.team_b_player_1 = players[2].trim()
    if (players[3]?.trim()) body.team_b_player_2 = players[3].trim()
    body.team_a_player_1_photo = playerPhotos.team_a_player_1_photo
    body.team_a_player_2_photo = playerPhotos.team_a_player_2_photo
    body.team_b_player_1_photo = playerPhotos.team_b_player_1_photo
    body.team_b_player_2_photo = playerPhotos.team_b_player_2_photo

    if (updating) {
      body.action = 'update_setup'
      body.match_id = playerSetupMatchId
    } else {
      body.action = 'create'
      body.session_id = currentSessionId || undefined
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match`, {
        method: 'POST',
        headers: supabaseFunctionHeaders(),
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!data.success) {
        if (data.error === 'active_match_exists') {
          const m = await fetchActiveMatchForCourt(courtId)
          if (m && storedSessionMatchesSetupMatch(m, courtSlug)) {
            setPlayerSetupMatchId(m.id)
            setConfirmationMatch(m)
            setActiveMatch(null)
            setShowActiveMatchJoinPrompt(false)
            setCourtTakeoverReason(null)
            setError(null)
          } else if (m) {
            if (body.action === 'create') {
              pendingCreateBodyRef.current = { ...body }
              setCourtTakeoverReason('create_conflict')
            } else {
              pendingCreateBodyRef.current = null
              setCourtTakeoverReason('load')
            }
            setActiveMatch(m)
            setShowActiveMatchJoinPrompt(true)
            setError(null)
          } else {
            setError('A match is already in progress on this court. Try Take Over to clear it.')
          }
        } else {
          setError(typeof data.error === 'string' ? data.error : 'Failed to save match')
        }
      } else if (data.match) {
        finalizeMatchSaveSuccess(data.match as MatchState)
      }
    } catch (err) {
      console.error('Error saving match:', err)
      setError('Failed to save match')
    } finally {
      setActionLoading(null)
    }
  }

  if (isPreview && preview) {
    if (preview.screen === 'match_join_prompt') {
      return (
        <SessionProtectionPrompt
          title="Court in Use"
          warning="Another match is using this court. Take over to start fresh."
          onCancel={() => {}}
          onTakeover={() => {}}
        />
      )
    }
    if (preview.screen === 'session_prompt') {
      return <SessionProtectionPrompt onCancel={() => {}} onTakeover={() => {}} />
    }
    if (preview.screen === 'confirmation') {
      return (
        <MatchConfirmation
          match={previewConfirmationMatch()}
          branding={branding ?? null}
          courtName={displayCourtName}
          idleFooterLayout
          readyStateFooter={<PlayingReadyHero onEditMatch={() => {}} editDisabled />}
        />
      )
    }
  }

  if (loading || sessionLoading) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p className="page-loading-message">
            {sessionLoading ? (
              <>
                check court
                <br />
                availability
              </>
            ) : (
              'Loading...'
            )}
          </p>
        </div>
      </div>
    )
  }

  if (showActiveMatchJoinPrompt && activeMatch) {
    return (
      <SessionProtectionPrompt
        title="Court in Use"
        warning="Another match is using this court. Take over to clear it and continue."
        takeOverLabel="Take Over"
        takeOverLoading={actionLoading === 'court-takeover' || actionLoading === 'create'}
        error={error}
        onCancel={handleCancelSetup}
        onTakeover={handleTakeOverCourtMatch}
      />
    )
  }

  if (showProtectionPrompt && activeSession) {
    return (
      <SessionProtectionPrompt
        takeOverLoading={actionLoading === 'takeover'}
        onCancel={handleCancelSetup}
        onTakeover={handleTakeover}
      />
    )
  }

  if (error && !activeMatch && !showSetupForm && !confirmationMatch) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <Header branding={branding} />
        <div className="page-loading" style={{ flex: 1, marginTop: '0px', paddingTop: '20px' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--error)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (confirmationMatch) {
    return (
      <MatchConfirmation
        match={confirmationMatch}
        branding={branding ?? null}
        courtName={displayCourtName}
        error={error}
        idleFooterLayout
        readyStateFooter={
          <PlayingReadyHero
            onEditMatch={handleEditFromConfirmation}
            editDisabled={!!actionLoading}
          />
        }
      />
    )
  }

  return (
    <MatchSetupForm
      gameMode={gameMode}
      setGameMode={setGameMode}
      setsToWin={setsToWin}
      setSetsToWin={setSetsToWin}
      players={players}
      onPlayerChange={handlePlayerChange}
      onRandomize={handleRandomize}
      tempMatchId={tempMatchId}
      playerPhotos={playerPhotos}
      onPlayerPhotoChange={handlePlayerPhotoChange}
      sideSwapEnabled={sideSwapEnabled}
      setSideSwapEnabled={setSideSwapEnabled}
      endGameInTiebreak={endGameInTiebreak}
      setEndGameInTiebreak={setEndGameInTiebreak}
      onSubmit={handleContinueFromForm}
      submitLoading={actionLoading === 'create'}
      error={error}
      showHeader
      branding={branding}
    />
  )
}
