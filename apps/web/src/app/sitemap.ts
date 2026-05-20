import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/sanity/queries'

const BASE = 'https://billing.nexo-digital.app'
const lastModified = new Date()

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE, lastModified, priority: 1.0, changeFrequency: 'monthly' },
  { url: `${BASE}/precios`, lastModified, priority: 0.9, changeFrequency: 'monthly' },
  { url: `${BASE}/blog`, lastModified, priority: 0.8, changeFrequency: 'weekly' },
  { url: `${BASE}/faq`, lastModified, priority: 0.5, changeFrequency: 'monthly' },
  { url: `${BASE}/sobre-nosotros`, lastModified, priority: 0.5, changeFrequency: 'monthly' },
  { url: `${BASE}/contacto`, lastModified, priority: 0.5, changeFrequency: 'monthly' },
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
