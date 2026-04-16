import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://www.vidconverts.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://www.vidconverts.com/pricing',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.vidconverts.com/library',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://www.vidconverts.com/faq',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Fetch published articles from Supabase
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { data: articles } = await supabase
      .from('articles')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    const articlePages: MetadataRoute.Sitemap = (articles ?? []).map(article => ({
      url: `https://www.vidconverts.com/blog/${article.slug}`,
      lastModified: new Date(article.updated_at ?? article.published_at ?? new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    }))

    return [...staticPages, ...articlePages]
  } catch {
    // If Supabase fails, at least return static pages
    return staticPages
  }
}
