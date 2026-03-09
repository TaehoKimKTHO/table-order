/**
 * Order Module 타입 정의
 */

export type OrderStatus = 'pending' | 'preparing' | 'completed';

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  tableId: number;
  sessionId: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

/** 주문 생성 요청 */
export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  menuItemId: number;
  quantity: number;
}

/** 주문 생성 응답 */
export interface CreateOrderResponse {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  createdAt: string;
}

/** 장바구니 아이템 (클라이언트 사이드) */
export interface CartItemData {
  menuItemId: number;
  name: string;
  price: number;
  imagePath: string | null;
  quantity: number;
}
