export const BLOG_CATEGORIES: Record<string, { label: string; color: string }> = {
  empezar: { label: 'Empezar', color: '#4ade80' },
  facturar: { label: 'Facturar', color: '#60a5fa' },
  impuestos: { label: 'Impuestos', color: '#fbbf24' },
  verifactu: { label: 'Verifactu', color: '#f87171' },
  avanzado: { label: 'Avanzado', color: '#c084fc' },
}

export function getCategoryMeta(category: string) {
  return BLOG_CATEGORIES[category] ?? { label: category, color: '#a1a1aa' }
}
