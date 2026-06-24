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
  }, (error) => {
    console.error('Firestore subscription error:', error)
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
  const batch = writeBatch(db)
  const productRef = doc(collection(db, 'products'))
  batch.set(productRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  batch.set(doc(collection(db, 'transactions')), {
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
  }, (error) => {
    console.error('Categories subscription error:', error)
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

const DEFAULT_CATEGORIES = [
  'Drinks', 'Noodles', 'Biscuits', 'Toiletries', 'Toothpaste',
  'Books', 'Sweets', 'Bags', 'Sanitary Pads', 'Soaps',
  'Beverages', 'Eggs', 'Air Freshener',
]

export async function seedDefaultCategories() {
  const existing = await getAllCategories()
  const existingNames = new Set(existing.map(c => c.name.toLowerCase()))
  const toAdd = DEFAULT_CATEGORIES.filter(c => !existingNames.has(c.toLowerCase()))
  await Promise.all(toAdd.map(name => addCategory(name)))
  return toAdd.length
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
  }, (error) => {
    console.error('Transactions subscription error:', error)
  })
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const q = query(transactionsRef, orderBy('timestamp', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
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
