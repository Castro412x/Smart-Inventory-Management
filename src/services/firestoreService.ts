import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Product, Category, Transaction } from '@/types'

const productsRef = collection(db, 'products')
const categoriesRef = collection(db, 'categories')
const transactionsRef = collection(db, 'transactions')

// Products
export function subscribeProducts(
  userId: string,
  callback: (products: Product[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const q = query(productsRef, where('userId', '==', userId), ...constraints)
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Product))
      .filter(p => p.userId === userId)
    callback(products)
  }, (error) => {
    console.error('Firestore subscription error:', error)
  })
}

export async function getAllProducts(userId: string): Promise<Product[]> {
  const q = query(productsRef, where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Product))
    .filter(p => p.userId === userId)
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } as Product : null
}

export async function addProduct(userId: string, data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const batch = writeBatch(db)
  const productRef = doc(collection(db, 'products'))
  const payload: Record<string, unknown> = {
    ...data,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  if (data.expiryDate) payload.expiryDate = data.expiryDate instanceof Date ? Timestamp.fromDate(data.expiryDate) : data.expiryDate
  batch.set(productRef, payload)
  batch.set(doc(collection(db, 'transactions')), {
    userId,
    productId: productRef.id,
    productName: data.name,
    type: 'stock_in',
    quantity: data.quantity,
    previousStock: 0,
    newStock: data.quantity,
    notes: 'Initial stock',
    timestamp: Timestamp.now(),
  })
  await batch.commit()
  return productRef.id
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const payload: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() }
  if (data.expiryDate) payload.expiryDate = data.expiryDate instanceof Date ? Timestamp.fromDate(data.expiryDate) : data.expiryDate
  await updateDoc(doc(db, 'products', id), payload)
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, 'products', id))
}

export async function getProductBySku(sku: string, userId: string, excludeId?: string): Promise<Product | null> {
  const q = query(productsRef, where('sku', '==', sku), where('userId', '==', userId))
  const snap = await getDocs(q)
  const products = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Product))
    .filter(p => p.userId === userId)
  const match = excludeId ? products.find(p => p.id !== excludeId) : products[0]
  return match || null
}

// Categories
export function subscribeCategories(
  userId: string,
  callback: (categories: Category[]) => void
): Unsubscribe {
  const q = query(categoriesRef, where('userId', '==', userId), orderBy('name'))
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Category))
      .filter(c => c.userId === userId)
    callback(categories)
  }, (error) => {
    console.error('Categories subscription error:', error)
  })
}

export async function getAllCategories(userId: string): Promise<Category[]> {
  const q = query(categoriesRef, where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Category))
    .filter(c => c.userId === userId)
}

export async function addCategory(userId: string, name: string) {
  const docRef = await addDoc(categoriesRef, { userId, name, createdAt: Timestamp.now() })
  return docRef.id
}

export async function updateCategory(id: string, name: string) {
  await updateDoc(doc(db, 'categories', id), { name })
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, 'categories', id))
}

export async function getCategoryByName(name: string, userId: string): Promise<Category | null> {
  const q = query(categoriesRef, where('name', '==', name), where('userId', '==', userId))
  const snap = await getDocs(q)
  const matches = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Category))
    .filter(c => c.userId === userId)
  return matches[0] || null
}

const DEFAULT_CATEGORIES = [
  'Drinks', 'Noodles', 'Biscuits', 'Toiletries', 'Toothpaste',
  'Books', 'Sweets', 'Bags', 'Sanitary Pads', 'Soaps',
  'Beverages', 'Eggs', 'Air Freshener',
]

export async function seedDefaultCategories(userId: string) {
  const existing = await getAllCategories(userId)
  const existingNames = new Set(existing.map(c => c.name.toLowerCase()))
  const toAdd = DEFAULT_CATEGORIES.filter(c => !existingNames.has(c.toLowerCase()))
  await Promise.all(toAdd.map(name => addCategory(userId, name)))
  return toAdd.length
}

// Transactions
export function subscribeTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const q = query(transactionsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'), ...constraints)
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
      .filter(tx => tx.userId === userId)
    callback(transactions)
  }, (error) => {
    console.error('Transactions subscription error:', error)
  })
}

export async function getAllTransactions(userId: string): Promise<Transaction[]> {
  const q = query(transactionsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'))
  const snap = await getDocs(q)
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
    .filter(tx => tx.userId === userId)
}

// Create a transaction entry
export async function createTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>) {
  const docRef = await addDoc(transactionsRef, {
    ...tx,
    timestamp: Timestamp.now(),
  })
  return docRef.id
}

// Stock operations (atomic batch)
export async function performStockOperation(
  userId: string,
  productId: string,
  productName: string,
  currentQuantity: number,
  quantityChange: number,
  type: 'stock_in' | 'stock_out',
  notes: string
) {
  const batch = writeBatch(db)
  const newStock = type === 'stock_in' ? currentQuantity + quantityChange : currentQuantity - quantityChange
  batch.update(doc(db, 'products', productId), { quantity: newStock, updatedAt: Timestamp.now() })
  batch.set(doc(collection(db, 'transactions')), {
    userId,
    productId,
    productName,
    type,
    quantity: quantityChange,
    previousStock: currentQuantity,
    newStock,
    notes,
    timestamp: Timestamp.now(),
  })
  await batch.commit()
}

// Stats
export async function getDashboardStats(userId: string): Promise<{
  totalProducts: number
  totalCategories: number
  inventoryValue: number
  lowStockCount: number
  outOfStockCount: number
  expiringSoonCount: number
}> {
  const [products, categories] = await Promise.all([getAllProducts(userId), getAllCategories(userId)])
  const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0)
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length
  const outOfStockCount = products.filter(p => p.quantity === 0).length
  const now = Date.now()
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  const expiringSoonCount = products.filter(p => {
    if (!p.expiryDate) return false
    const expiry = p.expiryDate instanceof Date ? p.expiryDate.getTime() : (p.expiryDate as unknown as { toMillis: () => number }).toMillis()
    return expiry - now > 0 && expiry - now <= thirtyDays
  }).length
  return {
    totalProducts: products.length,
    totalCategories: categories.length,
    inventoryValue,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
  }
}
