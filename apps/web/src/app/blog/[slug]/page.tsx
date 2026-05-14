import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBlogPostBySlug, getComments, getBlogPosts } from '../_lib/blog-actions'
import { getCategoryMeta } from '../_lib/blog-categories'
import { CommentForm } from './_components/comment-form'
import { BlogContent } from './_components/blog-content'
import { FileText, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const posts = await getBlogPosts()
    return posts.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: 'Artículo no encontrado | Nexo Billing' }

  return {
    title: `${post.title} | Nexo Billing Blog`,
    description: post.excerpt ?? post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? post.title,
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      authors: [post.author],
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const comments = await getComments(post.id)
  const meta = getCategoryMeta(post.category)
  const date = new Date(post.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Organization', name: post.author },
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://dev.billing.nexo-digital.app/blog/${post.slug}`,
    },
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[var(--accent)]">Nexo</span> Billing
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-[var(--text-dim)]">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">
              Inicio
            </Link>
            <Link href="/blog" className="text-[var(--text)] transition-colors">
              Blog
            </Link>
            <Link href="/login" className="hover:text-[var(--text)] transition-colors">
              Acceder
            </Link>
          </nav>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al blog
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border"
            style={{ borderColor: meta.color + '40', color: meta.color, backgroundColor: meta.color + '10' }}
          >
            {meta.label}
          </span>
          <span className="text-xs text-[var(--text-subtle)]">
            {readTime} min de lectura
          </span>
        </div>

        {/* Title */}
        <h1 className="[font-family:var(--font-serif)] text-3xl sm:text-4xl lg:text-5xl text-[var(--text)] leading-tight">
          {post.title}
        </h1>

        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-dim)]">
          <span>Por {post.author}</span>
          <span>·</span>
          <time dateTime={post.createdAt.toISOString()}>{date}</time>
        </div>

        {/* Hero image */}
        {post.image ? (
          <div className="mt-8 rounded-xl overflow-hidden border border-[var(--border)]">
            <img src={post.image} alt={post.title} className="w-full h-64 sm:h-80 object-cover" />
          </div>
        ) : (
          <div className="mt-8 h-48 sm:h-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center justify-center">
            <FileText className="w-12 h-12 text-[var(--text-subtle)]" />
          </div>
        )}

        {/* Video */}
        {post.videoUrl && (
          <div className="mt-8 aspect-video rounded-xl overflow-hidden border border-[var(--border)]">
            <iframe
              src={post.videoUrl}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}

        {/* Content */}
        <div className="mt-10 max-w-none">
          <BlogContent content={post.content} />
        </div>

        {/* Feedback */}
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <p className="text-sm font-medium text-[var(--text)] mb-3">
            ¿Te ayudó este artículo?
          </p>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--text-dim)] hover:text-[var(--success)] hover:border-[var(--success)]/30 transition-colors">
              <ThumbsUp className="w-4 h-4" />
              Sí
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--text-dim)] hover:text-[var(--danger)] hover:border-[var(--danger)]/30 transition-colors">
              <ThumbsDown className="w-4 h-4" />
              No
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <h2 className="text-lg font-medium text-[var(--text)] mb-6">
            Comentarios {comments.length > 0 && `(${comments.length})`}
          </h2>

          {comments.length === 0 ? (
            <p className="text-sm text-[var(--text-dim)] mb-6">
              Sé el primero en comentar este artículo.
            </p>
          ) : (
            <div className="space-y-4 mb-8">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text)]">
                      {comment.name}
                    </span>
                    <time className="text-[10px] text-[var(--text-subtle)]">
                      {new Date(comment.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-[var(--text-dim)] leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <h3 className="text-sm font-medium text-[var(--text)] mb-4">
              Dejar un comentario
            </h3>
            <CommentForm postId={post.id} />
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-[var(--text-subtle)]">
          <span>
            <span className="text-[var(--accent)]">Nexo</span> Billing
          </span>
          <span>© {new Date().getFullYear()} Nexo Digital Unipersonal</span>
        </div>
      </footer>
    </div>
  )
}
