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

function loadImageElementFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
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

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  try {
    return await loadImageElementFromFile(file)
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

/** Crop to square and encode as JPEG — handles EXIF orientation on mobile when supported. */
export async function processImageToJpeg(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<File> {
  let bitmap: ImageBitmap | null = null

  if (typeof createImageBitmap === 'function') {
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      try {
        bitmap = await createImageBitmap(file)
      } catch {
        bitmap = null
      }
    }
  }

  let blob: Blob

  if (bitmap) {
    const canvas = drawSquareCropToCanvas(bitmap, bitmap.width, bitmap.height, maxWidth, maxHeight)
    bitmap.close()
    blob = await canvasToJpegBlob(canvas, quality)
  } else {
    const img = await loadImageElement(file)
    const canvas = drawSquareCropToCanvas(img, img.naturalWidth, img.naturalHeight, maxWidth, maxHeight)
    blob = await canvasToJpegBlob(canvas, quality)
  }

  if (blob.size === 0) throw new Error('Processed photo is empty')

  return new File([blob], 'photo.jpg', { type: 'image/jpeg', lastModified: Date.now() })
}

export interface PreparedPlayerPhoto {
  body: ArrayBuffer
  contentType: string
  extension: string
}

/** Normalize to JPEG for upload; fall back to the original bytes if processing fails. */
export async function preparePlayerPhotoForUpload(
  file: File,
  maxWidth = 400,
  maxHeight = 400
): Promise<PreparedPlayerPhoto> {
  if (file.size === 0) throw new Error('Photo file is empty')

  try {
    const processed = await processImageToJpeg(file, maxWidth, maxHeight)
    const body = await processed.arrayBuffer()
    if (body.byteLength > 0) {
      return { body, contentType: 'image/jpeg', extension: 'jpg' }
    }
  } catch (err) {
    console.warn('[preparePlayerPhotoForUpload] processing failed, uploading original', err)
  }

  const body = await file.arrayBuffer()
  if (body.byteLength === 0) throw new Error('Photo file is empty')

  const contentType = file.type || 'image/jpeg'
  const rawExt = file.name.split('.').pop()?.toLowerCase()
  const extension =
    rawExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt)
      ? rawExt === 'jpeg'
        ? 'jpg'
        : rawExt
      : contentType.includes('png')
        ? 'png'
        : 'jpg'

  return { body, contentType, extension }
}
