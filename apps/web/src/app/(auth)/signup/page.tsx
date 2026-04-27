import Link from 'next/link'
import { FormInput, Button } from '@nexo/core-ui'
import { signUpAction } from '@/actions/auth'

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams

  return (
    <div className="w-full max-w-[400px] flex flex-col gap-8">
      <div className="text-center flex flex-col gap-2">
        <span className="text-[var(--accent)] text-sm font-mono tracking-widest uppercase">
          Nexo Billing
        </span>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Empieza gratis
        </h1>
        <p className="text-sm text-[var(--text-dim)]">
          Sin tarjeta de crédito. Sin complicaciones.
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
        {error && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3 py-2.5">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={signUpAction} className="flex flex-col gap-4">
          <FormInput
            id="name"
            name="name"
            type="text"
            label="Tu nombre completo"
            placeholder="María García"
            autoComplete="name"
            required
          />
          <FormInput
            id="email"
            name="email"
            type="email"
            label="Correo electrónico"
            placeholder="tu@empresa.com"
            autoComplete="email"
            required
          />
          <Button type="submit" variant="primary" className="w-full justify-center">
            Crear cuenta gratis
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-[var(--text-subtle)]">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
