'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { preparePlayerPhotoForUpload } from '@/lib/images/process-image'
import PlayerPhotoPicker from '@/components/ui/PlayerPhotoPicker'
import { callMatchplayEvent, callMatchplayPlayer } from '@/lib/api/matchplay'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import { useStaffSocialNightPaths } from '@/lib/hooks/useStaffSocialNightPaths'
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

export default function MatchplayEventPlayersPage() {
  const router = useRouter()
  const params = useParams()
  const { path: staffPath, venueSlug } = useStaffSocialNightPaths()
  const eventId = params.id as string
  const goBackToEventHub = () => router.push(staffPath(`/${eventId}`))

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
      const prepared = await preparePlayerPhotoForUpload(file)
      const blob = new Blob([prepared.body], { type: prepared.contentType })
      const previewUrl = URL.createObjectURL(blob)
      setPlayers((prev) => {
        const updated = [...prev]
        const prevPreview = updated[slot]?.photoPreview
        if (prevPreview?.startsWith('blob:')) URL.revokeObjectURL(prevPreview)
        updated[slot] = {
          ...updated[slot]!,
          photoBlob: blob,
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

  const handleRemovePhoto = (index: number) => {
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
    <StaffAppFrame venueSlug={venueSlug ?? undefined} onBack={goBackToEventHub}>
      <div className="matchplay-page matchplay-page--setup">
      <h1 className="matchplay-page-title">Players</h1>

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
                    <PlayerPhotoPicker
                      previewUrl={displayUrl}
                      busy={busy}
                      disabled={!isEditable}
                      onFile={(file) => void applyFileToSlot(index, file)}
                      onRemove={displayUrl && isEditable ? () => handleRemovePhoto(index) : undefined}
                    />

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
    </StaffAppFrame>
  )
}
