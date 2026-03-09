import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { setupTestDb, getTestDb, teardownTestDb } from '../helpers/db'

vi.mock('@/lib/db', () => ({
  getDb: () => getTestDb(),
}))

import {
  createOrder,
  getOrder,
  getAllActiveOrders,
  updateOrderStatus,
  deleteOrder,
  getTableTotalAmount,
  getOrdersByTable,
} from '@/lib/order'

describe('Order Module (Unit 5 관련)', () => {
  let sessionId: number

  beforeAll(() => {
    const db = setupTestDb()
    // 테이블 1에 활성 세션 생성
    db.prepare(
      "INSERT INTO table_session (table_id, session_token, status) VALUES (1, 'test-token-1', 'active')"
    ).run()
    sessionId = 1
    // is_occupied 업데이트
    db.prepare('UPDATE restaurant_table SET is_occupied = 1 WHERE id = 1').run()
  })

  afterAll(() => {
    teardownTestDb()
  })

  describe('createOrder', () => {
    it('주문을 생성한다', () => {
      const order = createOrder({
        tableId: 1,
        sessionId,
        items: [
          { menuItemId: 1, quantity: 2 }, // 불고기 15000 x 2
          { menuItemId: 3, quantity: 1 }, // 계란말이 7000 x 1
        ],
      })
      expect(order.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/)
      expect(order.totalAmount).toBe(37000)
      expect(order.status).toBe('pending')
      expect(order.items).toHaveLength(2)
      expect(order.items![0].menuName).toBe('불고기')
    })

    it('판매 불가 메뉴는 에러', () => {
      const db = getTestDb()
      db.prepare('UPDATE menu_item SET is_available = 0 WHERE id = 3').run()
      expect(() =>
        createOrder({ tableId: 1, sessionId, items: [{ menuItemId: 3, quantity: 1 }] })
      ).toThrow('MENU_NOT_AVAILABLE')
      db.prepare('UPDATE menu_item SET is_available = 1 WHERE id = 3').run()
    })
  })

  describe('getAllActiveOrders', () => {
    it('매장의 활성 주문을 조회한다', () => {
      const orders = getAllActiveOrders(1)
      expect(orders.length).toBeGreaterThanOrEqual(1)
      expect(orders[0].items).toBeDefined()
    })
  })

  describe('updateOrderStatus', () => {
    it('pending → preparing 전이', () => {
      const orders = getAllActiveOrders(1)
      const pendingOrder = orders.find((o) => o.status === 'pending')!
      const updated = updateOrderStatus(pendingOrder.id, 'preparing')
      expect(updated.status).toBe('preparing')
    })

    it('잘못된 전이는 에러', () => {
      const orders = getAllActiveOrders(1)
      const preparingOrder = orders.find((o) => o.status === 'preparing')!
      expect(() => updateOrderStatus(preparingOrder.id, 'pending')).toThrow('INVALID_STATUS_TRANSITION')
    })

    it('preparing → completed 전이', () => {
      const orders = getAllActiveOrders(1)
      const preparingOrder = orders.find((o) => o.status === 'preparing')!
      const updated = updateOrderStatus(preparingOrder.id, 'completed')
      expect(updated.status).toBe('completed')
    })
  })

  describe('deleteOrder', () => {
    it('주문을 삭제한다', () => {
      const order = createOrder({
        tableId: 1,
        sessionId,
        items: [{ menuItemId: 1, quantity: 1 }],
      })
      const result = deleteOrder(order.id)
      expect(result.tableId).toBe(1)
      expect(getOrder(order.id)).toBeNull()
    })

    it('없는 주문 삭제는 에러', () => {
      expect(() => deleteOrder(9999)).toThrow('ORDER_NOT_FOUND')
    })
  })

  describe('getTableTotalAmount', () => {
    it('테이블 세션의 총 주문액을 계산한다', () => {
      const total = getTableTotalAmount(1, sessionId)
      expect(total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getOrdersByTable', () => {
    it('테이블별 주문을 조회한다', () => {
      const orders = getOrdersByTable(1)
      expect(Array.isArray(orders)).toBe(true)
    })
  })
})
