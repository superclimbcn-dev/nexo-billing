'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { getCanonicalAppUrl } from '@/lib/auth/app-url'

function translateAuthError(message: string): string {
  if (message.includes('Signups not allowed')) return 'Este correo no tiene una cuenta. ¿Quieres crear una?'
  if (message.includes('Email not confirmed')) return 'Correo no verificado. Revisa tu bandeja de entrada.'
  if (message.includes('Invalid login credentials')) return 'Credenciales incorrectas.'
  if (message.includes('Email rate limit exceeded')) return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.'
  return message
}

export async function signInAction(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  if (!email) redirect('/login?error=El+correo+es+requerido')

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${getCanonicalAppUrl()}/auth/callback` },
  })
  if (error) redirect(`/login?error=${encodeURIComponent(translateAuthError(error.message))}`)
  redirect(`/check-email?email=${encodeURIComponent(email)}`)
}

export async function signUpAction(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  const name = (formData.get('name') as string | null)?.trim()
  if (!email) redirect('/signup?error=El+correo+es+requerido')

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { name: name ?? '' },
      emailRedirectTo: `${getCanonicalAppUrl()}/auth/callback`,
    },
  })
  if (error) redirect(`/signup?error=${encodeURIComponent(translateAuthError(error.message))}`)
  redirect(`/check-email?email=${encodeURIComponent(email)}`)
}

export async function signOutAction() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
