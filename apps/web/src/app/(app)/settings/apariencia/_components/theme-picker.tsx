'use client'

import { useState, useTransition } from 'react'
import { THEMES, type ThemeKey } from '@/lib/themes'
import { updateTheme } from '../../_actions/update-theme'

interface Props {
  currentTheme: string
}

export function ThemePicker({ currentTheme }: Props) {
  const [selected, setSelected] = useState<string>(currentTheme)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSelect(key: string) {
    if (key === selected) return
    setSelected(key)
    setError(null)
    startTransition(async () => {
      const result = await updateTheme(key)
      if (!result.ok) {
        setError(result.error)
        setSelected(currentTheme)
      }
    })
  }

  return (
    <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-5">
      <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
        Tema de la aplicación
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, theme]) => {
          const isActive = selected === key
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={isPending}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-left disabled:opacity-60 ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--surface-raised)]'
                  : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              {/* Color preview circle */}
              <span
                className="w-10 h-10 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-[var(--bg)]"
                style={{
                  backgroundColor: theme.preview,
                  ringColor: isActive ? theme.preview : 'transparent',
                }}
              />

              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text)]">{theme.name}</p>
                <p className="text-xs text-[var(--text-dim)] mt-0.5 leading-snug">
                  {theme.description}
                </p>
              </div>

              {/* Active tick */}
              {isActive && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <svg
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                    className="text-[var(--bg)]"
                  >
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isPending && (
        <p className="text-xs text-[var(--text-dim)]">Aplicando tema...</p>
      )}
      {error && (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      )}
    </section>
  )
}
