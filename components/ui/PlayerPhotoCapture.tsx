'use client'

import { useState, useCallback, useEffect } from 'react'
import { uploadPlayerPhoto } from '@/lib/images/upload-player-photo'
import PlayerPhotoPicker from '@/components/ui/PlayerPhotoPicker'

interface Props {
  playerId: string
  matchId: string
  currentPhotoUrl?: string | null
  onPhotoChange: (url: string | null) => void
}

export default function PlayerPhotoCapture({
  playerId,
  matchId,
  currentPhotoUrl,
  onPhotoChange,
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPreview(currentPhotoUrl ?? null)
  }, [currentPhotoUrl])

  const processAndUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      setError(null)
      try {
        const path = `${matchId}/${playerId}-${Date.now()}.jpg`
        const publicUrl = await uploadPlayerPhoto(path, file)

        console.log('[PlayerPhotoCapture] upload ok', { playerId, publicUrl })
        setPreview(publicUrl)
        onPhotoChange(publicUrl)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload photo'
        console.error('[PlayerPhotoCapture] upload failed:', err)
        setError(message)
      } finally {
        setUploading(false)
      }
    },
    [matchId, playerId, onPhotoChange]
  )

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onPhotoChange(null)
  }

  return (
    <div className="setup-photo-picker-wrap">
      <PlayerPhotoPicker
        previewUrl={preview}
        busy={uploading}
        onFile={(file) => void processAndUpload(file)}
        onRemove={handleRemove}
      />
      {error ? <p className="setup-photo-error">{error}</p> : null}
    </div>
  )
}
