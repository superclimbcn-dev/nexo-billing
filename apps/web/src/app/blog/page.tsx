import type { Metadata } from 'next'
import Link from 'next/link'
import { getBlogPosts } from './_lib/blog-actions'
import { getCategoryMeta } from './_lib/blog-categories'
import { Search, FileText, TrendingUp, Receipt, Calculator, Settings } from 'lucide-react'

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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  empezar: <FileText className="w-4 h-4" />,
  facturar: <Receipt className="w-4 h-4" />,
  impuestos: <Calculator className="w-4 h-4" />,
  verifactu: <TrendingUp className="w-4 h-4" />,
  avanzado: <Settings className="w-4 h-4" />,
}

export default async function BlogPage() {
  const posts = await getBlogPosts()
  const featured = posts.filter((p) => p.featured)
  const regular = posts.filter((p) => !p.featured)
  const allCategories = Array.from(new Set(posts.map((p) => p.category)))

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
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

          {/* Search */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
            <input
              type="text"
              placeholder="Buscar en tutoriales..."
              readOnly
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] cursor-text"
            />
          </div>

          {/* Categories */}
          {allCategories.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {allCategories.map((cat) => {
                const meta = getCategoryMeta(cat)
                return (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                    style={{ borderColor: meta.color + '40', color: meta.color, backgroundColor: meta.color + '10' }}
                  >
                    {CATEGORY_ICONS[cat] ?? <FileText className="w-4 h-4" />}
                    {meta.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured posts */}
      {featured.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-widest mb-6">
              Destacados
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((post) => (
                <PostCard key={post.id} post={post} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular posts */}
      {regular.length > 0 && (
        <section className="py-12 sm:py-16 border-t border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-widest mb-6">
              Más artículos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regular.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
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
            className="mt-6 inline-block px-6 py-2.5 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
          >
            Contactar con nosotros
          </a>
        </div>
      </section>

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

function PostCard({
  post,
  featured = false,
}: {
  post: Awaited<ReturnType<typeof getBlogPosts>>[number]
  featured?: boolean
}) {
  const meta = getCategoryMeta(post.category)
  const date = new Date(post.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group block bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--border-strong)] transition-colors ${
        featured ? '' : ''
      }`}
    >
      {post.image ? (
        <div className={`relative bg-[var(--surface-raised)] ${featured ? 'h-48' : 'h-40'}`}>
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className={`relative bg-[var(--surface-raised)] flex items-center justify-center ${featured ? 'h-48' : 'h-40'}`}>
          <FileText className="w-8 h-8 text-[var(--text-subtle)]" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
            style={{ borderColor: meta.color + '40', color: meta.color, backgroundColor: meta.color + '10' }}
          >
            {meta.label}
          </span>
          <span className="text-[10px] text-[var(--text-subtle)]">{date}</span>
        </div>
        <h3 className={`font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition-colors ${featured ? 'text-xl' : 'text-base'}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-sm text-[var(--text-dim)] line-clamp-2">{post.excerpt}</p>
        )}
        <div className="mt-3 text-xs text-[var(--text-subtle)]">Por {post.author}</div>
      </div>
    </Link>
  )
}
