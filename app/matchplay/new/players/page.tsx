'use client'

import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useMatchplaySetupBranding } from '@/lib/hooks/useMatchplaySetupBranding'
import { supabase, getMatchplayVenueId } from '@/lib/supabase'
import { MATCHPLAY_AMERICANO_PLAYER_OPTIONS } from '@/lib/matchplay-americano-setup'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SESSION_KEY = 'matchplay_setup'

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

function CameraIcon({ className = 'setup-photo-trigger-svg' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

interface MatchplaySetupSession {
  playerCount: number
  selectedCourts: number[]
  pointsPerMatch: number
  rounds: number
  format: string
}

interface PlayerSlot {
  name: string
  photoBlob: Blob | null
  photoPreview: string | null
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

function generateEventName(): string {
  const d = new Date()
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' Americano'
}

export default function MatchplayPlayersPage() {
  const router = useRouter()
  const branding = useMatchplaySetupBranding()
  const photoPickSlotRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [processingSlot, setProcessingSlot] = useState<number | null>(null)

  const [config, setConfig] = useState<MatchplaySetupSession | null>(null)
  const [players, setPlayers] = useState<PlayerSlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)

  useEffect(() => {
    void getMatchplayVenueId().then(setVenueId)
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) {
      router.replace('/matchplay/new')
      return
    }
    try {
      const parsed = JSON.parse(stored) as MatchplaySetupSession
      const allowed = MATCHPLAY_AMERICANO_PLAYER_OPTIONS as readonly number[]
      if (
        typeof parsed.playerCount !== 'number' ||
        !allowed.includes(parsed.playerCount) ||
        !Array.isArray(parsed.selectedCourts)
      ) {
        router.replace('/matchplay/new')
        return
      }
      setConfig(parsed)
      setPlayers(
        Array.from({ length: parsed.playerCount }, () => ({
          name: '',
          photoBlob: null,
          photoPreview: null,
        }))
      )
    } catch {
      router.replace('/matchplay/new')
    }
  }, [router])

  const filledCount = players.filter((p) => p.name.trim()).length
  const canStart = config !== null && filledCount === config.playerCount

  const handleNameChange = (index: number, name: string) => {
    setPlayers((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], name }
      return updated
    })
  }

  const openPhotoPicker = (index: number) => {
    photoPickSlotRef.current = index
    fileInputRef.current?.click()
  }

  const clearSlotPhoto = (index: number) => {
    setPlayers((prev) => {
      const updated = [...prev]
      const cur = updated[index]
      if (cur?.photoPreview?.startsWith('blob:')) URL.revokeObjectURL(cur.photoPreview)
      updated[index] = { ...updated[index], photoBlob: null, photoPreview: null }
      return updated
    })
  }

  const applyFileToSlot = useCallback(async (slot: number, file: File) => {
    setProcessingSlot(slot)
    try {
      const blob = await processImageToJpeg(file, 400, 400)
      const previewUrl = URL.createObjectURL(blob)
      setPlayers((prev) => {
        const updated = [...prev]
        const prevPreview = updated[slot]?.photoPreview
        if (prevPreview?.startsWith('blob:')) URL.revokeObjectURL(prevPreview)
        updated[slot] = {
          ...updated[slot],
          photoBlob: blob,
          photoPreview: previewUrl,
        }
        return updated
      })
    } catch (e) {
      console.error(e)
      setError('Could not process photo')
    } finally {
      setProcessingSlot(null)
    }
  }, [])

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const slot = photoPickSlotRef.current
    photoPickSlotRef.current = null
    if (!file || slot === null) return
    await applyFileToSlot(slot, file)
  }

  const handleRemovePhoto = (index: number, ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    clearSlotPhoto(index)
  }
  const handleStartEvent = async () => {
    if (!config || !canStart) return

    setIsSubmitting(true)
    setError(null)

    try {
      const vid = venueId ?? (await getMatchplayVenueId())
      if (!vid) {
        throw new Error('No venue configured for matchplay')
      }

      const courtLabels = config.selectedCourts.map((c) => `Court ${c}`)

      const createResult = await callMatchplayEvent({
        action: 'create',
        venue_id: vid,
        name: generateEventName(),
        format: config.format,
        scoring_type: 'raw_points',
        court_count: config.selectedCourts.length,
        court_labels: courtLabels,
        match_format: 'first_to_points',
        match_target_score: config.pointsPerMatch,
        win_points: 0,
        draw_points: 0,
        loss_points: 0,
      })

      if (!createResult.event) {
        throw new Error(createResult.error || 'Failed to create event')
      }

      const eventId = createResult.event.id as string

      for (let i = 0; i < players.length; i++) {
        const player = players[i]
        const addResult = await callMatchplayPlayer({
          action: 'add',
          event_id: eventId,
          name: player.name.trim(),
        })
        if (!addResult.success || !addResult.player?.id) {
          throw new Error(addResult.error || 'Failed to add player')
        }
        const playerId = addResult.player.id as string

        if (player.photoBlob) {
          const photoPath = `matchplay/${eventId}/${playerId}.jpg`
          const { error: uploadError } = await supabase.storage
            .from('player-photos')
            .upload(photoPath, player.photoBlob, {
              contentType: 'image/jpeg',
              upsert: true,
            })

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from('player-photos').getPublicUrl(photoPath)

            const upd = await callMatchplayPlayer({
              action: 'update',
              player_id: playerId,
              photo_url: publicUrl,
            })
            if (!upd.success) {
              throw new Error(upd.error || 'Failed to save photo URL')
            }
          }
        }
      }

      try {
        sessionStorage.removeItem(SESSION_KEY)
      } catch {
        /* ignore */
      }

      router.push(`/matchplay/${eventId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      setIsSubmitting(false)
    }
  }

  const brandVars =
    branding?.primaryColor != null
      ? ({
          '--brand-primary': branding.primaryColor,
        } as CSSProperties)
      : undefined

  if (!config) {
    return (
      <div className="matchplay-page matchplay-page--setup" style={brandVars}>
        <p className="matchplay-loading">Loading…</p>
      </div>
    )
  }

  return (
    <div className="matchplay-page matchplay-page--setup" style={brandVars}>
      <div className="matchplay-page-header">
        <button type="button" onClick={() => router.back()} className="matchplay-back-btn">
          ← Back
        </button>
        <h1 className="matchplay-page-title">Players</h1>
        <span className="matchplay-header-badge">
          {filledCount} of {config.playerCount}
        </span>
      </div>

      <div className="matchplay-setup-inner">
        <div className="matchplay-setup-content">
          <div className="matchplay-card">
            <span className="matchplay-card-label">Add Players</span>
            <div className="setup-inputs">
              {players.map((player, index) => {
                const busy = processingSlot === index
                return (
                  <div key={index} className="setup-player-row">
                    {player.photoPreview ? (
                      <div className="setup-photo-circle-wrap">
                        <button
                          type="button"
                          className="setup-photo-thumb"
                          onClick={() => openPhotoPicker(index)}
                          disabled={busy}
                          aria-label={busy ? 'Processing photo' : 'Change photo'}
                        >
                          {busy ? (
                            <span className="setup-photo-thumb-loading">…</span>
                          ) : (
                            <img src={player.photoPreview} alt="" />
                          )}
                        </button>
                        {!busy ? (
                          <button
                            type="button"
                            className="setup-photo-remove"
                            onClick={(e) => handleRemovePhoto(index, e)}
                            aria-label="Remove photo"
                          >
                            <span aria-hidden>×</span>
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="setup-photo-trigger"
                        onClick={() => openPhotoPicker(index)}
                        disabled={busy}
                        aria-label={busy ? 'Processing photo' : 'Add player photo'}
                      >
                        {busy ? <span className="setup-photo-thumb-loading">…</span> : <CameraIcon />}
                      </button>
                    )}

                  <div className="setup-input-wrap setup-input-wrap--player-name">
                    <input
                      type="text"
                      className="setup-input"
                      placeholder={`Player ${index + 1}`}
                      value={player.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                </div>
                )
              })}
            </div>
          </div>

          {error ? <p className="matchplay-error">{error}</p> : null}
        </div>
      </div>

      <footer className="matchplay-footer">
        <button
          type="button"
          className="matchplay-btn-primary"
          onClick={() => void handleStartEvent()}
          disabled={!canStart || isSubmitting}
        >
          {isSubmitting ? 'Creating Event…' : 'Start Event'}
        </button>
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="setup-photo-file-input"
        onChange={(e) => void handlePhotoFileChange(e)}
      />
    </div>
  )
}
