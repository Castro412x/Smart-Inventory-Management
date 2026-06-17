import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { subscribeCategories, addCategory, updateCategory, deleteCategory } from '@/services/firestoreService'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, Column } from '@/components/ui/Table'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Category } from '@/types'

export function CategoriesPage() {
  const toast = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const unsub = subscribeCategories((data) => {
      setCategories(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const handleAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Category already exists')
      return
    }
    setAdding(true)
    try {
      await addCategory(trimmed)
      setNewName('')
      toast.success('Category added')
    } catch {
      toast.error('Failed to add category')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string) => {
    const trimmed = editName.trim()
    if (!trimmed) return
    if (categories.some(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Category already exists')
      return
    }
    try {
      await updateCategory(id, trimmed)
      setEditingId(null)
      toast.success('Category updated')
    } catch {
      toast.error('Failed to update category')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCategory(deleteTarget.id)
      toast.success('Category deleted')
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Name', render: (c) => (
      editingId === c.id ? (
        <div className="flex items-center gap-2">
          <Input value={editName} onChange={e => setEditName(e.target.value)} className="!w-64" autoFocus />
          <Button size="sm" onClick={() => handleUpdate(c.id)}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
        </div>
      ) : (
        <span className="font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
      )
    )},
    { key: 'actions', header: '', render: (c) => (
      editingId !== c.id ? (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setEditingId(c.id); setEditName(c.name) }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(c)}>Delete</Button>
        </div>
      ) : null
    )},
  ]

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>

      <div className="flex gap-3">
        <Input
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="max-w-xs"
        />
        <Button onClick={handleAdd} loading={adding}>Add Category</Button>
      </div>

      {categories.length > 0 ? (
        <Table columns={columns} data={categories} keyExtractor={c => c.id} />
      ) : (
        <EmptyState title="No categories yet" description="Add your first category above" />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Products in this category will be set to "Uncategorized".`}
        confirmText="Delete"
        loading={deleting}
      />
    </motion.div>
  )
}
