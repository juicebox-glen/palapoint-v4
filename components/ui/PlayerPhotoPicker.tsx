'use client'

import { useCallback, useRef, useState } from 'react'
import {
  PLAYER_PHOTO_CAMERA_ACCEPT,
  PLAYER_PHOTO_GALLERY_ACCEPT,
  snapshotPlayerPhotoFile,
} from '@/lib/images/process-image'
import '@/app/styles/setup-form.css'

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

function GalleryIcon({ className = 'setup-photo-sheet-option-icon' }: { className?: string }) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}

export interface PlayerPhotoPickerProps {
  previewUrl?: string | null
  busy?: boolean
  disabled?: boolean
  onFile: (file: File) => void
  onRemove?: () => void
}

export default function PlayerPhotoPicker({
  previewUrl,
  busy = false,
  disabled = false,
  onFile,
  onRemove,
}: PlayerPhotoPickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const closeSheet = useCallback(() => setSheetOpen(false), [])

  const handleSelectedFile = useCallback(
    (file: File | undefined, input: HTMLInputElement | null) => {
      if (input) input.value = ''
      if (!file) return

      void snapshotPlayerPhotoFile(file)
        .then(onFile)
        .catch((err) => {
          console.warn('[PlayerPhotoPicker] snapshot failed, using original file', err)
          onFile(file)
        })
    },
    [onFile]
  )

  const openSheet = () => {
    if (disabled || busy) return
    setSheetOpen(true)
  }

  const openCamera = () => {
    closeSheet()
    cameraInputRef.current?.click()
  }

  const openGallery = () => {
    closeSheet()
    galleryInputRef.current?.click()
  }

  const hiddenInputs = (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept={PLAYER_PHOTO_CAMERA_ACCEPT}
        capture="environment"
        className="setup-photo-hidden-input"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => handleSelectedFile(e.target.files?.[0], e.currentTarget)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={PLAYER_PHOTO_GALLERY_ACCEPT}
        className="setup-photo-hidden-input"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => handleSelectedFile(e.target.files?.[0], e.currentTarget)}
      />
    </>
  )

  if (disabled) {
    return previewUrl ? (
      <div className="setup-photo-circle-wrap">
        <div className="setup-photo-thumb setup-photo-trigger--static">
          <img src={previewUrl} alt="" />
        </div>
      </div>
    ) : (
      <div className="setup-photo-trigger setup-photo-trigger--static" aria-hidden>
        <CameraIcon />
      </div>
    )
  }

  if (previewUrl) {
    return (
      <>
        {hiddenInputs}
        <div className="setup-photo-circle-wrap">
          <button
            type="button"
            className={`setup-photo-thumb${busy ? ' setup-photo-thumb--busy' : ''}`}
            onClick={openSheet}
            disabled={busy}
            aria-label={busy ? 'Processing photo' : 'Change photo'}
          >
            {busy ? <span className="setup-photo-thumb-loading">…</span> : <img src={previewUrl} alt="" />}
          </button>
          {!busy && onRemove ? (
            <button
              type="button"
              className="setup-photo-remove"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove()
              }}
              aria-label="Remove photo"
            >
              <span aria-hidden>×</span>
            </button>
          ) : null}
        </div>

        {sheetOpen ? (
          <div className="setup-photo-sheet-backdrop" onClick={closeSheet}>
            <div
              className="setup-photo-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Choose photo source"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="setup-photo-sheet-title">Player photo</p>
              <button type="button" className="setup-photo-sheet-option" onClick={openCamera}>
                <CameraIcon className="setup-photo-sheet-option-icon" />
                Take photo
              </button>
              <button type="button" className="setup-photo-sheet-option" onClick={openGallery}>
                <GalleryIcon />
                Choose from library
              </button>
              {onRemove ? (
                <button
                  type="button"
                  className="setup-photo-sheet-remove"
                  onClick={() => {
                    closeSheet()
                    onRemove()
                  }}
                >
                  Remove photo
                </button>
              ) : null}
              <button type="button" className="setup-photo-sheet-cancel" onClick={closeSheet}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <>
      {hiddenInputs}
      <button
        type="button"
        className={`setup-photo-trigger${busy ? ' setup-photo-trigger--busy' : ''}`}
        onClick={openSheet}
        disabled={busy}
        aria-label={busy ? 'Processing photo' : 'Add player photo'}
      >
        {busy ? <span className="setup-photo-thumb-loading">…</span> : <CameraIcon />}
      </button>

      {sheetOpen ? (
        <div className="setup-photo-sheet-backdrop" onClick={closeSheet}>
          <div
            className="setup-photo-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Choose photo source"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="setup-photo-sheet-title">Player photo</p>
            <button type="button" className="setup-photo-sheet-option" onClick={openCamera}>
              <CameraIcon className="setup-photo-sheet-option-icon" />
              Take photo
            </button>
            <button type="button" className="setup-photo-sheet-option" onClick={openGallery}>
              <GalleryIcon />
              Choose from library
            </button>
            <button type="button" className="setup-photo-sheet-cancel" onClick={closeSheet}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
