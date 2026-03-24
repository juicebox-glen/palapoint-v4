'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import '@/app/styles/setup-form.css'

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

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="setup-photo-sheet-option-icon"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(currentPhotoUrl ?? null)
  }, [currentPhotoUrl])

  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [sheetOpen])

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

  const handleRemove = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setPreview(null)
    onPhotoChange(null)
    setSheetOpen(false)
  }

  const openCamera = () => {
    setSheetOpen(false)
    requestAnimationFrame(() => cameraInputRef.current?.click())
  }

  const openLibrary = () => {
    setSheetOpen(false)
    requestAnimationFrame(() => fileInputRef.current?.click())
  }

  const sheet =
    sheetOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="setup-photo-sheet-backdrop"
        role="presentation"
        onClick={() => setSheetOpen(false)}
      >
        <div
          className="setup-photo-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="setup-photo-sheet-title"
          onClick={(e) => e.stopPropagation()}
        >
          <p id="setup-photo-sheet-title" className="setup-photo-sheet-title">
            Player photo
          </p>
          <button
            type="button"
            className="setup-photo-sheet-option"
            onClick={openCamera}
            disabled={uploading}
          >
            <CameraIcon className="setup-photo-sheet-option-icon" />
            <span>Take photo</span>
          </button>
          <button
            type="button"
            className="setup-photo-sheet-option"
            onClick={openLibrary}
            disabled={uploading}
          >
            <ImageIcon />
            <span>Photo library</span>
          </button>
          {preview && (
            <button
              type="button"
              className="setup-photo-sheet-remove"
              onClick={() => handleRemove()}
              disabled={uploading}
            >
              Remove photo
            </button>
          )}
          <button type="button" className="setup-photo-sheet-cancel" onClick={() => setSheetOpen(false)}>
            Cancel
          </button>
        </div>
      </div>,
      document.body
    )

  return (
    <>
      {preview ? (
        <div className="setup-photo-circle-wrap">
          <button
            type="button"
            className="setup-photo-thumb"
            onClick={() => setSheetOpen(true)}
            disabled={uploading}
            aria-label={uploading ? 'Uploading photo' : 'Change photo'}
          >
            {uploading ? (
              <span className="setup-photo-thumb-loading">…</span>
            ) : (
              <img src={preview} alt="" />
            )}
          </button>
          {!uploading && (
            <button
              type="button"
              className="setup-photo-remove"
              onClick={handleRemove}
              disabled={uploading}
              aria-label="Remove photo"
            >
              <span aria-hidden>×</span>
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="setup-photo-trigger"
          onClick={() => setSheetOpen(true)}
          disabled={uploading}
          aria-label={uploading ? 'Uploading photo' : 'Add player photo'}
        >
          {uploading ? <span className="setup-photo-thumb-loading">…</span> : <CameraIcon />}
        </button>
      )}

      {sheet}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="setup-photo-file-input"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="setup-photo-file-input"
      />
    </>
  )
}
