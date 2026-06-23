'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PLAYER_PHOTO_ACCEPT, processImageToJpeg } from '@/lib/images/process-image'
import '@/app/styles/setup-form.css'

interface Props {
  playerId: string
  matchId: string
  currentPhotoUrl?: string | null
  onPhotoChange: (url: string | null) => void
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

function PhotoFileInput({
  disabled,
  onFile,
}: {
  disabled?: boolean
  onFile: (file: File) => void
}) {
  return (
    <input
      type="file"
      accept={PLAYER_PHOTO_ACCEPT}
      disabled={disabled}
      className="setup-photo-file-input"
      onChange={(e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (file) onFile(file)
      }}
    />
  )
}

export default function PlayerPhotoCapture({
  playerId,
  matchId,
  currentPhotoUrl,
  onPhotoChange,
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setPreview(currentPhotoUrl ?? null)
  }, [currentPhotoUrl])

  const processAndUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const processedFile = await processImageToJpeg(file, 400, 400)
        const filename = `${matchId}/${playerId}-${Date.now()}.jpg`

        const { error } = await supabase.storage.from('player-photos').upload(filename, processedFile, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        })

        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from('player-photos').getPublicUrl(filename)

        console.log('[PlayerPhotoCapture] upload ok', { playerId, publicUrl })
        setPreview(publicUrl)
        onPhotoChange(publicUrl)
      } catch (err) {
        console.error('[PlayerPhotoCapture] upload failed:', err)
        alert('Failed to upload photo')
      } finally {
        setUploading(false)
      }
    },
    [matchId, playerId, onPhotoChange]
  )

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPreview(null)
    onPhotoChange(null)
  }

  if (preview) {
    return (
      <div className="setup-photo-circle-wrap">
        <label
          className={`setup-photo-thumb${uploading ? ' setup-photo-thumb--busy' : ''}`}
          aria-label={uploading ? 'Uploading photo' : 'Change photo'}
        >
          <PhotoFileInput disabled={uploading} onFile={(file) => void processAndUpload(file)} />
          {uploading ? (
            <span className="setup-photo-thumb-loading">…</span>
          ) : (
            <img src={preview} alt="" />
          )}
        </label>
        {!uploading && (
          <button
            type="button"
            className="setup-photo-remove"
            onClick={handleRemove}
            aria-label="Remove photo"
          >
            <span aria-hidden>×</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <label
      className={`setup-photo-trigger${uploading ? ' setup-photo-trigger--busy' : ''}`}
      aria-label={uploading ? 'Uploading photo' : 'Add player photo'}
    >
      <PhotoFileInput disabled={uploading} onFile={(file) => void processAndUpload(file)} />
      {uploading ? <span className="setup-photo-thumb-loading">…</span> : <CameraIcon />}
    </label>
  )
}
