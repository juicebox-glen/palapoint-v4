'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  playerId: string
  matchId: string
  currentPhotoUrl?: string | null
  onPhotoChange: (url: string | null) => void
}

function processImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob> {
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
        0.8
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }
    img.src = objectUrl
  })
}

export default function PlayerPhotoCapture({
  playerId,
  matchId,
  currentPhotoUrl,
  onPhotoChange,
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const processAndUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const processedBlob = await processImage(file, 400, 400)
        const filename = `${matchId}/${playerId}-${Date.now()}.jpg`

        const { error } = await supabase.storage
          .from('player-photos')
          .upload(filename, processedBlob, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from('player-photos').getPublicUrl(filename)

        setPreview(publicUrl)
        onPhotoChange(publicUrl)
      } catch (err) {
        console.error('Upload failed:', err)
        alert('Failed to upload photo')
      } finally {
        setUploading(false)
      }
    },
    [matchId, playerId, onPhotoChange]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void processAndUpload(file)
  }

  const handleRemove = () => {
    setPreview(null)
    onPhotoChange(null)
  }

  return (
    <div className="player-photo-capture">
      {preview ? (
        <div className="photo-preview">
          <img src={preview} alt="Player" />
          <button
            type="button"
            className="photo-remove-btn"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Remove photo"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="photo-placeholder">
          {uploading ? (
            <span className="photo-uploading">Uploading...</span>
          ) : (
            <div className="photo-actions">
              <button
                type="button"
                className="photo-btn"
                onClick={() => cameraInputRef.current?.click()}
                aria-label="Take photo"
              >
                📷
              </button>
              <button
                type="button"
                className="photo-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose from gallery"
              >
                🖼️
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
