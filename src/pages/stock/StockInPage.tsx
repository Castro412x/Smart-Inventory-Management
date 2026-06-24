import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { subscribeProducts, performStockOperation } from '@/services/firestoreService'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Product } from '@/types'

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().int().positive('Must be a positive number'),
  notes: z.string().optional(),
})

interface FormData {
  productId: string; quantity: number; notes?: string
}

export function StockInPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsub = subscribeProducts((data) => {
      setProducts(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { productId: '', quantity: 1, notes: '' },
  })

  const selectedProductId = watch('productId')
  const selectedProduct = products.find(p => p.id === selectedProductId)

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const onSubmit = async (data: FormData) => {
    if (!selectedProduct) return
    setSaving(true)
    try {
      await performStockOperation(
        data.productId,
        selectedProduct.name,
        selectedProduct.quantity,
        data.quantity,
        'stock_in',
        data.notes || ''
      )
      toast.success(`${data.quantity} units added to ${selectedProduct.name}`)
      reset()
      setSearch('')
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e.message || 'Stock in failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-800 dark:text-gray-100">Stock In</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700/50 p-6 shadow-sm">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
            {filteredProducts.map(p => (
              <label key={p.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                selectedProductId === p.id ? 'bg-accent-50 dark:bg-accent-500/10 border border-accent-300 dark:border-accent-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
                <input
                  type="radio"
                  value={p.id}
                  {...register('productId')}
                  className="text-accent-600 focus:ring-accent-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                  <p className="text-xs text-gray-500">SKU: {p.sku} | Current stock: {p.quantity}</p>
                </div>
              </label>
            ))}
            {filteredProducts.length === 0 && <p className="text-sm text-gray-400">No products found</p>}
          </div>
          {errors.productId && <p className="text-sm text-red-500">{errors.productId.message}</p>}
        </div>

        <Input label="Quantity to add" type="number" {...register('quantity')} error={errors.quantity?.message} />
        <Input label="Notes (optional)" {...register('notes')} error={errors.notes?.message} />

        {selectedProduct && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm font-body space-y-1">
            <p className="text-gray-500 dark:text-gray-400">Current stock: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedProduct.quantity}</span></p>
            <p className="text-gray-500 dark:text-gray-400">New stock will be: <span className="font-semibold text-accent-600 dark:text-accent-400">{selectedProduct.quantity + Number(watch('quantity') || 0)}</span></p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={saving} disabled={!selectedProduct}>Complete Stock In</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>Cancel</Button>
        </div>
      </form>
    </motion.div>
  )
}
