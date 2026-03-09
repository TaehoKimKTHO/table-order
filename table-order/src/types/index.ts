// ===== Entity Types =====

export interface Store {
  id: number;
  name: string;
  store_code: string;
  created_at: string;
}

export interface RestaurantTable {
  id: number;
  store_id: number;
  table_number: number;
  is_occupied: number; // 0 or 1
  created_at: string;
}

export interface TableSession {
  id: number;
  table_id: number;
  session_token: string;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'completed';
}

export interface Category {
  id: number;
  store_id: number;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  price: number;
  description: string;
  image_path: string | null;
  sort_order: number;
  is_available: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  table_id: number;
  session_id: number;
  order_number: string;
  status: 'pending' | 'preparing' | 'completed';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// ===== API Types =====

export interface LoginRequest {
  storeCode: string;
  tableNumber: number;
}

export interface LoginResponse {
  sessionToken: string;
  tableId: number;
  tableNumber: number;
  storeName: string;
}

export interface SessionValidation {
  tableId: number;
  sessionId: number;
  tableNumber: number;
  isValid: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ===== SSE Types =====

export type SSEClientType = 'customer' | 'admin';

export type SSEEventType =
  | 'connected'
  | 'order:new'
  | 'order:status'
  | 'order:deleted'
  | 'table:completed';

export interface SSEMessage {
  event: SSEEventType;
  data: Record<string, unknown>;
}

// ===== Order Request Types =====

export interface CreateOrderItem {
  menuItemId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}
