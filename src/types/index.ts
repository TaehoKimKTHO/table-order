// ===== Domain Entities =====

export interface Store {
  id: number
  name: string
  storeCode: string
  createdAt: string
}

export interface RestaurantTable {
  id: number
  storeId: number
  tableNumber: number
  isOccupied: boolean
  createdAt: string
}

export interface TableSession {
  id: number
  tableId: number
  sessionToken: string
  startedAt: string
  endedAt: string | null
  status: 'active' | 'completed'
}

export interface Category {
  id: number
  storeId: number
  name: string
  sortOrder: number
  createdAt: string
}

export interface MenuItem {
  id: number
  categoryId: number
  name: string
  price: number
  description: string
  imagePath: string | null
  sortOrder: number
  isAvailable: boolean
  createdAt: string
  updatedAt: string
  categoryName?: string
}

export interface Order {
  id: number
  tableId: number
  sessionId: number
  orderNumber: string
  status: 'pending' | 'preparing' | 'completed'
  totalAmount: number
  createdAt: string
  updatedAt: string
  items?: OrderItem[]
  tableNumber?: number
}

export interface OrderItem {
  id: number
  orderId: number
  menuItemId: number
  menuName: string
  quantity: number
  unitPrice: number
  subtotal: number
}
