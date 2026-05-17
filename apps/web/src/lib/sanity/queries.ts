import { groq } from 'next-sanity'
import { sanityClient, REVALIDATE_SECONDS } from './client'
import type { PortableTextBlock } from '@portabletext/react'

export interface SanityPost {
  _id: string
  title: string
  slug: string
  excerpt: string
  category: 'tutorial' | 'fiscal' | 'seo'
  publishedAt: string
  readTime: number
  coverImage: {
    asset: { _ref: string; _type: 'reference' }
    hotspot?: { x: number; y: number }
  } | null
  body: PortableTextBlock[]
}

export type SanityPostListItem = Omit<SanityPost, 'body'>

const postListFields = groq`
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  readTime,
  coverImage
`

const postFullFields = groq`
  ${postListFields},
  body
`

export async function getAllPosts(): Promise<SanityPostListItem[]> {
  return sanityClient.fetch(
    groq`*[_type == "post"] | order(publishedAt desc) { ${postListFields} }`,
    {},
    { next: { revalidate: REVALIDATE_SECONDS } },
  )
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  return sanityClient.fetch(
    groq`*[_type == "post" && slug.current == $slug][0] { ${postFullFields} }`,
    { slug },
    { next: { revalidate: REVALIDATE_SECONDS } },
  )
}

export async function getPostsByCategory(
  category: SanityPost['category'],
): Promise<SanityPostListItem[]> {
  return sanityClient.fetch(
    groq`*[_type == "post" && category == $category] | order(publishedAt desc) { ${postListFields} }`,
    { category },
    { next: { revalidate: REVALIDATE_SECONDS } },
  )
}
