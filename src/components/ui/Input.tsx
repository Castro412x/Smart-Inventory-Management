import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-600 dark:text-gray-400 font-body">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-150',
            'bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100',
            'border-gray-200 dark:border-gray-700',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/20',
            'hover:border-gray-300 dark:hover:border-gray-600',
            error && 'border-danger hover:border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-danger mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
