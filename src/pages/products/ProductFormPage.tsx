import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { subscribeCategories, addProduct, updateProduct, getProduct, getProductBySku } from '@/services/firestoreService'
import { uploadImage, deleteImage, generateImagePath } from '@/services/storageService'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Category } from '@/types'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Must be 0 or more'),
  minStock: z.coerce.number().min(0, 'Must be 0 or more'),
  costPrice: z.coerce.number().min(0, 'Must be 0 or more'),
  sellingPrice: z.coerce.number().min(0, 'Must be 0 or more'),
  supplier: z.string().optional(),
})

interface FormData {
  name: string; sku: string; categoryId: string; description?: string
  quantity: number; minStock: number; costPrice: number; sellingPrice: number; supplier?: string
}

export function ProductFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [skuChecking, setSkuChecking] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '', sku: '', categoryId: '', description: '',
      quantity: 0, minStock: 5, costPrice: 0, sellingPrice: 0, supplier: '',
    },
  })

  const watchedSku = watch('sku')

  useEffect(() => {
    const unsub = subscribeCategories(setCategories)
    return unsub
  }, [])

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const product = await getProduct(id!)
        if (product) {
          setValue('name', product.name)
          setValue('sku', product.sku)
          setValue('categoryId', product.categoryId)
          setValue('description', product.description)
          setValue('quantity', product.quantity)
          setValue('minStock', product.minStock)
          setValue('costPrice', product.costPrice)
          setValue('sellingPrice', product.sellingPrice)
          setValue('supplier', product.supplier)
          setExistingImageUrl(product.imageUrl)
          setImagePreview(product.imageUrl)
        }
      } catch {
        toast.error('Failed to load product')
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, setValue, navigate])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be less than 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const checkSku = async (sku: string) => {
    if (!sku) return
    setSkuChecking(true)
    try {
      const existing = await getProductBySku(sku, id)
      if (existing) {
        toast.error('SKU already exists. Please use a unique SKU.')
      }
    } catch {
      // SKU check failed silently (e.g. network error)
    } finally {
      setSkuChecking(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!imageFile && !existingImageUrl) {
      toast.error('Product image is required')
      return
    }
    setSaving(true)
    try {
      let imageUrl = existingImageUrl
      if (imageFile) {
        const path = generateImagePath('product', imageFile.name)
        imageUrl = await uploadImage(imageFile, path)
        if (existingImageUrl) {
          deleteImage(existingImageUrl).catch(() => {})
        }
      }
      const category = categories.find(c => c.id === data.categoryId)
      const productData = {
        ...data,
        description: data.description || '',
        supplier: data.supplier || '',
        imageUrl,
        categoryName: category?.name || 'Uncategorized',
      }
      if (isEdit) {
        await updateProduct(id!, productData)
        toast.success('Product updated')
      } else {
        await addProduct(productData)
        toast.success('Product added')
      }
      navigate('/products')
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-6">
        {isEdit ? 'Edit Product' : 'Add Product'}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700/50 p-6 shadow-sm">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 font-body">Image *</label>
          <div className="flex items-center gap-4">
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover bg-gray-100 ring-1 ring-gray-200 dark:ring-gray-700" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-accent-50 dark:file:bg-accent-500/10 file:text-accent-600 dark:file:text-accent-400 hover:file:bg-accent-100 dark:hover:file:bg-accent-500/20 file:transition-colors cursor-pointer" />
          </div>
        </div>

        <Input label="Product Name" {...register('name')} error={errors.name?.message} />
        <div>
          <Input label="SKU" {...register('sku', { onBlur: () => checkSku(watchedSku) })} error={errors.sku?.message} />
          {skuChecking && <p className="text-xs text-gray-400 mt-1">Checking SKU...</p>}
        </div>
        <Select
          label="Category"
          options={categories.map(c => ({ value: c.id, label: c.name }))}
          placeholder="Select category"
          {...register('categoryId')}
          error={errors.categoryId?.message}
        />
        <Input label="Description" {...register('description')} error={errors.description?.message} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Quantity" type="number" {...register('quantity')} error={errors.quantity?.message} />
          <Input label="Min Stock" type="number" {...register('minStock')} error={errors.minStock?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Cost Price (₦)" type="number" step="0.01" {...register('costPrice')} error={errors.costPrice?.message} />
          <Input label="Selling Price (₦)" type="number" step="0.01" {...register('sellingPrice')} error={errors.sellingPrice?.message} />
        </div>
        <Input label="Supplier" {...register('supplier')} error={errors.supplier?.message} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving}>{isEdit ? 'Update' : 'Create'} Product</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>Cancel</Button>
        </div>
      </form>
    </motion.div>
  )
}
