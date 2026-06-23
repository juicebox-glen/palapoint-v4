/** MIME list that opens camera + gallery on mobile (avoid `capture` so both stay available). */
export const PLAYER_PHOTO_ACCEPT =
  'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/*'

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        // Some Android WebViews return null from toBlob — toDataURL fallback.
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          fetch(dataUrl)
            .then((res) => res.blob())
            .then(resolve)
            .catch(reject)
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

function loadImageElement(file: File): Promise<HTMLImageElement> {
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

  return new File([blob], 'photo.jpg', { type: 'image/jpeg', lastModified: Date.now() })
}
