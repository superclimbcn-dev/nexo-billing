'use server'

import { prisma } from '@nexo/prisma'
import { unstable_noStore as noStore } from 'next/cache'

export interface BlogPostListItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: string
  image: string | null
  author: string
  featured: boolean
  createdAt: Date
}

export async function getBlogPosts(): Promise<BlogPostListItem[]> {
  noStore()
  return prisma.blogPost.findMany({
    where: { published: true },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      image: true,
      author: true,
      featured: true,
      createdAt: true,
    },
  })
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<
  | (BlogPostListItem & {
      content: string
      videoUrl: string | null
      updatedAt: Date
    })
  | null
> {
  noStore()
  return prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      image: true,
      author: true,
      featured: true,
      createdAt: true,
      content: true,
      videoUrl: true,
      updatedAt: true,
    },
  })
}

export interface CommentListItem {
  id: string
  name: string
  content: string
  createdAt: Date
}

export async function getComments(postId: string): Promise<CommentListItem[]> {
  noStore()
  return prisma.comment.findMany({
    where: { postId, approved: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, content: true, createdAt: true },
  })
}

export async function createComment(data: {
  postId: string
  name: string
  email: string
  content: string
  honeypot?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (data.honeypot) {
    return { ok: true }
  }

  const name = data.name.trim()
  const email = data.email.trim()
  const content = data.content.trim()

  if (!name || name.length > 100) {
    return { ok: false, error: 'Nombre inválido' }
  }
  if (!email || email.length > 254 || !email.includes('@')) {
    return { ok: false, error: 'Email inválido' }
  }
  if (!content || content.length < 2 || content.length > 2000) {
    return { ok: false, error: 'Comentario inválido (2-2000 caracteres)' }
  }

  try {
    await prisma.comment.create({
      data: {
        postId: data.postId,
        name,
        email,
        content,
        approved: false,
      },
    })
    return { ok: true }
  } catch (err) {
    console.error('[createComment] error:', err)
    return { ok: false, error: 'Error al enviar comentario' }
  }
}
