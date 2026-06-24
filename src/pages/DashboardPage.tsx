import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { subscribeProducts, subscribeTransactions, getDashboardStats } from '@/services/firestoreService'
import { formatCurrency, formatNumber, formatRelative, formatDate } from '@/utils/format'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Product, Transaction, DashboardStats } from '@/types'

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {})
    const unsubProducts = subscribeProducts((prods) => {
      setProducts(prods)
      getDashboardStats().then(setStats).catch(() => {})
      setLoading(false)
    })
    const unsubTx = subscribeTransactions((txs) => {
      setRecentTransactions(txs.slice(0, 5))
    }, [])
    return () => { unsubProducts(); unsubTx() }
  }, [])

  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock)
  const outOfStockProducts = products.filter(p => p.quantity === 0)

  const categoryData = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoryName] = (acc[p.categoryName] || 0) + p.quantity
    return acc
  }, {})
  const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }))

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome, {user?.displayName || 'User'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your inventory</p>
        </div>
      </div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Products" value={formatNumber(stats?.totalProducts || 0)} color="blue" />
        <StatCard title="Categories" value={formatNumber(stats?.totalCategories || 0)} color="green" />
        <StatCard title="Inventory Value" value={formatCurrency(stats?.inventoryValue || 0)} color="purple" />
        <StatCard title="Low Stock" value={formatNumber(stats?.lowStockCount || 0)} color="yellow" />
        <StatCard title="Out of Stock" value={formatNumber(stats?.outOfStockCount || 0)} color="red" />
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-3">
        <Link to="/products/add">
          <Button>Add Product</Button>
        </Link>
        <Link to="/stock-in">
          <Button variant="secondary">Stock In</Button>
        </Link>
        <Link to="/stock-out">
          <Button variant="secondary">Stock Out</Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Inventory by Category</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No products yet</p>
          )}
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Transactions</h2>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tx.productName || products.find(p => p.id === tx.productId)?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{formatRelative(tx.timestamp)}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={tx.type === 'stock_in' ? 'success' : 'danger'}>
                      {tx.type === 'stock_in' ? '+' : '-'}{tx.quantity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions yet</p>
          )}
        </motion.div>
      </div>

      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Stock Alerts</h2>
          <div className="space-y-2">
            {outOfStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">{p.name}</span>
                <Badge variant="danger">Out of Stock</Badge>
              </div>
            ))}
            {lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">{p.name} ({p.quantity} left)</span>
                <Badge variant="warning">Low Stock</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]?.split(' ').slice(2).join(' ') || ''}`}>{value}</p>
    </div>
  )
}
