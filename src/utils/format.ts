import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(date: Date | { toDate: () => Date } | undefined | null): string {
  if (!date) return ''
  const d = date instanceof Date ? date : date.toDate()
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatRelative(date: Date | { toDate: () => Date } | undefined | null): string {
  if (!date) return ''
  const d = date instanceof Date ? date : date.toDate()
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}
