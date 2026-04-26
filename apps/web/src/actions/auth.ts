'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerClient } from '@nexo/core-auth'

async function getOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function signInAction(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  if (!email) {
    redirect('/login?error=El+correo+es+requerido')
  }

  const origin = await getOrigin()
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/check-email?email=${encodeURIComponent(email)}`)
}

export async function signUpAction(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim()
  const name = (formData.get('name') as string | null)?.trim()

  if (!email) {
    redirect('/signup?error=El+correo+es+requerido')
  }

  const origin = await getOrigin()
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { name: name ?? '' },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/check-email?email=${encodeURIComponent(email)}`)
}

export async function signOutAction() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
