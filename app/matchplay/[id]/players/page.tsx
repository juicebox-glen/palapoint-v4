'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PLAYER_PHOTO_ACCEPT, processImageToJpeg } from '@/lib/images/process-image'
import { callMatchplayEvent, callMatchplayPlayer } from '@/lib/api/matchplay'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'

interface PlayerSnapshot {
  id: string
  name: string
  photo_url: string | null
}

type EditablePlayer = PlayerSnapshot & {
  photoBlob: Blob | null
  photoPreview: string | null
  photoRemoved: boolean
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

export default function MatchplayEventPlayersPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [eventStatus, setEventStatus] = useState<string | null>(null)
  const [originalPlayers, setOriginalPlayers] = useState<PlayerSnapshot[]>([])
  const [players, setPlayers] = useState<EditablePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [processingSlot, setProcessingSlot] = useState<number | null>(null)

  const originalById = useMemo(() => new Map(originalPlayers.map((p) => [p.id, p])), [originalPlayers])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventData, playersData] = await Promise.all([
        callMatchplayEvent({ action: 'get', event_id: eventId }),
        callMatchplayPlayer({ action: 'list', event_id: eventId }),
      ])

      if (eventData.success && eventData.event) {
        setEventStatus((eventData.event as { status: string }).status)
      } else {
        setEventStatus(null)
        setError((eventData.error as string) || 'Event not found')
        setOriginalPlayers([])
        setPlayers([])
        setLoading(false)
        return
      }

      if (playersData.success && Array.isArray(playersData.players)) {
        const loaded = (playersData.players as { id: string; name: string; photo_url?: string | null }[]).map((p) => ({
          id: p.id,
          name: p.name,
          photo_url: p.photo_url ?? null,
        }))
        setOriginalPlayers(loaded)
        setPlayers(
          loaded.map((p) => ({
            ...p,
            photoBlob: null,
            photoPreview: null,
            photoRemoved: false,
          }))
        )
      } else {
        setError((playersData.error as string) || 'Failed to load players')
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

  const hasChanges = useMemo(() => {
    return players.some((p) => {
      const o = originalById.get(p.id)
      if (!o) return true
      if (p.name.trim() !== o.name.trim()) return true
      if (p.photoBlob !== null) return true
      if (p.photoRemoved && !!o.photo_url) return true
      return false
    })
  }, [players, originalById])

  const handleNameChange = (index: number, name: string) => {
    setPlayers((prev) => {
      const updated = [...prev]
      const cur = updated[index]
      if (!cur) return prev
      updated[index] = { ...cur, name }
      return updated
    })
  }

  const clearSlotPhoto = (index: number) => {
    setPlayers((prev) => {
      const updated = [...prev]
      const cur = updated[index]
      if (!cur) return prev
      if (cur.photoPreview?.startsWith('blob:')) URL.revokeObjectURL(cur.photoPreview)
      updated[index] = {
        ...cur,
        photoBlob: null,
        photoPreview: null,
        photoRemoved: false,
      }
      return updated
    })
  }

  const applyFileToSlot = useCallback(async (slot: number, file: File) => {
    setProcessingSlot(slot)
    try {
      const processed = await processImageToJpeg(file, 400, 400)
      const previewUrl = URL.createObjectURL(processed)
      setPlayers((prev) => {
        const updated = [...prev]
        const prevPreview = updated[slot]?.photoPreview
        if (prevPreview?.startsWith('blob:')) URL.revokeObjectURL(prevPreview)
        updated[slot] = {
          ...updated[slot]!,
          photoBlob: processed,
          photoPreview: previewUrl,
          photoRemoved: false,
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

  const handleRemovePhoto = (index: number, ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    const cur = players[index]
    if (!cur) return

    if (cur.photoBlob || cur.photoPreview) {
      clearSlotPhoto(index)
      return
    }

    if (cur.photo_url && !cur.photoRemoved) {
      setPlayers((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index]!, photoRemoved: true }
        return updated
      })
    }
  }

  const handleSave = async () => {
    const emptyIndex = players.findIndex((p) => !p.name.trim())
    if (emptyIndex !== -1) {
      setError(`Player ${emptyIndex + 1} name cannot be empty`)
      return
    }

    const snapshot = players.map((p) => ({ ...p }))
    setSaving(true)
    setError(null)

    try {
      for (const p of snapshot) {
        const orig = originalById.get(p.id)
        let uploadedPublicUrl: string | undefined

        if (p.photoBlob) {
          const photoPath = `matchplay/${eventId}/${p.id}.jpg`
          const { error: uploadError } = await supabase.storage.from('player-photos').upload(photoPath, p.photoBlob, {
            contentType: 'image/jpeg',
            upsert: true,
          })
          if (uploadError) {
            console.error('[Players] Photo upload error:', uploadError)
            throw new Error(uploadError.message || 'Photo upload failed')
          }
          const {
            data: { publicUrl },
          } = supabase.storage.from('player-photos').getPublicUrl(photoPath)
          uploadedPublicUrl = publicUrl
        }

        const nameChanged = orig ? p.name.trim() !== orig.name.trim() : true
        const clearingPhoto = !!(p.photoRemoved && orig?.photo_url && !p.photoBlob)

        if (!nameChanged && !p.photoBlob && !clearingPhoto) continue

        const body: Record<string, unknown> = {
          action: 'update',
          player_id: p.id,
        }
        if (nameChanged) body.name = p.name.trim()
        if (p.photoBlob && uploadedPublicUrl) body.photo_url = uploadedPublicUrl
        else if (clearingPhoto) body.photo_url = null

        const data = await callMatchplayPlayer(body)
        if (data.success === false || (!data.success && !data.player)) {
          throw new Error((data.error as string) || 'Failed to save changes')
        }
      }

      router.back()
    } catch (err) {
      console.error('[Players] Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const isEditable = eventStatus !== 'completed'
  const canSave = isEditable && hasChanges && players.every((p) => p.name.trim())

  if (loading) {
    return (
      <div className="matchplay-page matchplay-page--setup">
        <div className="matchplay-loading">Loading players...</div>
      </div>
    )
  }

  return (
    <div className="matchplay-page matchplay-page--setup">
      <div className="matchplay-page-header">
        <button type="button" onClick={() => router.back()} className="matchplay-back-btn">
          ← Back
        </button>
        <h1 className="matchplay-page-title">Players</h1>
        <span className="matchplay-page-header-spacer" aria-hidden />
      </div>

      <div className="matchplay-setup-inner">
        <div className="matchplay-setup-content">
          <div className="matchplay-card">
            <div className="matchplay-card-label-row">
              <span className="matchplay-card-label">Players</span>
              <span className="matchplay-card-label-count">{players.length}</span>
            </div>

            <div className="setup-inputs">
              {players.map((player, index) => {
                const busy = processingSlot === index
                const displayUrl = player.photoPreview ?? (!player.photoRemoved ? (player.photo_url ?? null) : null)

                return (
                  <div key={player.id} className="setup-player-row">
                    {displayUrl ? (
                      <div className="setup-photo-circle-wrap">
                        {isEditable ? (
                          <label
                            className={`setup-photo-thumb${busy ? ' setup-photo-thumb--busy' : ''}`}
                            aria-label={busy ? 'Processing photo' : 'Change photo'}
                          >
                            <input
                              type="file"
                              accept={PLAYER_PHOTO_ACCEPT}
                              disabled={busy}
                              className="setup-photo-file-input"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                e.target.value = ''
                                if (file) void applyFileToSlot(index, file)
                              }}
                            />
                            {busy ? (
                              <span className="setup-photo-thumb-loading">…</span>
                            ) : (
                              <img src={displayUrl} alt="" />
                            )}
                          </label>
                        ) : (
                          <div className="setup-photo-thumb setup-photo-trigger--static">
                            <img src={displayUrl} alt="" />
                          </div>
                        )}
                        {isEditable && !busy ? (
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
                    ) : isEditable ? (
                      <label
                        className={`setup-photo-trigger${busy ? ' setup-photo-trigger--busy' : ''}`}
                        aria-label={busy ? 'Processing photo' : 'Add player photo'}
                      >
                        <input
                          type="file"
                          accept={PLAYER_PHOTO_ACCEPT}
                          disabled={busy}
                          className="setup-photo-file-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (file) void applyFileToSlot(index, file)
                          }}
                        />
                        {busy ? <span className="setup-photo-thumb-loading">…</span> : <CameraIcon />}
                      </label>
                    ) : (
                      <div className="setup-photo-trigger setup-photo-trigger--static" aria-hidden>
                        <CameraIcon />
                      </div>
                    )}

                    <div className="setup-input-wrap setup-input-wrap--player-name">
                      <input
                        type="text"
                        className="setup-input"
                        placeholder={`Player ${index + 1}`}
                        value={player.name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        disabled={!isEditable}
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {players.length === 0 ? <p className="matchplay-error">No players</p> : null}
          {error ? <p className="matchplay-error">{error}</p> : null}
        </div>
      </div>

      {isEditable ? (
        <footer className="matchplay-footer">
          <button type="button" className="matchplay-btn-primary" onClick={() => void handleSave()} disabled={!canSave || saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </footer>
      ) : null}
    </div>
  )
}
