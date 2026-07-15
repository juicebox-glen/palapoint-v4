'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getMatchplayVenueId, getVenueIdBySlug } from '@/lib/supabase'
import { preparePlayerPhotoForUpload } from '@/lib/images/process-image'
import PlayerPhotoPicker from '@/components/ui/PlayerPhotoPicker'
import { MATCHPLAY_AMERICANO_PLAYER_OPTIONS } from '@/lib/matchplay-americano-setup'
import { generateAmericanoPairings } from '@/lib/matchplay-americano-pairings'
import {
  callMatchplayEvent,
  callMatchplayPlayer,
  callMatchplayRound,
} from '@/lib/api/matchplay'
import { linkVenueScreenToSocialNight } from '@/lib/venue-screen-staff-context'
import { useStaffSocialNightPaths } from '@/lib/hooks/useStaffSocialNightPaths'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-staff.css'
import '@/app/styles/setup-form.css'

const SESSION_KEY = 'matchplay_setup'

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

function generateEventName(): string {
  const d = new Date()
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' Americano'
}

export default function MatchplayPlayersPage() {
  const router = useRouter()
  const { path: staffPath, venueSlug } = useStaffSocialNightPaths()
  const [processingSlot, setProcessingSlot] = useState<number | null>(null)

  const [config, setConfig] = useState<MatchplaySetupSession | null>(null)
  const [players, setPlayers] = useState<PlayerSlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      if (venueSlug) {
        setVenueId(await getVenueIdBySlug(venueSlug))
        return
      }
      setVenueId(await getMatchplayVenueId())
    })()
  }, [venueSlug])

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
      const prepared = await preparePlayerPhotoForUpload(file)
      const blob = new Blob([prepared.body], { type: prepared.contentType })
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

  const handleRemovePhoto = (index: number, ev?: React.MouseEvent) => {
    ev?.preventDefault()
    ev?.stopPropagation()
    clearSlotPhoto(index)
  }
  const handleStartEvent = async () => {
    if (!config || !canStart) return

    // Snapshot synchronously before any await — avoids rare stale `players` if state batches oddly after photo crop/upload.
    const playersSnapshot = players.map((p) => ({
      name: p.name,
      photoBlob: p.photoBlob,
      photoPreview: p.photoPreview,
    }))

    console.log('[MatchplaySetup] StartEvent snapshot:', playersSnapshot.length, 'slots')
    console.log('[MatchplaySetup] StartEvent config:', config)

    setIsSubmitting(true)
    setError(null)

    try {
      const vid =
        (venueSlug ? await getVenueIdBySlug(venueSlug) : null) ??
        venueId ??
        (await getMatchplayVenueId())
      if (!vid) {
        throw new Error(
          venueSlug
            ? `No venue found for “${venueSlug}”. Check venues.slug matches the staff URL.`
            : 'No venue configured for matchplay'
        )
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

      const eventId = (createResult.event as { id: string }).id

      const playerIds: string[] = []

      for (let i = 0; i < playersSnapshot.length; i++) {
        const player = playersSnapshot[i]!

        console.log(`[MatchplaySetup] Player ${i}:`, {
          namePreview: player.name?.slice(0, 40),
          hasPhotoBlob: !!player.photoBlob,
          hasPhotoPreview: !!player.photoPreview,
        })

        const trimmed = player.name?.trim() ?? ''
        if (!trimmed) {
          throw new Error(`Player ${i + 1} has no name`)
        }

        const addResult = await callMatchplayPlayer({
          action: 'add',
          event_id: eventId,
          name: trimmed,
        })

        console.log(`[MatchplaySetup] Add player ${i} response:`, addResult)

        const created =
          addResult.player &&
          typeof addResult.player === 'object' &&
          addResult.player !== null &&
          'id' in addResult.player
            ? (addResult.player as { id: string })
            : null

        // Treat explicit failure OR missing player row as fatal; allow omit success if legacy deploy returns only { player }.
        if (addResult.success === false || !created?.id) {
          throw new Error((addResult.error as string | undefined) || 'Failed to add player')
        }

        const playerId = created.id
        playerIds.push(playerId)

        if (player.photoBlob) {
          const photoPath = `matchplay/${eventId}/${playerId}.jpg`
          const { error: uploadError } = await supabase.storage.from('player-photos').upload(photoPath, player.photoBlob, {
            contentType: 'image/jpeg',
            upsert: true,
          })

          if (uploadError) {
            console.error('[MatchplaySetup] Photo upload error (continuing without photo):', uploadError)
          } else {
            const {
              data: { publicUrl },
            } = supabase.storage.from('player-photos').getPublicUrl(photoPath)

            const upd = await callMatchplayPlayer({
              action: 'update',
              player_id: playerId,
              photo_url: publicUrl,
            })

            console.log(`[MatchplaySetup] Photo update player ${i} response:`, upd)

            if (upd.success === false) {
              console.warn('[MatchplaySetup] Photo URL save failed (event still created):', upd.error)
            }
          }
        }
      }

      if (playerIds.length !== playersSnapshot.length) {
        console.error('[MatchplaySetup] playerIds mismatch:', playerIds.length, 'vs', playersSnapshot.length)
        throw new Error(`Expected ${playersSnapshot.length} player IDs but got ${playerIds.length}`)
      }

      console.log('[MatchplaySetup] All player IDs:', playerIds)

      const allPairings = generateAmericanoPairings(playerIds, courtLabels)
      const roundCap = Math.min(allPairings.length, Math.max(1, config.rounds))
      const pairings = allPairings.slice(0, roundCap)

      console.log('[MatchplaySetup] Creating rounds:', pairings.length)

      let round1Id: string | null = null
      for (const p of pairings) {
        const roundRes = await callMatchplayRound({
          action: 'create_round',
          event_id: eventId,
          round_number: p.roundNumber,
          matches: p.matches,
        })
        const rid = roundRes.round && typeof roundRes.round === 'object' && roundRes.round !== null && 'id' in roundRes.round
          ? String((roundRes.round as { id: string }).id)
          : ''
        if (!rid) {
          throw new Error((roundRes.error as string | undefined) || `Failed to create round ${p.roundNumber}`)
        }
        if (p.roundNumber === 1) round1Id = rid
      }

      console.log('[MatchplaySetup] Starting event…')
      const startEventRes = await callMatchplayEvent({
        action: 'start',
        event_id: eventId,
      })
      if (!startEventRes.event) {
        throw new Error((startEventRes.error as string | undefined) || 'Failed to start event')
      }

      if (round1Id) {
        console.log('[MatchplaySetup] Starting Round 1…', round1Id)
        const startRoundRes = await callMatchplayRound({
          action: 'start_round',
          round_id: round1Id,
        })
        if (!startRoundRes.round) {
          console.warn('[MatchplaySetup] Failed to start round 1:', startRoundRes.error)
        }
      }

      const screenLink = await linkVenueScreenToSocialNight(eventId)
      if (!screenLink.ok) {
        throw new Error(
          screenLink.error ?? 'Event created but the venue screen could not be linked.'
        )
      }

      console.log('[MatchplaySetup] Navigating to event hub…')

      try {
        sessionStorage.removeItem(SESSION_KEY)
      } catch {
        /* ignore */
      }

      router.push(staffPath(`/${eventId}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      setIsSubmitting(false)
    }
  }

  if (!config) {
    return (
      <div className="palalive-staff-shell">
        <p className="palalive-staff-loading-text">Loading…</p>
      </div>
    )
  }

  return (
    <div className="palalive-staff-shell">
      <StaffAppFrame
        venueSlug={venueSlug ?? undefined}
        onBack={() => router.push(staffPath('/new'))}
        footer={
          <button
            type="button"
            className="palalive-staff-btn palalive-staff-btn--primary"
            onClick={() => void handleStartEvent()}
            disabled={!canStart || isSubmitting}
          >
            {isSubmitting ? 'Creating Event…' : 'Start Event'}
          </button>
        }
      >
        <h1 className="palalive-staff-page-title">Players</h1>

        <div className="palalive-staff-body">
          <div className="palalive-staff-card">
            <div className="palalive-staff-card-label-row">
              <span className="palalive-staff-card-label">Add Players</span>
              <span className="palalive-staff-chip">
                {filledCount} of {config.playerCount}
              </span>
            </div>
            {players.map((player, index) => {
              const busy = processingSlot === index
              return (
                <div key={index} className="palalive-staff-player-row">
                  <PlayerPhotoPicker
                    previewUrl={player.photoPreview}
                    busy={busy}
                    onFile={(file) => void applyFileToSlot(index, file)}
                    onRemove={player.photoPreview ? () => handleRemovePhoto(index) : undefined}
                  />
                  <input
                    type="text"
                    className="palalive-staff-player-input"
                    placeholder={`Player ${index + 1}`}
                    value={player.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )
            })}
          </div>

          {error ? <p className="palalive-staff-error">{error}</p> : null}
        </div>
      </StaffAppFrame>
    </div>
  )
}
