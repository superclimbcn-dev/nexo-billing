import Link from 'next/link'
import { FormInput } from '@nexo/core-ui'
import { Button } from '@nexo/core-ui'
import { signInAction } from '@/actions/auth'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams

  return (
    <div className="w-full max-w-[400px] flex flex-col gap-8">
      <div className="text-center flex flex-col gap-2">
        <span className="text-[var(--accent)] text-sm font-mono tracking-widest uppercase">
          Nexo Billing
        </span>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-[var(--text-dim)]">
          Introduce tu correo y te enviamos un enlace de acceso
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
        {error && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3 py-2.5">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={signInAction} className="flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}
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
            Enviar enlace de acceso
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-[var(--text-subtle)]">
        ¿Primera vez aquí?{' '}
        <Link href="/signup" className="text-[var(--accent)] hover:underline">
          Crea tu cuenta
        </Link>
      </p>
    </div>
  )
}
