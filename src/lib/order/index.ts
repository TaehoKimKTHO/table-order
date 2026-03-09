// Order Module — Unit 2 (스텁: 인터페이스 기준 구현)

import { getDb } from '@/lib/db'
import type { Order, OrderItem } from '@/types'

interface CreateOrderInput {
  tableId: number
  sessionId: number
  items: { menuItemId: number; quantity: number }[]
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as number,
    tableId: row.table_id as number,
    sessionId: row.session_id as number,
    orderNumber: row.order_number as string,
    status: row.status as Order['status'],
    totalAmount: row.total_amount as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    tableNumber: row.table_number as number | undefined,
  }
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id as number,
    orderId: row.order_id as number,
    menuItemId: row.menu_item_id as number,
    menuName: row.menu_name as string,
    quantity: row.quantity as number,
    unitPrice: row.unit_price as number,
    subtotal: row.subtotal as number,
  }
}

export function createOrder(input: CreateOrderInput): Order {
  const db = getDb()

  // Generate order number
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const countRow = db.prepare(
    `SELECT COUNT(*) as cnt FROM "order" WHERE order_number LIKE ?`
  ).get(`ORD-${today}-%`) as { cnt: number }
  const seq = String(countRow.cnt + 1).padStart(4, '0')
  const orderNumber = `ORD-${today}-${seq}`

  // Calculate total
  let totalAmount = 0
  const itemsToInsert: { menuItemId: number; menuName: string; quantity: number; unitPrice: number; subtotal: number }[] = []

  for (const item of input.items) {
    const menu = db.prepare('SELECT id, name, price, is_available FROM menu_item WHERE id = ?').get(item.menuItemId) as Record<string, unknown> | undefined
    if (!menu || !(menu.is_available as number)) throw new Error('MENU_NOT_AVAILABLE')
    const subtotal = (menu.price as number) * item.quantity
    totalAmount += subtotal
    itemsToInsert.push({
      menuItemId: item.menuItemId,
      menuName: menu.name as string,
      quantity: item.quantity,
      unitPrice: menu.price as number,
      subtotal,
    })
  }

  const insertOrder = db.prepare(
    `INSERT INTO "order" (table_id, session_id, order_number, status, total_amount) VALUES (?, ?, ?, 'pending', ?)`
  )
  const insertItem = db.prepare(
    `INSERT INTO order_item (order_id, menu_item_id, menu_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)`
  )

  const tx = db.transaction(() => {
    const result = insertOrder.run(input.tableId, input.sessionId, orderNumber, totalAmount)
    const orderId = result.lastInsertRowid as number
    for (const item of itemsToInsert) {
      insertItem.run(orderId, item.menuItemId, item.menuName, item.quantity, item.unitPrice, item.subtotal)
    }
    return orderId
  })

  const orderId = tx()
  return getOrder(orderId)!
}

export function getOrder(orderId: number): Order | null {
  const db = getDb()
  const row = db.prepare(
    `SELECT o.*, rt.table_number FROM "order" o JOIN restaurant_table rt ON o.table_id = rt.id WHERE o.id = ?`
  ).get(orderId) as Record<string, unknown> | undefined
  if (!row) return null

  const order = mapOrder(row)
  const items = db.prepare('SELECT * FROM order_item WHERE order_id = ?').all(orderId) as Record<string, unknown>[]
  order.items = items.map(mapOrderItem)
  return order
}

export function getOrdersBySession(sessionId: number): Order[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT o.*, rt.table_number FROM "order" o JOIN restaurant_table rt ON o.table_id = rt.id WHERE o.session_id = ? ORDER BY o.created_at DESC`
  ).all(sessionId) as Record<string, unknown>[]
  return rows.map((row) => {
    const order = mapOrder(row)
    const items = db.prepare('SELECT * FROM order_item WHERE order_id = ?').all(order.id) as Record<string, unknown>[]
    order.items = items.map(mapOrderItem)
    return order
  })
}

export function getOrdersByTable(tableId: number, activeOnly = true): Order[] {
  const db = getDb()
  let query = `SELECT o.*, rt.table_number FROM "order" o JOIN restaurant_table rt ON o.table_id = rt.id WHERE o.table_id = ?`
  if (activeOnly) {
    query += ` AND o.session_id IN (SELECT id FROM table_session WHERE table_id = ? AND status = 'active')`
  }
  query += ' ORDER BY o.created_at DESC'

  const params = activeOnly ? [tableId, tableId] : [tableId]
  const rows = db.prepare(query).all(...params) as Record<string, unknown>[]
  return rows.map((row) => {
    const order = mapOrder(row)
    const items = db.prepare('SELECT * FROM order_item WHERE order_id = ?').all(order.id) as Record<string, unknown>[]
    order.items = items.map(mapOrderItem)
    return order
  })
}

export function getAllActiveOrders(storeId: number): Order[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT o.*, rt.table_number
    FROM "order" o
    JOIN restaurant_table rt ON o.table_id = rt.id
    JOIN table_session ts ON o.session_id = ts.id
    WHERE rt.store_id = ? AND ts.status = 'active'
    ORDER BY o.created_at DESC
  `).all(storeId) as Record<string, unknown>[]

  return rows.map((row) => {
    const order = mapOrder(row)
    const items = db.prepare('SELECT * FROM order_item WHERE order_id = ?').all(order.id) as Record<string, unknown>[]
    order.items = items.map(mapOrderItem)
    return order
  })
}

export function updateOrderStatus(orderId: number, status: Order['status']): Order {
  const db = getDb()
  const current = db.prepare(`SELECT status FROM "order" WHERE id = ?`).get(orderId) as { status: string } | undefined
  if (!current) throw new Error('ORDER_NOT_FOUND')

  const validTransitions: Record<string, string> = { pending: 'preparing', preparing: 'completed' }
  if (validTransitions[current.status] !== status) throw new Error('INVALID_STATUS_TRANSITION')

  db.prepare(`UPDATE "order" SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, orderId)
  return getOrder(orderId)!
}

export function deleteOrder(orderId: number): { tableId: number } {
  const db = getDb()
  const order = db.prepare(`SELECT table_id FROM "order" WHERE id = ?`).get(orderId) as { table_id: number } | undefined
  if (!order) throw new Error('ORDER_NOT_FOUND')
  db.prepare(`DELETE FROM "order" WHERE id = ?`).run(orderId)
  return { tableId: order.table_id }
}

export function getTableTotalAmount(tableId: number, sessionId: number): number {
  const db = getDb()
  const row = db.prepare(
    `SELECT COALESCE(SUM(total_amount), 0) as total FROM "order" WHERE table_id = ? AND session_id = ?`
  ).get(tableId, sessionId) as { total: number }
  return row.total
}
