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
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200',
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                'transition-colors',
                onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(col => (
                <td key={col.key} className={cn('px-4 py-3 text-sm text-gray-700 dark:text-gray-300', col.className)}>
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
