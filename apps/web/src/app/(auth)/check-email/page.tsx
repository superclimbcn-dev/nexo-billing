import Link from 'next/link'

interface CheckEmailPageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const { email } = await searchParams

  return (
    <div className="w-full max-w-[400px] flex flex-col gap-8 text-center">
      <div className="flex flex-col gap-2">
        <span className="text-[var(--accent)] text-sm font-mono tracking-widest uppercase">
          Nexo Billing
        </span>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Revisa tu correo
        </h1>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 flex flex-col gap-4 items-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center text-3xl">
          ✉️
        </div>
        <p className="text-[var(--text-dim)] text-sm leading-relaxed">
          Hemos enviado un enlace de acceso a
          {email && (
            <>
              {' '}
              <span className="text-[var(--text)] font-medium">{decodeURIComponent(email)}</span>
            </>
          )}
          . Haz clic en el enlace para continuar.
        </p>
        <p className="text-[var(--text-subtle)] text-xs">
          El enlace caduca en 1 hora. Revisa también la carpeta de spam.
        </p>
      </div>

      <p className="text-center text-sm text-[var(--text-subtle)]">
        ¿Email incorrecto?{' '}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  )
}
