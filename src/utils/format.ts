export function formatCurrency(amount: number, currency: 'PHP' | 'USD' = 'PHP'): string {
  return new Intl.NumberFormat(currency === 'PHP' ? 'en-PH' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatSignedCurrency(amount: number, type: 'credit' | 'debit'): string {
  const formatted = formatCurrency(Math.abs(amount))
  return type === 'credit' ? `+ ${formatted}` : `- ${formatted}`
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? first
  if (parts.length === 1) return first.charAt(0).toUpperCase()
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export function firstName(name: string): string {
  const value = name.trim().split(/\s+/)[0]
  return value || 'there'
}
