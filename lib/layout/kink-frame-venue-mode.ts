/** Venue display modes for the kink-frame TV shell. */
export type KinkFrameVenueMode = 'idle' | 'showcase' | 'social' | 'socialFlat'

export const KINK_FRAME_NAV_MODES = [
  { id: 'idle' as const, label: 'Idle' },
  { id: 'showcase' as const, label: 'Showcase' },
  { id: 'social' as const, label: 'Social' },
  { id: 'socialFlat' as const, label: 'Social · Flat' },
] as const

export function kinkFrameModeIsSocialLayout(mode: KinkFrameVenueMode): boolean {
  return mode === 'social' || mode === 'socialFlat'
}

export function kinkFrameModeUsesFlatShell(mode: KinkFrameVenueMode): boolean {
  return mode === 'socialFlat'
}

/** Panel animation key — social and social-flat share the same content. */
export function kinkFrameModePanelKey(mode: KinkFrameVenueMode): string {
  if (mode === 'socialFlat') return 'social'
  return mode
}
