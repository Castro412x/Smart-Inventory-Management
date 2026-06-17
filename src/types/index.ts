export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  createdAt: Date
}

export interface Product {
  id: string
  name: string
  sku: string
  categoryId: string
  categoryName: string
  description: string
  imageUrl: string
  quantity: number
  minStock: number
  costPrice: number
  sellingPrice: number
  supplier: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  createdAt: Date
}

export interface Transaction {
  id: string
  productId: string
  productName: string
  type: 'stock_in' | 'stock_out'
  quantity: number
  previousStock: number
  newStock: number
  notes: string
  timestamp: Date
}

export interface DashboardStats {
  totalProducts: number
  totalCategories: number
  inventoryValue: number
  lowStockCount: number
  outOfStockCount: number
}
