import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR, DEFAULT_VENUE_LOGO_SRC, type VenueBranding } from '@/lib/venue'

/**
 * Default venue branding for design-system previews so headers match production
 * “Square One” courts: logo image, not text fallback when logoUrl is null.
 */
export const designSystemSquareOneBranding: VenueBranding = {
  companyName: 'SquareOne Padel',
  companySlug: 'squareone',
  venueName: 'Ashford',
  venueSlug: 'ashford',
  courtNumber: 1,
  courtName: 'Court 1',
  courtId: 'mock-court-id',
  isShowCourt: false,
  primaryColor: DEFAULT_TEAM_A_COLOR,
  secondaryColor: DEFAULT_TEAM_B_COLOR,
  logoUrl: DEFAULT_VENUE_LOGO_SRC,
}
