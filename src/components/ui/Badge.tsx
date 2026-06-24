import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-success-bg text-success dark:bg-success/15 dark:text-success',
  warning: 'bg-warning-bg text-warning dark:bg-warning/15 dark:text-warning',
  danger: 'bg-danger-bg text-danger dark:bg-danger/15 dark:text-danger',
  info: 'bg-info-bg text-info dark:bg-info/15 dark:text-info',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
