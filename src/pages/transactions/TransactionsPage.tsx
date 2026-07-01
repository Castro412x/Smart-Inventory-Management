import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { subscribeTransactions } from '@/services/firestoreService'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table, Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { formatDate, formatNumber } from '@/utils/format'
import type { Transaction } from '@/types'

export function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const perPage = 15

  useEffect(() => {
    if (!user) return
    const unsub = subscribeTransactions(user.uid, (data) => {
      setTransactions(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  const filtered = useMemo(() => {
    let result = [...transactions]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(tx =>
        tx.productName.toLowerCase().includes(q) ||
        tx.notes?.toLowerCase().includes(q)
      )
    }
    if (typeFilter) {
      result = result.filter(tx => tx.type === typeFilter)
    }
    return result
  }, [transactions, search, typeFilter])

  const pageCount = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice(page * perPage, (page + 1) * perPage)

  const columns: Column<Transaction>[] = [
    { key: 'timestamp', header: 'Date/Time', render: (tx) => formatDate(tx.timestamp) },
    { key: 'productName', header: 'Product' },
    { key: 'type', header: 'Type', render: (tx) => (
      <Badge variant={tx.type === 'stock_in' ? 'success' : 'danger'}>
        {tx.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
      </Badge>
    )},
    { key: 'quantity', header: 'Quantity', render: (tx) => formatNumber(tx.quantity) },
    { key: 'previousStock', header: 'Previous Stock', render: (tx) => formatNumber(tx.previousStock) },
    { key: 'newStock', header: 'New Stock', render: (tx) => formatNumber(tx.newStock) },
    { key: 'notes', header: 'Notes', render: (tx) => tx.notes || '-' },
  ]

  if (loading) {
    return <div className="space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-gray-800 dark:text-gray-100">Transactions</h1>

      <div className="flex flex-wrap gap-3">
        <div className="w-64">
          <Input placeholder="Search by product or notes..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        </div>
        <div className="w-40">
          <Select
            options={[
              { value: 'stock_in', label: 'Stock In' },
              { value: 'stock_out', label: 'Stock Out' },
            ]}
            placeholder="All Types"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <Table columns={columns} data={paged} keyExtractor={tx => tx.id} />
          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500 font-body">{filtered.length} transactions total</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="secondary" disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="No transactions found" description={search || typeFilter ? 'Try adjusting your filters' : 'No transactions recorded yet'} />
      )}
    </motion.div>
  )
}
