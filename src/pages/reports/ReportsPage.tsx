import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getAllProducts, getAllTransactions } from '@/services/firestoreService'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Table, Column } from '@/components/ui/Table'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { exportToCsv } from '@/utils/csv'
import { formatDate, formatCurrency, formatNumber } from '@/utils/format'
import type { Product, Transaction } from '@/types'

type ReportType = 'inventory' | 'low-stock' | 'out-of-stock' | 'movements'

export function ReportsPage() {
  const toast = useToast()
  const [activeReport, setActiveReport] = useState<ReportType>('inventory')
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, txs] = await Promise.all([getAllProducts(), getAllTransactions()])
        setProducts(prods)
        setTransactions(txs)
      } catch {
        toast.error('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const reports: { key: ReportType; label: string; description: string }[] = [
    { key: 'inventory', label: 'Current Inventory', description: 'All products with full details' },
    { key: 'low-stock', label: 'Low Stock', description: 'Products below minimum stock level' },
    { key: 'out-of-stock', label: 'Out of Stock', description: 'Products with zero quantity' },
    { key: 'movements', label: 'Stock Movements', description: 'All transactions' },
  ]

  const inventoryColumns: Column<Product>[] = [
    { key: 'name', header: 'Name' },
    { key: 'sku', header: 'SKU' },
    { key: 'categoryName', header: 'Category' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'minStock', header: 'Min Stock' },
    { key: 'costPrice', header: 'Cost Price', render: (p) => formatCurrency(p.costPrice) },
    { key: 'sellingPrice', header: 'Selling Price', render: (p) => formatCurrency(p.sellingPrice) },
    { key: 'supplier', header: 'Supplier', render: (p) => p.supplier || '-' },
  ]

  const movementColumns: Column<Transaction>[] = [
    { key: 'timestamp', header: 'Date', render: (tx) => formatDate(tx.timestamp) },
    { key: 'productName', header: 'Product' },
    { key: 'type', header: 'Type', render: (tx) => (
      <Badge variant={tx.type === 'stock_in' ? 'success' : 'danger'}>
        {tx.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
      </Badge>
    )},
    { key: 'quantity', header: 'Qty', render: (tx) => formatNumber(tx.quantity) },
    { key: 'previousStock', header: 'From', render: (tx) => formatNumber(tx.previousStock) },
    { key: 'newStock', header: 'To', render: (tx) => formatNumber(tx.newStock) },
    { key: 'notes', header: 'Notes', render: (tx) => tx.notes || '-' },
  ]

  const handleExport = () => {
    setExporting(true)
    try {
      let rows: Record<string, unknown>[] = []
      let filename = ''

      switch (activeReport) {
        case 'inventory':
          rows = products.map(p => ({
            Name: p.name,
            SKU: p.sku,
            Category: p.categoryName,
            Quantity: p.quantity,
            'Min Stock': p.minStock,
            'Cost Price': p.costPrice,
            'Selling Price': p.sellingPrice,
            Supplier: p.supplier || '',
          }))
          filename = 'inventory-report.csv'
          break
        case 'low-stock':
          rows = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).map(p => ({
            Name: p.name,
            SKU: p.sku,
            Quantity: p.quantity,
            'Min Stock': p.minStock,
          }))
          filename = 'low-stock-report.csv'
          break
        case 'out-of-stock':
          rows = products.filter(p => p.quantity === 0).map(p => ({
            Name: p.name,
            SKU: p.sku,
          }))
          filename = 'out-of-stock-report.csv'
          break
        case 'movements':
          rows = transactions.map(tx => ({
            Date: formatDate(tx.timestamp),
            Product: tx.productName,
            Type: tx.type === 'stock_in' ? 'Stock In' : 'Stock Out',
            Quantity: tx.quantity,
            'Previous Stock': tx.previousStock,
            'New Stock': tx.newStock,
            Notes: tx.notes || '',
          }))
          filename = 'stock-movements.csv'
          break
      }

      if (rows.length === 0) {
        toast.warning('No data to export')
        return
      }
      exportToCsv(filename, rows)
      toast.success('Report exported')
    } catch {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }

  const displayData = () => {
    switch (activeReport) {
      case 'inventory':
        return products
      case 'low-stock':
        return products.filter(p => p.quantity > 0 && p.quantity <= p.minStock)
      case 'out-of-stock':
        return products.filter(p => p.quantity === 0)
      case 'movements':
        return transactions
    }
  }

  const displayColumns = activeReport === 'movements' ? movementColumns : inventoryColumns

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gray-800 dark:text-gray-100">Reports</h1>
        <Button variant="secondary" onClick={handleExport} loading={exporting}>Export CSV</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {reports.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveReport(r.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeReport === r.key
                ? 'bg-accent-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {reports.find(r => r.key === activeReport)?.description}
      </p>

      <Table
        columns={displayColumns as Column<unknown>[]}
        data={displayData() as unknown as Record<string, unknown>[]}
        keyExtractor={(item: unknown) => (item as { id: string }).id}
        emptyMessage={`No data for this report`}
      />
    </motion.div>
  )
}
