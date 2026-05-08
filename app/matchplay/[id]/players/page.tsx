'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatPlayerName, getPlayerInitials } from '@/lib/utils/name-format'
import '@/app/styles/matchplay.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface Player {
  id: string
  name: string
  photo_url?: string | null
}

interface EventSummary {
  id: string
  status: string
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

export default function MatchplayPlayersPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<EventSummary | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPlayerId, setPhotoPlayerId] = useState<string | null>(null)
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventData, playersData] = await Promise.all([
        callMatchplayEvent({ action: 'get', event_id: eventId }),
        callMatchplayPlayer({ action: 'list', event_id: eventId }),
      ])

      if (eventData.success && eventData.event) {
        setEvent(eventData.event as EventSummary)
      } else {
        setEvent(null)
        setError(eventData.error || 'Event not found')
        setPlayers([])
        setLoading(false)
        return
      }

      if (playersData.success) {
        setPlayers((playersData.players ?? []) as Player[])
      } else {
        setError(playersData.error || 'Failed to load players')
      }
    } catch (err) {
      console.error('[Players] Load error:', err)
      setError('Failed to load players')
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    void loadData()
  }, [eventId, loadData])

  const handleStartEdit = (player: Player) => {
    if (event?.status === 'completed') return
    setEditingPlayerId(player.id)
    setEditingName(player.name)
  }

  const handleSaveName = async (playerId: string) => {
    const trimmedName = editingName.trim()
    if (!trimmedName) {
      setError('Name cannot be empty')
      return
    }

    setSavingId(playerId)
    setError(null)

    try {
      const data = await callMatchplayPlayer({
        action: 'update',
        player_id: playerId,
        name: trimmedName,
      })

      if (!data.success) {
        throw new Error(data.error || 'Failed to update name')
      }

      setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, name: trimmedName } : p)))
      setEditingPlayerId(null)
      setEditingName('')
    } catch (err) {
      console.error('[Players] Save name error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingPlayerId(null)
    setEditingName('')
  }

  const handlePhotoClick = (playerId: string) => {
    setPhotoPlayerId(playerId)
    fileInputRef.current?.click()
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const targetPlayerId = photoPlayerId
    e.target.value = ''

    if (!file || !targetPlayerId || !eventId) {
      setPhotoPlayerId(null)
      return
    }

    setUploadingPhotoId(targetPlayerId)
    setError(null)

    let previewUrl: string | null = null

    try {
      previewUrl = URL.createObjectURL(file)
      setPlayers((prev) => prev.map((p) => (p.id === targetPlayerId ? { ...p, photo_url: previewUrl! } : p)))

      const processedBlob = await processImageToJpeg(file, 400, 400)
      const filename = `matchplay-events/${eventId}/${targetPlayerId}-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('player-photos').upload(filename, processedBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      })
      if (upErr) throw upErr

      const {
        data: { publicUrl },
      } = supabase.storage.from('player-photos').getPublicUrl(filename)

      const data = await callMatchplayPlayer({
        action: 'update',
        player_id: targetPlayerId,
        photo_url: publicUrl,
      })

      if (data.success === false) {
        console.warn('[Players] Photo record update warning:', data.error)
      }

      setPlayers((prev) => prev.map((p) => (p.id === targetPlayerId ? { ...p, photo_url: publicUrl } : p)))
    } catch (err) {
      console.error('[Players] Photo upload error:', err)
      setError('Failed to upload photo')
      await loadData()
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploadingPhotoId(null)
      setPhotoPlayerId(null)
    }
  }

  if (loading) {
    return (
      <div className="matchplay-page matchplay-page--setup">
        <div className="matchplay-loading">Loading players...</div>
      </div>
    )
  }

  const isEditable = event?.status !== 'completed'

  return (
    <div className="matchplay-page matchplay-page--setup">
      <header className="matchplay-page-header">
        <button type="button" onClick={() => router.back()} className="matchplay-back-btn">
          ← Back
        </button>
        <h1 className="matchplay-page-title">Players</h1>
        <span className="matchplay-header-badge">{players.length}</span>
      </header>

      <div className="matchplay-players-content">
        {error ? (
          <div className="matchplay-players-error-banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="matchplay-players-error-dismiss" aria-label="Dismiss">
              ✕
            </button>
          </div>
        ) : null}

        {isEditable ? (
          <p className="matchplay-players-roster-hint">Tap a name to edit · Tap photo to change</p>
        ) : null}

        <div className="matchplay-players-list">
          {players.map((player, index) => (
            <div key={player.id} className="matchplay-player-row">
              <span className="matchplay-player-number">{index + 1}</span>

              <button
                type="button"
                className={`matchplay-player-avatar ${player.photo_url ? 'matchplay-player-avatar--has-photo' : ''} ${uploadingPhotoId === player.id ? 'matchplay-player-avatar--uploading' : ''}`}
                onClick={() => isEditable && handlePhotoClick(player.id)}
                disabled={!isEditable || uploadingPhotoId === player.id}
                aria-label={player.photo_url ? 'Change photo' : 'Add photo'}
              >
                {uploadingPhotoId === player.id ? (
                  <span className="matchplay-player-avatar-spinner" aria-hidden>
                    …
                  </span>
                ) : player.photo_url ? (
                  <img src={player.photo_url} alt="" />
                ) : (
                  <span className="matchplay-player-initials">{getPlayerInitials(player.name)}</span>
                )}
              </button>

              {editingPlayerId === player.id ? (
                <div className="matchplay-player-edit">
                  <input
                    type="text"
                    className="matchplay-player-edit-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSaveName(player.id)
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    autoFocus
                    disabled={savingId === player.id}
                  />
                  <div className="matchplay-player-edit-actions">
                    <button
                      type="button"
                      className="matchplay-player-edit-btn matchplay-player-edit-btn--cancel"
                      onClick={handleCancelEdit}
                      disabled={savingId === player.id}
                      aria-label="Cancel"
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      className="matchplay-player-edit-btn matchplay-player-edit-btn--save"
                      onClick={() => void handleSaveName(player.id)}
                      disabled={savingId === player.id || !editingName.trim()}
                      aria-label="Save"
                    >
                      {savingId === player.id ? '…' : '✓'}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="matchplay-player-name-btn" onClick={() => handleStartEdit(player)} disabled={!isEditable}>
                  {formatPlayerName(player.name, 'full')}
                </button>
              )}
            </div>
          ))}

          {players.length === 0 ? <p className="matchplay-players-empty">No players</p> : null}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={(ev) => void handlePhotoSelect(ev)} hidden />
    </div>
  )
}
