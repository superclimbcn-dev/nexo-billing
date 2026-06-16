export const THEMES = {
  dark: {
    name: 'Dark',
    description: 'Clásico oscuro — el original',
    preview: '#d4ff3f',
    vars: {
      '--bg':            '#0a0a0b',
      '--surface':       '#121214',
      '--surface-raised':'#18181c',
      '--surface-hover': '#1e1e23',
      '--border':        '#26262c',
      '--border-strong': '#35353d',
      '--text':          '#f4f4f5',
      '--text-dim':      '#a1a1aa',
      '--text-subtle':   '#71717a',
      '--accent':        '#d4ff3f',
      '--accent-dim':    '#a3cc2c',
      '--accent-glow':   'rgba(212,255,63,0.15)',
      '--sidebar-bg':    '#080808',
    },
  },
  light: {
    name: 'Light',
    description: 'Blanco profesional — limpio y moderno',
    preview: '#6366f1',
    vars: {
      '--bg':            '#f8fafc',
      '--surface':       '#ffffff',
      '--surface-raised':'#f1f5f9',
      '--surface-hover': '#e2e8f0',
      '--border':        'rgba(99,102,241,0.2)',
      '--border-strong': 'rgba(99,102,241,0.4)',
      '--text':          '#0f172a',
      '--text-dim':      '#64748b',
      '--text-subtle':   '#94a3b8',
      '--accent':        '#6366f1',
      '--accent-dim':    '#4f46e5',
      '--accent-glow':   'rgba(99,102,241,0.15)',
      '--sidebar-bg':    '#ffffff',
    },
  },
  ocean: {
    name: 'Ocean',
    description: 'Azul tecnológico — confianza y precisión',
    preview: '#00D4FF',
    vars: {
      '--bg':            '#0d1b2a',
      '--surface':       '#112233',
      '--surface-raised':'#1a2f44',
      '--surface-hover': '#1f3a55',
      '--border':        'rgba(0,212,255,0.15)',
      '--border-strong': 'rgba(0,212,255,0.3)',
      '--text':          '#e2f4ff',
      '--text-dim':      '#7aaabb',
      '--text-subtle':   '#4d7a8a',
      '--accent':        '#00D4FF',
      '--accent-dim':    '#00b8e6',
      '--accent-glow':   'rgba(0,212,255,0.15)',
      '--sidebar-bg':    '#0a1520',
    },
  },
  slate: {
    name: 'Slate',
    description: 'Gris moderno — elegante y neutro',
    preview: '#818cf8',
    vars: {
      '--bg':            '#0f172a',
      '--surface':       '#1e293b',
      '--surface-raised':'#334155',
      '--surface-hover': '#3d4f66',
      '--border':        'rgba(129,140,248,0.2)',
      '--border-strong': 'rgba(129,140,248,0.35)',
      '--text':          '#f1f5f9',
      '--text-dim':      '#94a3b8',
      '--text-subtle':   '#64748b',
      '--accent':        '#818cf8',
      '--accent-dim':    '#6366f1',
      '--accent-glow':   'rgba(129,140,248,0.15)',
      '--sidebar-bg':    '#0a0f1e',
    },
  },
  forest: {
    name: 'Forest',
    description: 'Verde oscuro — natural y profesional',
    preview: '#059669',
    vars: {
      '--bg-primary':   '#0d1a14',
      '--bg-secondary': '#132019',
      '--bg-card':      '#1a2e22',
      '--accent':       '#059669',
      '--accent-hover': '#047857',
      '--text-primary': '#d1fae5',
      '--text-muted':   '#6b9e83',
      '--border':       'rgba(5,150,105,0.18)',
      '--sidebar-bg':   '#0a1510',
    },
  },
} as const

export type ThemeKey = keyof typeof THEMES

export function buildThemeCss(key: string): string {
  const theme = THEMES[key as ThemeKey] ?? THEMES.dark
  const vars = Object.entries(theme.vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  return `:root{${vars}}`
}
