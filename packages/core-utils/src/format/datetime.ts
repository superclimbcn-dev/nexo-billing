// Format date and time separately to avoid the platform-specific `, ` vs ` `
// separator that Intl.DateTimeFormat injects when combining date+time parts.
export function formatDateTime(date: Date | string, locale = 'es-ES'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const datePart = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
  const timePart = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${datePart} ${timePart}`
}
