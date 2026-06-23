import { supabase } from '@/lib/supabase'
import { preparePlayerPhotoForUpload } from '@/lib/images/process-image'

export async function uploadPlayerPhoto(path: string, file: File): Promise<string> {
  const prepared = await preparePlayerPhotoForUpload(file)
  const filename = path.replace(/\.[a-z0-9]+$/i, '') + `.${prepared.extension}`

  const { error } = await supabase.storage.from('player-photos').upload(filename, prepared.body, {
    contentType: prepared.contentType,
    upsert: true,
  })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from('player-photos').getPublicUrl(filename)

  return publicUrl
}
