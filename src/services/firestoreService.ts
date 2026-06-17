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
  callback: (products: Product[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const q = query(productsRef, ...constraints)
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
    callback(products)
  })
}

export async function getAllProducts(): Promise<Product[]> {
  const snap = await getDocs(productsRef)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } as Product : null
}

export async function addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(productsRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateProduct(id: string, data: Partial<Product>) {
  await updateDoc(doc(db, 'products', id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, 'products', id))
}

export async function getProductBySku(sku: string, excludeId?: string): Promise<Product | null> {
  const q = query(productsRef, where('sku', '==', sku))
  const snap = await getDocs(q)
  const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
  const match = excludeId ? products.find(p => p.id !== excludeId) : products[0]
  return match || null
}

// Categories
export function subscribeCategories(callback: (categories: Category[]) => void): Unsubscribe {
  const q = query(categoriesRef, orderBy('name'))
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category))
    callback(categories)
  })
}

export async function getAllCategories(): Promise<Category[]> {
  const snap = await getDocs(categoriesRef)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category))
}

export async function addCategory(name: string) {
  const docRef = await addDoc(categoriesRef, { name, createdAt: Timestamp.now() })
  return docRef.id
}

export async function updateCategory(id: string, name: string) {
  await updateDoc(doc(db, 'categories', id), { name })
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, 'categories', id))
}

export async function getCategoryByName(name: string): Promise<Category | null> {
  const q = query(categoriesRef, where('name', '==', name))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Category
}

// Transactions
export function subscribeTransactions(
  callback: (transactions: Transaction[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const q = query(transactionsRef, orderBy('timestamp', 'desc'), ...constraints)
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
    callback(transactions)
  })
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const q = query(transactionsRef, orderBy('timestamp', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
}

// Stock operations (atomic batch)
export async function performStockOperation(
  productId: string,
  currentQuantity: number,
  quantityChange: number,
  type: 'stock_in' | 'stock_out',
  notes: string
) {
  const batch = writeBatch(db)
  const newStock = type === 'stock_in' ? currentQuantity + quantityChange : currentQuantity - quantityChange
  batch.update(doc(db, 'products', productId), { quantity: newStock, updatedAt: Timestamp.now() })
  batch.set(doc(collection(db, 'transactions')), {
    productId,
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
export async function getDashboardStats(): Promise<{
  totalProducts: number
  totalCategories: number
  inventoryValue: number
  lowStockCount: number
  outOfStockCount: number
}> {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()])
  const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0)
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length
  const outOfStockCount = products.filter(p => p.quantity === 0).length
  return {
    totalProducts: products.length,
    totalCategories: categories.length,
    inventoryValue,
    lowStockCount,
    outOfStockCount,
  }
}
