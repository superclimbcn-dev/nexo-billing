import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MarketingNav } from '@/components/marketing-nav'
import imageUrlBuilder from '@sanity/image-url'
import { sanityClient } from '@/lib/sanity/client'
import { getAllPosts, type SanityPostListItem } from '@/lib/sanity/queries'
import { getCategoryMeta } from './_lib/blog-categories'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — Tutoriales y guías de facturación | Nexo Billing',
  description:
    'Aprende a facturar como un profesional. Tutoriales sobre Verifactu, impuestos, tesorería y más para autónomos y PYMES españolas.',
  openGraph: {
    title: 'Blog Nexo Billing',
    description: 'Tutoriales y guías de facturación para autónomos y PYMES',
    type: 'website',
  },
}

const builder = imageUrlBuilder(sanityClient)
function imageUrl(source: SanityPostListItem['coverImage']) {
  if (!source) return null
  return builder.image(source).width(800).height(450).fit('crop').auto('format').url()
}

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'tutorial', label: 'Tutoriales' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'seo', label: 'Comparativas' },
] as const

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const allPosts = await getAllPosts()
  const filtered =
    cat && cat !== 'all' ? allPosts.filter((p) => p.category === cat) : allPosts

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <MarketingNav />

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="[font-family:var(--font-serif)] text-4xl sm:text-5xl text-[var(--text)]">
            Blog de <span className="italic text-[var(--accent)]">facturación</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--text-dim)] max-w-2xl mx-auto">
            Tutoriales, guías y consejos para autónomos y PYMES españolas.
            Desde tu primera factura hasta Verifactu 2027.
          </p>

          {/* Category filters */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map(({ value, label }) => {
              const isActive = (cat ?? 'all') === value
              return (
                <Link
                  key={value}
                  href={value === 'all' ? '/blog' : `/blog?cat=${value}`}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    isActive
                      ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Posts grid */}
      {filtered.length > 0 ? (
        <section className="py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <PostCard key={post._id} post={post} imageUrl={imageUrl(post.coverImage)} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 text-center">
          <p className="text-[var(--text-dim)]">Próximamente publicaremos los primeros artículos.</p>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="[font-family:var(--font-serif)] text-2xl sm:text-3xl text-[var(--text)]">
            ¿Necesitas <span className="italic text-[var(--accent)]">ayuda personalizada</span>?
          </h2>
          <p className="mt-4 text-[var(--text-dim)]">
            Nuestro equipo está disponible para resolver tus dudas sobre facturación e impuestos.
          </p>
          <a
            href="mailto:contacto@nexo-digital.app"
            className="mt-6 inline-block px-6 py-2.5 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            Contactar con nosotros
          </a>
        </div>
      </section>

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

function PostCard({ post, imageUrl: imgUrl }: { post: SanityPostListItem; imageUrl: string | null }) {
  const meta = getCategoryMeta(post.category)
  const date = new Date(post.publishedAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--border-strong)] hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
    >
      {/* Cover image — fixed 220px height */}
      <div className="relative h-[220px] bg-[var(--surface-raised)] overflow-hidden">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-[var(--text-subtle)]" />
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Category + date */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{
              borderColor: meta.color + '40',
              color: meta.color,
              backgroundColor: meta.color + '15',
            }}
          >
            {meta.label}
          </span>
          <span className="text-[10px] text-[var(--text-subtle)]">{date}</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-2 text-sm text-[var(--text-dim)] line-clamp-2">{post.excerpt}</p>
        )}

        {/* Read time */}
        <div className="mt-3 text-xs text-[var(--text-subtle)]">
          {post.readTime} min de lectura
        </div>
      </div>
    </Link>
  )
}
