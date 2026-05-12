'use client'

import { useState } from 'react'
import { createComment } from '../../_lib/blog-actions'

interface Props {
  postId: string
}

export function CommentForm({ postId }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (honeypot) return

    setStatus('submitting')
    setErrorMsg('')

    const res = await createComment({ postId, name, email, content, honeypot })

    if (res.ok) {
      setStatus('success')
      setName('')
      setEmail('')
      setContent('')
    } else {
      setStatus('error')
      setErrorMsg(res.error)
    }
  }

  if (status === 'success') {
    return (
      <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-lg">
        <p className="text-sm text-[var(--success)]">
          ¡Gracias por tu comentario! Será revisado antes de publicarse.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg">
          <p className="text-sm text-[var(--danger)]">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="comment-name" className="block text-xs font-medium text-[var(--text-dim)] mb-1">
            Nombre *
          </label>
          <input
            id="comment-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="comment-email" className="block text-xs font-medium text-[var(--text-dim)] mb-1">
            Email *
          </label>
          <input
            id="comment-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
            className="w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      {/* Honeypot — hidden from real users */}
      <div className="hidden" aria-hidden="true">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="comment-content" className="block text-xs font-medium text-[var(--text-dim)] mb-1">
          Comentario *
        </label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={2}
          maxLength={2000}
          rows={4}
          className="w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none"
          placeholder="¿Qué te ha parecido este artículo?"
        />
        <p className="mt-1 text-[10px] text-[var(--text-subtle)]">{content.length}/2000</p>
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
      >
        {status === 'submitting' ? 'Enviando...' : 'Enviar comentario'}
      </button>

      <p className="text-[10px] text-[var(--text-subtle)]">
        Tu comentario será revisado antes de publicarse.
      </p>
    </form>
  )
}
