import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-600 dark:text-gray-400 font-body">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-150',
            'bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100',
            'border-gray-200 dark:border-gray-700',
            'focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/20',
            'hover:border-gray-300 dark:hover:border-gray-600',
            error && 'border-danger hover:border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
