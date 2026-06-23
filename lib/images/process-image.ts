import {
  drawImageWithExifOrientation,
  orientedSourceSize,
  readJpegExifOrientation,
} from '@/lib/images/exif-orientation'

/** Gallery picker — no `capture` so Android/iOS can browse photos. */
export const PLAYER_PHOTO_GALLERY_ACCEPT = 'image/jpeg,image/png,image/webp,image/*'

/** Camera input uses `capture` on a separate control (see PlayerPhotoPicker). */
export const PLAYER_PHOTO_CAMERA_ACCEPT = 'image/*'

/** @deprecated Use PLAYER_PHOTO_GALLERY_ACCEPT or the picker component. */
export const PLAYER_PHOTO_ACCEPT = PLAYER_PHOTO_GALLERY_ACCEPT

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  if (!data) throw new Error('Invalid data URL')
  const mime = header?.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve(blob)
          return
        }
        try {
          resolve(dataUrlToBlob(canvas.toDataURL('image/jpeg', quality)))
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Canvas to blob failed'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

function drawSquareCropToCanvas(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  canvas.width = maxWidth
  canvas.height = maxHeight

  const size = Math.min(sw, sh)
  const sx = (sw - size) / 2
  const sy = (sh - size) / 2
  ctx.drawImage(source, sx, sy, size, size, 0, 0, maxWidth, maxHeight)
  return canvas
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  const buffer = await file.arrayBuffer()
  if (buffer.byteLength === 0) throw new Error('Photo file is empty')
  return buffer
}

function fileToBlob(file: File, buffer: ArrayBuffer): Blob {
  return new Blob([buffer], { type: file.type || 'image/jpeg' })
}

function loadImageElementFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }
    img.src = objectUrl
  })
}

function loadImageElementFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = dataUrl
  })
}

async function loadImageElement(file: File, buffer: ArrayBuffer): Promise<HTMLImageElement> {
  try {
    return await loadImageElementFromBlob(fileToBlob(file, buffer))
  } catch {
    const dataUrl = await readFileAsDataUrl(file)
    return loadImageElementFromDataUrl(dataUrl)
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read photo'))
    }
    reader.onerror = () => reject(new Error('Could not read photo'))
    reader.readAsDataURL(file)
  })
}

function drawOrientedSquareCrop(
  img: HTMLImageElement,
  orientation: number,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const sourceWidth = img.naturalWidth
  const sourceHeight = img.naturalHeight
  const { width: orientedWidth, height: orientedHeight } = orientedSourceSize(
    sourceWidth,
    sourceHeight,
    orientation
  )

  const orientedCanvas = document.createElement('canvas')
  orientedCanvas.width = orientedWidth
  orientedCanvas.height = orientedHeight
  const orientedCtx = orientedCanvas.getContext('2d')
  if (!orientedCtx) throw new Error('Canvas not supported')

  drawImageWithExifOrientation(
    orientedCtx,
    img,
    sourceWidth,
    sourceHeight,
    orientation
  )

  return drawSquareCropToCanvas(
    orientedCanvas,
    orientedWidth,
    orientedHeight,
    maxWidth,
    maxHeight
  )
}

/** Crop to square and encode as JPEG — handles EXIF orientation on mobile when supported. */
export async function processImageToJpeg(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<File> {
  const buffer = await fileToArrayBuffer(file)
  const blob = fileToBlob(file, buffer)

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
      const canvas = drawSquareCropToCanvas(bitmap, bitmap.width, bitmap.height, maxWidth, maxHeight)
      bitmap.close()
      const jpegBlob = await canvasToJpegBlob(canvas, quality)
      if (jpegBlob.size > 0) {
        return new File([jpegBlob], 'photo.jpg', { type: 'image/jpeg', lastModified: Date.now() })
      }
    } catch (err) {
      console.warn('[processImageToJpeg] createImageBitmap failed', err)
    }
  }

  const img = await loadImageElement(file, buffer)
  const orientation = readJpegExifOrientation(buffer)
  const canvas = drawOrientedSquareCrop(img, orientation, maxWidth, maxHeight)
  const jpegBlob = await canvasToJpegBlob(canvas, quality)
  if (jpegBlob.size === 0) throw new Error('Processed photo is empty')

  return new File([jpegBlob], 'photo.jpg', { type: 'image/jpeg', lastModified: Date.now() })
}

export interface PreparedPlayerPhoto {
  body: ArrayBuffer
  contentType: 'image/jpeg'
  extension: 'jpg'
}

/** Normalize gallery/camera picks to JPEG bytes for storage and display. */
export async function preparePlayerPhotoForUpload(
  file: File,
  maxWidth = 400,
  maxHeight = 400
): Promise<PreparedPlayerPhoto> {
  const processed = await processImageToJpeg(file, maxWidth, maxHeight)
  const body = await processed.arrayBuffer()
  if (body.byteLength === 0) throw new Error('Processed photo is empty')
  return { body, contentType: 'image/jpeg', extension: 'jpg' }
}

export function playerPhotoPreviewUrl(prepared: PreparedPlayerPhoto): string {
  return URL.createObjectURL(new Blob([prepared.body], { type: prepared.contentType }))
}
