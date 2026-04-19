/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  async redirects() {
    return [
      {
        source: '/report/:id',
        destination: '/reports/:id',
        permanent: true,
      },
      {
        source: '/library/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        // Allow social media crawlers to access all pages
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
      {
        // Ensure OG image is publicly accessible with no caching restrictions
        source: '/og-image.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
