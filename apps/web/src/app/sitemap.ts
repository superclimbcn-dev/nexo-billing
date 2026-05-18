import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/sanity/queries'

const BASE = 'https://billing.nexo-digital.app'

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE, priority: 1.0, changeFrequency: 'monthly' },
  { url: `${BASE}/precios`, priority: 0.9, changeFrequency: 'monthly' },
  { url: `${BASE}/blog`, priority: 0.8, changeFrequency: 'weekly' },
  { url: `${BASE}/faq`, priority: 0.5, changeFrequency: 'monthly' },
  { url: `${BASE}/sobre-nosotros`, priority: 0.5, changeFrequency: 'monthly' },
  { url: `${BASE}/contacto`, priority: 0.5, changeFrequency: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let postEntries: MetadataRoute.Sitemap = []

  try {
    const posts = await getAllPosts()
    postEntries = posts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : undefined,
      priority: 0.7,
      changeFrequency: 'weekly' as const,
    }))
  } catch {
    // sitemap still works with only static pages if Sanity is unreachable
  }

  return [...staticPages, ...postEntries]
}
