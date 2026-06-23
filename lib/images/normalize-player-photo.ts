import { detectImageMime } from '@/lib/images/detect-mime'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Android gallery picks can return proxy URIs — retry before the handle goes stale. */
export async function readFileBufferWithRetry(file: File, maxAttempts = 4): Promise<ArrayBuffer> {
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const buffer = await file.arrayBuffer()
      if (buffer.byteLength > 0) return buffer
      lastError = new Error('Photo file is empty')
    } catch (err) {
      lastError = err
    }

    if (attempt < maxAttempts - 1) {
      await delay(100 * (attempt + 1))
    }
  }

  if (lastError instanceof DOMException && lastError.name === 'NotReadableError') {
    throw new Error('Could not read photo from gallery. Try again or use the camera.')
  }

  throw lastError instanceof Error ? lastError : new Error('Could not read photo')
}

export function fileFromBuffer(buffer: ArrayBuffer, file: File, mime?: string): File {
  const resolvedMime = mime ?? detectImageMime(buffer, file.type)
  const ext =
    resolvedMime === 'image/png'
      ? 'png'
      : resolvedMime === 'image/webp'
        ? 'webp'
        : resolvedMime === 'image/heic' || resolvedMime === 'image/heif'
          ? 'heic'
          : 'jpg'
  const baseName = file.name?.replace(/\.[^.]+$/, '') || 'photo'
  return new File([buffer], `${baseName}.${ext}`, {
    type: resolvedMime,
    lastModified: file.lastModified || Date.now(),
  })
}

/** Copy picked file bytes immediately — avoids Android proxy URI invalidation. */
export async function snapshotPlayerPhotoFile(file: File): Promise<File> {
  const buffer = await readFileBufferWithRetry(file)
  return fileFromBuffer(buffer, file)
}

function isHeicMime(mime: string): boolean {
  return mime === 'image/heic' || mime === 'image/heif'
}

/** Lazy-load WASM decoder (~3MB) only when needed. */
export async function convertHeicToJpeg(file: File, quality = 0.85): Promise<File> {
  const { heicTo } = await import('heic-to')
  const result = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality,
  })

  const blob = Array.isArray(result) ? result[0] : result
  if (!blob || blob.size === 0) throw new Error('HEIC conversion failed')

  return new File([blob], 'photo.jpg', { type: 'image/jpeg', lastModified: Date.now() })
}

export async function isHeicFile(file: File, buffer?: ArrayBuffer): Promise<boolean> {
  const resolvedBuffer = buffer ?? (await readFileBufferWithRetry(file))
  const mime = detectImageMime(resolvedBuffer, file.type)
  if (isHeicMime(mime)) return true

  try {
    const { isHeic } = await import('heic-to')
    return await isHeic(file)
  } catch {
    return false
  }
}

export async function normalizeHeicIfNeeded(file: File, buffer: ArrayBuffer): Promise<File> {
  if (!(await isHeicFile(file, buffer))) return file
  return convertHeicToJpeg(file)
}
