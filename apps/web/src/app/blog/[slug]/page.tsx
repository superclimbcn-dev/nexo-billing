import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import imageUrlBuilder from '@sanity/image-url'
import { sanityClient } from '@/lib/sanity/client'
import { getPostBySlug, getAllPosts, getPostsByCategory } from '@/lib/sanity/queries'
import { getCategoryMeta } from '../_lib/blog-categories'
import { BlogContent } from './_components/blog-content'
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react'
import type { SanityPostListItem } from '@/lib/sanity/queries'

interface Props {
  params: Promise<{ slug: string }>
}

const builder = imageUrlBuilder(sanityClient)
function coverUrl(source: SanityPostListItem['coverImage'], w = 1200, h = 630) {
  if (!source) return null
  return builder.image(source).width(w).height(h).fit('crop').auto('format').url()
}

export async function generateStaticParams() {
  try {
    const posts = await getAllPosts()
    return posts.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Artículo no encontrado | Nexo Billing' }

  const ogImage = coverUrl(post.coverImage)

  return {
    title: `${post.title} | Nexo Billing Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    alternates: { canonical: `/blog/${post.slug}` },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = (await getPostsByCategory(post.category)).filter((p) => p.slug !== post.slug).slice(0, 3)
  const meta = getCategoryMeta(post.category)
  const imgUrl = coverUrl(post.coverImage, 1200, 600)

  const date = new Date(post.publishedAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const whatsappText = encodeURIComponent(`📄 ${post.title}\nhttps://billing.nexo-digital.app/blog/${post.slug}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://billing.nexo-digital.app/blog/${post.slug}`,
    },
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[var(--accent)]">Nexo</span> Billing
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-[var(--text-dim)]">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">Inicio</Link>
            <Link href="/blog" className="text-[var(--text)]">Blog</Link>
            <Link href="/login" className="hover:text-[var(--text)] transition-colors">Acceder</Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center gap-1 text-xs text-[var(--text-subtle)]">
          <Link href="/" className="hover:text-[var(--text)] transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-[var(--text)] transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[var(--text-dim)] line-clamp-1">{post.title}</span>
        </nav>
      </div>

      {/* Cover image — full-width hero between breadcrumb and article */}
      {imgUrl && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
          <div className="relative w-full aspect-[16/9] max-h-[480px] rounded-xl overflow-hidden border border-[var(--border)]">
            <Image src={imgUrl} alt={post.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 896px" />
          </div>
        </div>
      )}

      <article className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al blog
        </Link>

        {/* Category + read time */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{ borderColor: meta.color + '40', color: meta.color, backgroundColor: meta.color + '15' }}
          >
            {meta.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--text-subtle)]">
            <Clock className="w-3 h-3" />
            {post.readTime} min de lectura
          </span>
        </div>

        {/* Title */}
        <h1 className="[font-family:var(--font-serif)] text-3xl sm:text-4xl lg:text-5xl text-[var(--text)] leading-tight">
          {post.title}
        </h1>

        <div className="mt-4 text-sm text-[var(--text-dim)]">
          <time dateTime={post.publishedAt}>{date}</time>
          <span className="mx-2">·</span>
          <span>Equipo Nexo</span>
        </div>

        {/* Body */}
        <div className="mt-10">
          <BlogContent body={post.body} />
        </div>

        {/* WhatsApp share */}
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--text-dim)] mb-3">¿Te ha resultado útil? Comparte este artículo:</p>
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.542 5.873L.057 23.854a.5.5 0 0 0 .609.609l6.053-1.485A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.5-5.18-1.373l-.371-.22-3.854.946.966-3.77-.24-.392A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Compartir en WhatsApp
          </a>
        </div>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <aside className="border-t border-[var(--border)] py-12">
          <div className="max-w-[720px] mx-auto px-4 sm:px-6">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-6">Artículos relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => {
                const rMeta = getCategoryMeta(r.category)
                return (
                  <Link
                    key={r._id}
                    href={`/blog/${r.slug}`}
                    className="block p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--border-strong)] transition-colors"
                  >
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold border mb-2"
                      style={{ borderColor: rMeta.color + '40', color: rMeta.color, backgroundColor: rMeta.color + '15' }}
                    >
                      {rMeta.label}
                    </span>
                    <p className="text-sm font-medium text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)]">
                      {r.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-subtle)]">{r.readTime} min</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </aside>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-[var(--text-subtle)]">
          <span><span className="text-[var(--accent)]">Nexo</span> Billing</span>
          <span>© {new Date().getFullYear()} Nexo Digital Unipersonal</span>
        </div>
      </footer>
    </div>
  )
}
