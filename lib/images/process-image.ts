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

const MAX_DECODE_EDGE = 4096

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

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length))
}

/** Detect image MIME from magic bytes — Android often leaves `file.type` empty. */
export function detectImageMime(buffer: ArrayBuffer, reportedType?: string): string {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer.byteLength > 16 ? buffer.slice(0, 16) : buffer)

  if (view.byteLength >= 2 && view.getUint16(0) === 0xffd8) return 'image/jpeg'
  if (view.byteLength >= 4 && view.getUint32(0) === 0x89504e47) return 'image/png'
  if (view.byteLength >= 12 && readAscii(bytes, 0, 4) === 'RIFF' && readAscii(bytes, 8, 4) === 'WEBP') {
    return 'image/webp'
  }
  if (view.byteLength >= 12 && readAscii(bytes, 4, 4) === 'ftyp') {
    const brand = readAscii(bytes, 8, 4).toLowerCase()
    if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('hevc')) {
      return 'image/heic'
    }
    if (brand.startsWith('heif') || brand.startsWith('mif1') || brand.startsWith('msf1')) {
      return 'image/heif'
    }
    if (brand.startsWith('avif')) return 'image/avif'
  }
  if (view.byteLength >= 6 && readAscii(bytes, 0, 6) === 'GIF87a') return 'image/gif'
  if (view.byteLength >= 6 && readAscii(bytes, 0, 6) === 'GIF89a') return 'image/gif'

  if (reportedType?.startsWith('image/')) return reportedType
  return 'image/jpeg'
}

function mimeCandidates(buffer: ArrayBuffer, file: File): string[] {
  const detected = detectImageMime(buffer, file.type)
  const raw = [
    detected,
    file.type,
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ].filter((value): value is string => Boolean(value && value.startsWith('image/')))

  return [...new Set(raw)]
}

function blobFromBuffer(buffer: ArrayBuffer, mime: string): Blob {
  return new Blob([buffer], { type: mime })
}

function typedFileFromBuffer(buffer: ArrayBuffer, file: File, mime: string): File {
  const ext =
    mime === 'image/png'
      ? 'png'
      : mime === 'image/webp'
        ? 'webp'
        : mime === 'image/heic' || mime === 'image/heif'
          ? 'heic'
          : 'jpg'
  const baseName = file.name?.replace(/\.[^.]+$/, '') || 'photo'
  return new File([buffer], `${baseName}.${ext}`, { type: mime, lastModified: file.lastModified })
}

function loadImageElementFromSource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
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

function readFileAsDataUrl(file: File | Blob): Promise<string> {
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

async function loadImageElementFromBuffer(buffer: ArrayBuffer, file: File): Promise<HTMLImageElement> {
  const candidates = mimeCandidates(buffer, file)
  let lastError: Error | null = null

  for (const mime of candidates) {
    const blob = blobFromBuffer(buffer, mime)
    try {
      return await loadImageElementFromBlob(blob)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Image load failed')
    }

    try {
      const dataUrl = await readFileAsDataUrl(blob)
      return await loadImageElementFromSource(dataUrl)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Image load failed')
    }

    try {
      const dataUrl = await readFileAsDataUrl(typedFileFromBuffer(buffer, file, mime))
      return await loadImageElementFromSource(dataUrl)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Image load failed')
    }
  }

  throw lastError ?? new Error('Image load failed')
}

async function bitmapToJpegFile(
  source: ImageBitmap,
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File> {
  try {
    const canvas = drawSquareCropToCanvas(source, width, height, maxWidth, maxHeight)
    const jpegBlob = await canvasToJpegBlob(canvas, quality)
    if (jpegBlob.size === 0) throw new Error('Processed photo is empty')
    return new File([jpegBlob], 'photo.jpg', { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    source.close()
  }
}

async function decodeWithImageBitmap(
  buffer: ArrayBuffer,
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File | null> {
  if (typeof createImageBitmap !== 'function') return null

  const candidates = mimeCandidates(buffer, file)
  const resizeWidth = Math.min(MAX_DECODE_EDGE, Math.max(maxWidth, maxHeight) * 4)

  for (const mime of candidates) {
    const blob = blobFromBuffer(buffer, mime)

    const attempts: ImageBitmapOptions[] = [
      { imageOrientation: 'from-image', resizeWidth, resizeQuality: 'high' },
      { imageOrientation: 'from-image' },
      { resizeWidth, resizeQuality: 'high' },
      {},
    ]

    for (const options of attempts) {
      let bitmap: ImageBitmap | null = null
      try {
        bitmap = await createImageBitmap(blob, options)
        return await bitmapToJpegFile(bitmap, bitmap.width, bitmap.height, maxWidth, maxHeight, quality)
      } catch {
        bitmap?.close()
      }
    }
  }

  return null
}

function drawOrientedSquareCrop(
  img: HTMLImageElement,
  orientation: number,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const sourceWidth = img.naturalWidth
  const sourceHeight = img.naturalHeight
  if (sourceWidth === 0 || sourceHeight === 0) {
    throw new Error('Image load failed')
  }

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

  drawImageWithExifOrientation(orientedCtx, img, sourceWidth, sourceHeight, orientation)

  return drawSquareCropToCanvas(orientedCanvas, orientedWidth, orientedHeight, maxWidth, maxHeight)
}

/** Crop to square and encode as JPEG — handles EXIF orientation on mobile when supported. */
export async function processImageToJpeg(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<File> {
  const buffer = await fileToArrayBuffer(file)

  const bitmapResult = await decodeWithImageBitmap(buffer, file, maxWidth, maxHeight, quality)
  if (bitmapResult) return bitmapResult

  const img = await loadImageElementFromBuffer(buffer, file)
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
