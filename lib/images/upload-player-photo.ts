import { supabase } from '@/lib/supabase'
import {
  type PreparedPlayerPhoto,
  preparePlayerPhotoForUpload,
} from '@/lib/images/process-image'

function normalizeStoragePath(path: string): string {
  return path.replace(/\.[a-z0-9]+$/i, '') + '.jpg'
}

function withCacheBuster(publicUrl: string): string {
  const separator = publicUrl.includes('?') ? '&' : '?'
  return `${publicUrl}${separator}v=${Date.now()}`
}

export async function uploadPreparedPlayerPhoto(
  storagePath: string,
  prepared: PreparedPlayerPhoto
): Promise<string> {
  const filename = normalizeStoragePath(storagePath)

  const { error } = await supabase.storage.from('player-photos').upload(filename, prepared.body, {
    contentType: prepared.contentType,
    upsert: true,
  })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from('player-photos').getPublicUrl(filename)

  return withCacheBuster(publicUrl)
}

export async function uploadPlayerPhoto(storagePath: string, file: File): Promise<string> {
  const prepared = await preparePlayerPhotoForUpload(file)
  return uploadPreparedPlayerPhoto(storagePath, prepared)
}
