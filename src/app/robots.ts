import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/report/', '/api/'],
      },
    ],
    sitemap: 'https://www.vidconverts.com/sitemap.xml',
    host: 'https://www.vidconverts.com',
  }
}
