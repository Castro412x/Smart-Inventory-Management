import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  emptyMessage?: string
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  emptyMessage = 'No data found',
}: TableProps<T>) {
  if (!data.length) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500 font-body text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700/50">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest font-body',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors',
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-accent-500 text-[10px]">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100/80 dark:divide-gray-700/30">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                'transition-all duration-150',
                onRowClick ? 'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(col => (
                <td key={col.key} className={cn('px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-body', col.className)}>
                  {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
