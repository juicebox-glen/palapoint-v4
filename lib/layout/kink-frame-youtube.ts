/** YouTube embed tuned for TV-style playback — minimal chrome. */
const KINK_FRAME_YOUTUBE_VIDEO_ID = 'gFl3ADnFRtc'

export function kinkFrameYoutubeEmbedSrc(): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: KINK_FRAME_YOUTUBE_VIDEO_ID,
    controls: '0',
    modestbranding: '1',
    fs: '0',
    disablekb: '1',
    iv_load_policy: '3',
    cc_load_policy: '0',
    rel: '0',
    playsinline: '1',
    enablejsapi: '0',
  })

  return `https://www.youtube.com/embed/${KINK_FRAME_YOUTUBE_VIDEO_ID}?${params.toString()}`
}
