import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { subscribeProducts, deleteProduct } from '@/services/firestoreService'
import { subscribeCategories } from '@/services/firestoreService'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table, Column } from '@/components/ui/Table'

import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, formatDate, daysUntilExpiry } from '@/utils/format'
import type { Product, Category } from '@/types'

export function ProductListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const perPage = 10
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    const uid = user.uid
    const unsubProducts = subscribeProducts(uid, (data) => {
      setProducts(data)
      setLoading(false)
    })
    const unsubCats = subscribeCategories(uid, setCategories)
    return () => { unsubProducts(); unsubCats() }
  }, [user])

  const filtered = useMemo(() => {
    let result = [...products]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    }
    if (categoryFilter) {
      result = result.filter(p => p.categoryId === categoryFilter)
    }
    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortKey]
      const bVal = (b as unknown as Record<string, unknown>)[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
    return result
  }, [products, search, categoryFilter, sortKey, sortDir])

  const pageCount = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice(page * perPage, (page + 1) * perPage)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProduct(deleteTarget.id)
      toast.success('Product deleted')
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const columns: Column<Product>[] = [
    { key: 'imageUrl', header: '', render: (p) => (
      <img src={p.imageUrl || '/placeholder.png'} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
    )},
    { key: 'name', header: 'Name', sortable: true },
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'categoryName', header: 'Category' },
    { key: 'quantity', header: 'Qty', sortable: true, render: (p) => (
      <span className={p.quantity <= p.minStock ? 'text-red-600 font-medium' : ''}>{p.quantity}</span>
    )},
    { key: 'costPrice', header: 'Cost', render: (p) => formatCurrency(p.costPrice) },
    { key: 'sellingPrice', header: 'Selling', render: (p) => formatCurrency(p.sellingPrice) },
    {
      key: 'expiryDate', header: 'Expiry', sortable: true, render: (p) => {
        const days = daysUntilExpiry(p.expiryDate)
        if (days === null) return <span className="text-gray-400">-</span>
        if (days < 0) return <span className="text-danger font-medium">Expired</span>
        if (days <= 30) return <span className="text-warning font-medium">{days}d left</span>
        return <span className="text-gray-500">{days}d</span>
      }
    },
    { key: 'createdAt', header: 'Date', sortable: true, render: (p) => formatDate(p.createdAt) },
    { key: 'actions', header: '', render: (p) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/products/edit/${p.id}`)}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)}>Delete</Button>
      </div>
    )},
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between"><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-32" /></div>
        <div className="flex gap-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-48" /></div>
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gray-800 dark:text-gray-100">Products</h1>
        <Link to="/products/add"><Button>Add Product</Button></Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-64">
          <Input placeholder="Search by name or SKU..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        </div>
        <div className="w-48">
          <Select
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            placeholder="All Categories"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <Table
            columns={columns}
            data={paged}
            keyExtractor={p => p.id}
            onRowClick={p => navigate(`/products/edit/${p.id}`)}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500 font-body">{filtered.length} products total</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="secondary" disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No products found"
          description={search || categoryFilter ? 'Try adjusting your search or filters' : 'Get started by adding your first product'}
          action={!search && !categoryFilter ? <Link to="/products/add"><Button>Add Product</Button></Link> : undefined}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </motion.div>
  )
}
