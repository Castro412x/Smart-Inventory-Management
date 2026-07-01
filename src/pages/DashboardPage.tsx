import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { subscribeProducts, subscribeTransactions, getDashboardStats } from '@/services/firestoreService'
import { formatCurrency, formatNumber, formatRelative, formatDate, daysUntilExpiry } from '@/utils/format'
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
    if (!user) return
    const uid = user.uid
    getDashboardStats(uid).then(setStats).catch(() => {})
    const unsubProducts = subscribeProducts(uid, (prods) => {
      setProducts(prods)
      getDashboardStats(uid).then(setStats).catch(() => {})
      setLoading(false)
    })
    const unsubTx = subscribeTransactions(uid, (txs) => {
      setRecentTransactions(txs.slice(0, 5))
    }, [])
    return () => { unsubProducts(); unsubTx() }
  }, [user])

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-800 dark:text-gray-100">
            Welcome, {user?.displayName || 'User'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-body">Here is what is happening with your inventory</p>
        </div>
      </div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Total Products" value={formatNumber(stats?.totalProducts || 0)} color="accent" />
        <StatCard title="Categories" value={formatNumber(stats?.totalCategories || 0)} color="success" />
        <StatCard title="Inventory Value" value={formatCurrency(stats?.inventoryValue || 0)} color="info" />
        <StatCard title="Low Stock" value={formatNumber(stats?.lowStockCount || 0)} color="warning" />
        <StatCard title="Out of Stock" value={formatNumber(stats?.outOfStockCount || 0)} color="danger" />
        <StatCard title="Expiring Soon" value={formatNumber(stats?.expiringSoonCount || 0)} color="warning" />
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
        <motion.div variants={item} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700/50 p-6 shadow-sm">
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-5">Inventory by Category</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 11%, 85%)" className="dark:opacity-20" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(210, 8%, 55%)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(210, 8%, 55%)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(210, 12%, 13%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#F9FAFB',
                    fontSize: '13px',
                    fontFamily: 'Plus Jakarta Sans',
                    padding: '10px 14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  }}
                  cursor={{ fill: 'hsl(210, 14%, 93%)', fillOpacity: 0.3 }}
                />
                <Bar dataKey="value" fill="hsl(200, 85%, 42%)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm font-body">No products yet</p>
          )}
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700/50 p-6 shadow-sm">
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-5">Recent Transactions</h2>
          {recentTransactions.length > 0 ? (
            <div className="space-y-1">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 px-1 border-b border-gray-100/80 dark:border-gray-700/30 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate font-body">{tx.productName || products.find(p => p.id === tx.productId)?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-body">{formatRelative(tx.timestamp)} &middot; {formatDate(tx.timestamp)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <Badge variant={tx.type === 'stock_in' ? 'success' : 'danger'}>
                      {tx.type === 'stock_in' ? '+' : '-'}{tx.quantity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm font-body">No transactions yet</p>
          )}
        </motion.div>
      </div>

      {products.filter(p => p.expiryDate).length > 0 && (
        <motion.div variants={item} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700/50 p-6 shadow-sm">
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-5">Expiry Alerts</h2>
          <div className="space-y-2">
            {products
              .filter(p => p.expiryDate)
              .sort((a, b) => {
                const da = daysUntilExpiry(a.expiryDate) ?? 999
                const db = daysUntilExpiry(b.expiryDate) ?? 999
                return da - db
              })
              .slice(0, 10)
              .map(p => {
                const days = daysUntilExpiry(p.expiryDate)
                return (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${days !== null && days <= 0 ? 'bg-danger-bg dark:bg-danger/10' : days !== null && days <= 30 ? 'bg-warning-bg dark:bg-warning/10' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 font-body">{p.name}</span>
                    <Badge variant={days !== null && days <= 0 ? 'danger' : days !== null && days <= 30 ? 'warning' : 'success'}>
                      {days !== null && days <= 0 ? 'Expired' : days !== null && days <= 30 ? `${days}d left` : 'OK'}
                    </Badge>
                  </div>
                )
              })}
          </div>
        </motion.div>
      )}

      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <motion.div variants={item} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700/50 p-6 shadow-sm">
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-5">Stock Alerts</h2>
          <div className="space-y-2">
            {outOfStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-danger-bg dark:bg-danger/10">
                <span className="text-sm font-medium text-danger font-body">{p.name}</span>
                <Badge variant="danger">Out of Stock</Badge>
              </div>
            ))}
            {lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-warning-bg dark:bg-warning/10">
                <span className="text-sm font-medium text-warning font-body">{p.name} ({p.quantity} left)</span>
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
  const colors: Record<string, { bg: string; text: string }> = {
    accent: { bg: 'bg-accent-50 dark:bg-accent-500/10', text: 'text-accent-600 dark:text-accent-400' },
    success: { bg: 'bg-success-bg dark:bg-success/10', text: 'text-success dark:text-success' },
    info: { bg: 'bg-info-bg dark:bg-info/10', text: 'text-info dark:text-info' },
    warning: { bg: 'bg-warning-bg dark:bg-warning/10', text: 'text-warning dark:text-warning' },
    danger: { bg: 'bg-danger-bg dark:bg-danger/10', text: 'text-danger dark:text-danger' },
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700/50 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-body">{title}</p>
      <p className={`text-2xl font-bold font-heading mt-1.5 ${colors[color]?.text || 'text-gray-800 dark:text-gray-100'}`}>{value}</p>
    </div>
  )
}
