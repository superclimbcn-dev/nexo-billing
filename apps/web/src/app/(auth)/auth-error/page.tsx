import Link from 'next/link'
import { Button } from '@nexo/core-ui'

interface AuthErrorPageProps {
  searchParams: Promise<{ message?: string }>
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { message } = await searchParams

  return (
    <div className="w-full max-w-[400px] flex flex-col gap-8 text-center">
      <div className="flex flex-col gap-2">
        <span className="text-[var(--accent)] text-sm font-mono tracking-widest uppercase">
          Nexo Billing
        </span>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Error de autenticación
        </h1>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 flex flex-col gap-4 items-center">
        <p className="text-[var(--text-dim)] text-sm">
          {message
            ? decodeURIComponent(message)
            : 'El enlace de acceso ha caducado o no es válido. Por favor, solicita uno nuevo.'}
        </p>
      </div>

      <Link href="/login">
        <Button variant="primary" className="w-full justify-center">
          Volver al inicio de sesión
        </Button>
      </Link>
    </div>
  )
}
