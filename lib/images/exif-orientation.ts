/** Read JPEG EXIF orientation tag (1–8). Returns 1 when unknown or not JPEG. */
export function readJpegExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1

  let offset = 2
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset)
    if (marker === 0xffd9) break
    if ((marker & 0xff00) !== 0xff00) break

    const segmentLength = view.getUint16(offset + 2)
    if (segmentLength < 2) break

    if (marker === 0xffe1 && offset + 10 < view.byteLength) {
      if (view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0x0000) {
        const tiffOffset = offset + 10
        const littleEndian = view.getUint16(tiffOffset) === 0x4949
        const readU16 = (pos: number) => (littleEndian ? view.getUint16(pos, true) : view.getUint16(pos, false))
        const readU32 = (pos: number) => (littleEndian ? view.getUint32(pos, true) : view.getUint32(pos, false))

        if (tiffOffset + 8 > view.byteLength) return 1
        const ifd0Offset = tiffOffset + readU32(tiffOffset + 4)
        const ifd0 = tiffOffset + ifd0Offset
        if (ifd0 + 2 > view.byteLength) return 1

        const entries = readU16(ifd0)
        for (let i = 0; i < entries; i++) {
          const entry = ifd0 + 2 + i * 12
          if (entry + 12 > view.byteLength) break
          if (readU16(entry) === 0x0112) {
            const value = readU16(entry + 8)
            return value >= 1 && value <= 8 ? value : 1
          }
        }
      }
    }

    offset += 2 + segmentLength
  }

  return 1
}

export function orientedSourceSize(
  width: number,
  height: number,
  orientation: number
): { width: number; height: number } {
  if (orientation >= 5 && orientation <= 8) {
    return { width: height, height: width }
  }
  return { width, height }
}

/** Draw image with EXIF orientation applied onto ctx (canvas already sized via orientedSourceSize). */
export function drawImageWithExifOrientation(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  orientation: number
): void {
  const w = sourceWidth
  const h = sourceHeight

  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, w, 0)
      break
    case 3:
      ctx.transform(-1, 0, 0, -1, w, h)
      break
    case 4:
      ctx.transform(1, 0, 0, -1, 0, h)
      break
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0)
      break
    case 6:
      ctx.transform(0, 1, -1, 0, h, 0)
      break
    case 7:
      ctx.transform(0, -1, -1, 0, h, w)
      break
    case 8:
      ctx.transform(0, -1, 1, 0, 0, w)
      break
    default:
      break
  }

  ctx.drawImage(img, 0, 0, w, h)
}
