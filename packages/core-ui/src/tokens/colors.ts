export const colors = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surfaceRaised: 'var(--surface-raised)',
  surfaceHover: 'var(--surface-hover)',
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
  text: 'var(--text)',
  textDim: 'var(--text-dim)',
  textSubtle: 'var(--text-subtle)',
  accent: 'var(--accent)',
  accentDim: 'var(--accent-dim)',
  accentGlow: 'var(--accent-glow)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
} as const

export type ColorKey = keyof typeof colors
