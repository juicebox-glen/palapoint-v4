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
