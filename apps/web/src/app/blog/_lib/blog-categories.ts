export const BLOG_CATEGORIES: Record<string, { label: string; color: string }> = {
  tutorial: { label: 'Tutorial', color: '#4ade80' },
  fiscal: { label: 'Fiscal', color: '#fbbf24' },
  seo: { label: 'Comparativas', color: '#60a5fa' },
  // legacy categories (kept for compatibility)
  empezar: { label: 'Empezar', color: '#4ade80' },
  facturar: { label: 'Facturar', color: '#60a5fa' },
  impuestos: { label: 'Impuestos', color: '#fbbf24' },
  verifactu: { label: 'Verifactu', color: '#f87171' },
  avanzado: { label: 'Avanzado', color: '#c084fc' },
}

export function getCategoryMeta(category: string) {
  return BLOG_CATEGORIES[category] ?? { label: category, color: '#a1a1aa' }
}
