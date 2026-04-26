import { readFileSync } from 'fs'
import { join } from 'path'
import { createInterface } from 'readline'

function loadEnv(envPath: string): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    const content = readFileSync(envPath, 'utf-8').replace(/^﻿/, '')
    for (const line of content.split('\n')) {
      const clean = line.replace(/\r$/, '').trim()
      if (!clean || clean.startsWith('#')) continue
      const idx = clean.indexOf('=')
      if (idx === -1) continue
      env[clean.slice(0, idx).trim()] = clean.slice(idx + 1).trim()
    }
  } catch {
    // env file not found — fall through to process.env
  }
  return env
}

async function main() {
  const envPath = join(__dirname, '../../../.env.local')
  const fileEnv = loadEnv(envPath)
  const getVar = (k: string) => fileEnv[k] ?? process.env[k]

  const pat = getVar('SUPABASE_PAT')
  const ref = getVar('SUPABASE_PROJECT_REF')

  if (!pat) {
    console.error('ERROR: SUPABASE_PAT not found in .env.local or environment.')
    console.error('Add it as: SUPABASE_PAT=sbp_xxxxxxxxxxxx')
    process.exit(1)
  }
  if (!ref) {
    console.error('ERROR: SUPABASE_PROJECT_REF not found.')
    process.exit(1)
  }

  const templatesDir = join(__dirname, '../email-templates')

  const magicLinkHtml    = readFileSync(join(templatesDir, 'magic-link.html'),    'utf-8')
  const confirmSignupHtml = readFileSync(join(templatesDir, 'confirm-signup.html'), 'utf-8')
  const inviteUserHtml   = readFileSync(join(templatesDir, 'invite-user.html'),   'utf-8')

  console.log(`Applying email templates to project: ${ref}`)
  console.log('Templates: magic_link, confirmation, invite')

  const body = {
    mailer_subjects_magic_link:    'Inicia sesión en Nexo Billing',
    mailer_subjects_confirmation:  'Confirma tu cuenta de Nexo Billing',
    mailer_subjects_invite:        'Te han invitado a unirte a Nexo Billing',
    mailer_templates_magic_link_content:    magicLinkHtml,
    mailer_templates_confirmation_content:  confirmSignupHtml,
    mailer_templates_invite_content:        inviteUserHtml,
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  console.log(`HTTP status: ${response.status}`)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API error (${response.status}):`, errorText)
    process.exit(1)
  }

  console.log(`✓ mailer_subjects_magic_link    = "Inicia sesión en Nexo Billing"`)
  console.log(`✓ mailer_subjects_confirmation  = "Confirma tu cuenta de Nexo Billing"`)
  console.log(`✓ mailer_subjects_invite        = "Te han invitado a unirte a Nexo Billing"`)
  console.log(`✓ mailer_templates_magic_link_content    updated (${magicLinkHtml.length} chars)`)
  console.log(`✓ mailer_templates_confirmation_content  updated (${confirmSignupHtml.length} chars)`)
  console.log(`✓ mailer_templates_invite_content        updated (${inviteUserHtml.length} chars)`)
  console.log(`\n✓ Templates applied to project ${ref}`)
}

main().catch((err: unknown) => {
  console.error('Script failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
