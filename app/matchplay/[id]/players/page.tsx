'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateAmericanoPairings, getMatchplayTotalRoundsFromStorage } from '@/lib/matchplay-americano-pairings'
import { formatPlayerName, getPlayerInitials } from '@/lib/utils/name-format'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface MatchplayEvent {
  id: string
  status: string
  court_count?: number
  court_labels?: string[]
}

interface MatchplayRound {
  id: string
  round_number: number
  status: string
  matches?: { status: string }[]
}

interface PlayerRow {
  id: string
  name: string
  photo_url?: string | null
}

async function callMatchplayRound(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/matchplay-round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function callMatchplayPlayer(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/matchplay-player`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function callMatchplayEvent(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/matchplay-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

function processImageToJpeg(file: File, maxWidth: number, maxHeight: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      canvas.width = maxWidth
      canvas.height = maxHeight
      const size = Math.min(img.width, img.height)
      const x = (img.width - size) / 2
      const y = (img.height - size) / 2
      ctx.drawImage(img, x, y, size, size, 0, 0, maxWidth, maxHeight)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas to blob failed'))),
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }
    img.src = objectUrl
  })
}

export default function MatchplayEventPlayersPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<MatchplayEvent | null>(null)
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activePhotoPlayer, setActivePhotoPlayer] = useState<string | null>(null)

  const getCourtLabels = useCallback(() => {
    const labels = event?.court_labels
    if (labels && labels.length > 0) return labels
    const count = event?.court_count ?? 2
    return Array.from({ length: count }, (_, i) => `Court ${i + 1}`)
  }, [event])

  const fetchRoundsWithMatches = useCallback(async (): Promise<MatchplayRound[]> => {
    const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
    const list = (listResult.rounds ?? []) as MatchplayRound[]
    const withMatches = await Promise.all(
      list.map(async (r) => {
        const getResult = await callMatchplayRound({ action: 'get_round', round_id: r.id })
        return { ...r, matches: getResult.round?.matches ?? [] } as MatchplayRound
      })
    )
    return withMatches.sort((a, b) => (a.round_number ?? 0) - (b.round_number ?? 0))
  }, [eventId])

  const refreshPlayers = useCallback(async () => {
    const result = await callMatchplayPlayer({ action: 'list', event_id: eventId })
    const list = (result.players ?? []) as PlayerRow[]
    setPlayers(list)
    return list
  }, [eventId])

  const regenerateFutureRounds = useCallback(
    async (playerIds: string[]) => {
      if (!eventId || !event) return
      const rounds = await fetchRoundsWithMatches()
      const currentRound = rounds.find((r) => r.status !== 'completed')
      const currentRoundNum = event.status === 'setup' ? 0 : (currentRound?.round_number ?? 0)
      const futureRounds = rounds.filter((r) => (r.round_number ?? 0) > currentRoundNum)

      for (const r of futureRounds) {
        const hasCompleted = (r.matches ?? []).some((m) => m.status === 'completed')
        if (hasCompleted) continue
        await callMatchplayRound({ action: 'delete_round', round_id: r.id })
      }
      if (event.status === 'setup') {
        for (const r of rounds) {
          const hasCompleted = (r.matches ?? []).some((m) => m.status === 'completed')
          if (!hasCompleted) await callMatchplayRound({ action: 'delete_round', round_id: r.id })
        }
      }

      const listResult = await callMatchplayRound({ action: 'list_rounds', event_id: eventId })
      const remaining = (listResult.rounds ?? []) as { round_number?: number }[]
      const existingNumbers = new Set(remaining.map((r) => r.round_number ?? 0))

      const courtLabels = getCourtLabels()
      if (playerIds.length < 4) {
        await fetchRoundsWithMatches()
        return
      }

      const allPairings = generateAmericanoPairings(playerIds, courtLabels)
      const cap = getMatchplayTotalRoundsFromStorage()
      const pairings = allPairings.slice(0, Math.min(allPairings.length, cap))

      for (const p of pairings) {
        if (existingNumbers.has(p.roundNumber)) continue
        const shouldCreate = event.status === 'setup' || p.roundNumber > currentRoundNum
        if (!shouldCreate) continue

        const result = await callMatchplayRound({
          action: 'create_round',
          event_id: eventId,
          round_number: p.roundNumber,
          matches: p.matches,
        })
        if (result.round) existingNumbers.add(p.roundNumber)
        else if (result.error?.includes('duplicate') || result.error?.includes('unique')) {
          existingNumbers.add(p.roundNumber)
        }
      }
      await fetchRoundsWithMatches()
    },
    [event, eventId, fetchRoundsWithMatches, getCourtLabels]
  )

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    async function init() {
      setLoading(true)
      setError(null)
      const evResult = await callMatchplayEvent({ action: 'get', event_id: eventId })
      if (cancelled) return
      if (evResult.event) setEvent(evResult.event)
      else {
        setError('Event not found')
        setLoading(false)
        return
      }
      try {
        await refreshPlayers()
        await fetchRoundsWithMatches()
      } catch {
        if (!cancelled) setError('Failed to load players')
      }
      if (!cancelled) setLoading(false)
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [eventId, fetchRoundsWithMatches, refreshPlayers])

  const handleAddPlayer = async () => {
    if (!eventId || !newPlayerName.trim()) return
    setIsAdding(true)
    setError(null)
    const result = await callMatchplayPlayer({ action: 'add', event_id: eventId, name: newPlayerName.trim() })
    if (result.player) {
      setNewPlayerName('')
      const list = await refreshPlayers()
      await regenerateFutureRounds(list.map((p) => p.id))
    } else {
      setError(result.error || 'Failed to add player')
    }
    setIsAdding(false)
  }

  const handleRemovePlayer = async (playerId: string) => {
    setRemovingId(playerId)
    setError(null)
    const result = await callMatchplayPlayer({ action: 'remove', player_id: playerId })
    if (result.success) {
      const list = await refreshPlayers()
      await regenerateFutureRounds(list.map((p) => p.id))
    } else {
      setError(result.error || 'Failed to remove player')
    }
    setRemovingId(null)
  }

  const handlePhotoClick = (playerId: string) => {
    setActivePhotoPlayer(playerId)
    fileInputRef.current?.click()
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !activePhotoPlayer || !eventId) {
      setActivePhotoPlayer(null)
      return
    }

    const playerId = activePhotoPlayer
    setActivePhotoPlayer(null)
    setUploadingPhotoId(playerId)
    setError(null)

    try {
      const processedBlob = await processImageToJpeg(file, 400, 400)
      const filename = `matchplay-events/${eventId}/${playerId}-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('player-photos').upload(filename, processedBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      })
      if (upErr) throw upErr

      const {
        data: { publicUrl },
      } = supabase.storage.from('player-photos').getPublicUrl(filename)

      const updateResult = await callMatchplayPlayer({
        action: 'update',
        player_id: playerId,
        photo_url: publicUrl,
      })
      if (!updateResult.success && !updateResult.player) {
        throw new Error(updateResult.error || 'Failed to update photo')
      }
      await refreshPlayers()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploadingPhotoId(null)
    }
  }

  if (loading) {
    return (
      <div className="matchplay-page matchplay-page--setup">
        <div className="matchplay-loading">Loading players...</div>
      </div>
    )
  }

  return (
    <div className="matchplay-page matchplay-page--setup">
      <header className="matchplay-page-header">
        <button type="button" onClick={() => router.back()} className="matchplay-back-btn">
          ← Back
        </button>
        <h1 className="matchplay-page-title">Players</h1>
        <span className="matchplay-header-badge">{players.length}</span>
      </header>

      <div className="matchplay-setup-inner matchplay-players-content">
        {error && <div className="matchplay-error">{error}</div>}

        <div className="matchplay-player-add-row">
          <input
            type="text"
            className="setup-input"
            placeholder="Add player name..."
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleAddPlayer()}
            disabled={!newPlayerName.trim() || isAdding}
          >
            {isAdding ? '...' : 'Add'}
          </button>
        </div>

        <div className="matchplay-players-list">
          {players.map((player) => (
            <div key={player.id} className="matchplay-player-row">
              <button
                type="button"
                className={`matchplay-player-avatar ${player.photo_url ? 'matchplay-player-avatar--has-photo' : ''}`}
                onClick={() => handlePhotoClick(player.id)}
                disabled={uploadingPhotoId === player.id}
                aria-label={player.photo_url ? 'Change photo' : 'Add photo'}
              >
                {player.photo_url ? (
                  <img src={player.photo_url} alt="" />
                ) : (
                  <span className="matchplay-player-initials">{getPlayerInitials(player.name)}</span>
                )}
              </button>

              <span className="matchplay-player-name">{formatPlayerName(player.name, 'full')}</span>

              <button
                type="button"
                className="matchplay-player-remove"
                onClick={() => void handleRemovePlayer(player.id)}
                disabled={removingId === player.id}
                aria-label="Remove player"
              >
                {removingId === player.id ? '...' : '✕'}
              </button>
            </div>
          ))}

          {players.length === 0 && <p className="matchplay-players-empty">No players added yet</p>}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={(ev) => void handlePhotoSelect(ev)} hidden />
    </div>
  )
}
