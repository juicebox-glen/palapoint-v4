/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/staff/:venueSlug/social-night/new/players',
        destination: '/matchplay/new/players',
      },
      {
        source: '/staff/:venueSlug/social-night/new',
        destination: '/matchplay/new',
      },
      {
        source: '/staff/:venueSlug/social-night/:eventId/results',
        destination: '/matchplay/:eventId/results',
      },
      {
        source: '/staff/:venueSlug/social-night/:eventId/standings',
        destination: '/matchplay/:eventId/standings',
      },
      {
        source: '/staff/:venueSlug/social-night/:eventId/players',
        destination: '/matchplay/:eventId/players',
      },
      {
        source: '/staff/:venueSlug/social-night/:eventId',
        destination: '/matchplay/:eventId',
      },
    ]
  },
}

module.exports = nextConfig
