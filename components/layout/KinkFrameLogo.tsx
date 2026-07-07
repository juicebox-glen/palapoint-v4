import { DEFAULT_VENUE_LOGO_SRC } from '@/lib/venue'

export interface KinkFrameLogoProps {
  onClick?: () => void
}

export function KinkFrameLogo({ onClick }: KinkFrameLogoProps) {
  const img = <img src={DEFAULT_VENUE_LOGO_SRC} alt="Square One" className="kink-frame-logo-img" />

  if (!onClick) {
    return (
      <div className="kink-frame-logo">
        {img}
      </div>
    )
  }

  return (
    <button type="button" className="kink-frame-logo kink-frame-logo--button" onClick={onClick}>
      {img}
    </button>
  )
}
