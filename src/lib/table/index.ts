// Table Module — Unit 5

import { getDb } from '@/lib/db'
import { getOrdersBySession } from '@/lib/order'
import type { RestaurantTable, TableSession, Order } from '@/types'

function mapTable(row: Record<string, unknown>): RestaurantTable {
  return {
    id: row.id as number,
    storeId: row.store_id as number,
    tableNumber: row.table_number as number,
    isOccupied: !!(row.is_occupied as number),
    createdAt: row.created_at as string,
  }
}

function mapSession(row: Record<string, unknown>): TableSession {
  return {
    id: row.id as number,
    tableId: row.table_id as number,
    sessionToken: row.session_token as string,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | null,
    status: row.status as TableSession['status'],
  }
}

export function createTable(storeId: number, tableNumber: number): RestaurantTable {
  if (tableNumber < 1 || tableNumber > 99) throw new Error('INVALID_TABLE_NUMBER')

  const db = getDb()
  const existing = db.prepare(
    'SELECT id FROM restaurant_table WHERE store_id = ? AND table_number = ?'
  ).get(storeId, tableNumber)
  if (existing) throw new Error('DUPLICATE_TABLE_NUMBER')

  const result = db.prepare(
    'INSERT INTO restaurant_table (store_id, table_number) VALUES (?, ?)'
  ).run(storeId, tableNumber)

  const row = db.prepare('SELECT * FROM restaurant_table WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>
  return mapTable(row)
}

export function updateTable(tableId: number, data: Partial<{ tableNumber: number }>): RestaurantTable {
  const db = getDb()
  if (data.tableNumber !== undefined) {
    if (data.tableNumber < 1 || data.tableNumber > 99) throw new Error('INVALID_TABLE_NUMBER')
    const table = db.prepare('SELECT store_id FROM restaurant_table WHERE id = ?').get(tableId) as { store_id: number } | undefined
    if (!table) throw new Error('TABLE_NOT_FOUND')
    const dup = db.prepare(
      'SELECT id FROM restaurant_table WHERE store_id = ? AND table_number = ? AND id != ?'
    ).get(table.store_id, data.tableNumber, tableId)
    if (dup) throw new Error('DUPLICATE_TABLE_NUMBER')
    db.prepare('UPDATE restaurant_table SET table_number = ? WHERE id = ?').run(data.tableNumber, tableId)
  }
  const row = db.prepare('SELECT * FROM restaurant_table WHERE id = ?').get(tableId) as Record<string, unknown>
  if (!row) throw new Error('TABLE_NOT_FOUND')
  return mapTable(row)
}

export function getTables(storeId: number): (RestaurantTable & { activeSession?: TableSession; totalAmount?: number })[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM restaurant_table WHERE store_id = ? ORDER BY table_number'
  ).all(storeId) as Record<string, unknown>[]

  return rows.map((row) => {
    const table = mapTable(row)
    const sessionRow = db.prepare(
      "SELECT * FROM table_session WHERE table_id = ? AND status = 'active' LIMIT 1"
    ).get(table.id) as Record<string, unknown> | undefined

    let activeSession: TableSession | undefined
    let totalAmount: number | undefined

    if (sessionRow) {
      activeSession = mapSession(sessionRow)
      const amountRow = db.prepare(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM "order" WHERE session_id = ?`
      ).get(activeSession.id) as { total: number }
      totalAmount = amountRow.total
    }

    return { ...table, activeSession, totalAmount }
  })
}

export function getTable(tableId: number): RestaurantTable | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM restaurant_table WHERE id = ?').get(tableId) as Record<string, unknown> | undefined
  return row ? mapTable(row) : null
}

export function startSession(tableId: number): TableSession {
  const db = getDb()
  const { v4: uuidv4 } = require('uuid')

  const existing = db.prepare(
    "SELECT * FROM table_session WHERE table_id = ? AND status = 'active'"
  ).get(tableId) as Record<string, unknown> | undefined
  if (existing) return mapSession(existing)

  const token = uuidv4()
  const result = db.prepare(
    'INSERT INTO table_session (table_id, session_token) VALUES (?, ?)'
  ).run(tableId, token)
  db.prepare('UPDATE restaurant_table SET is_occupied = 1 WHERE id = ?').run(tableId)

  const row = db.prepare('SELECT * FROM table_session WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>
  return mapSession(row)
}

export function endSession(sessionId: number): TableSession {
  const db = getDb()
  const session = db.prepare('SELECT * FROM table_session WHERE id = ?').get(sessionId) as Record<string, unknown> | undefined
  if (!session) throw new Error('SESSION_NOT_FOUND')
  if ((session.status as string) === 'completed') throw new Error('SESSION_ALREADY_COMPLETED')

  db.prepare(
    "UPDATE table_session SET status = 'completed', ended_at = datetime('now') WHERE id = ?"
  ).run(sessionId)
  db.prepare('UPDATE restaurant_table SET is_occupied = 0 WHERE id = ?').run(session.table_id as number)

  const row = db.prepare('SELECT * FROM table_session WHERE id = ?').get(sessionId) as Record<string, unknown>
  return mapSession(row)
}

export function completeTable(tableId: number): { session: TableSession; orders: Order[] } {
  const db = getDb()

  const sessionRow = db.prepare(
    "SELECT * FROM table_session WHERE table_id = ? AND status = 'active'"
  ).get(tableId) as Record<string, unknown> | undefined
  if (!sessionRow) throw new Error('SESSION_NOT_FOUND')

  const session = mapSession(sessionRow)
  const orders = getOrdersBySession(session.id)

  // End session
  db.prepare(
    "UPDATE table_session SET status = 'completed', ended_at = datetime('now') WHERE id = ?"
  ).run(session.id)
  db.prepare('UPDATE restaurant_table SET is_occupied = 0 WHERE id = ?').run(tableId)

  const updatedRow = db.prepare('SELECT * FROM table_session WHERE id = ?').get(session.id) as Record<string, unknown>
  return { session: mapSession(updatedRow), orders }
}

export function getOrderHistory(
  tableId: number,
  dateFilter?: { from?: string; to?: string }
): { sessions: Array<{ session: TableSession; orders: Order[]; totalAmount: number }> } {
  const db = getDb()

  let query = "SELECT * FROM table_session WHERE table_id = ? AND status = 'completed'"
  const params: unknown[] = [tableId]

  if (dateFilter?.from) {
    query += ' AND started_at >= ?'
    params.push(dateFilter.from)
  }
  if (dateFilter?.to) {
    query += ' AND started_at <= ?'
    params.push(dateFilter.to + 'T23:59:59')
  }
  query += ' ORDER BY started_at DESC'

  const sessionRows = db.prepare(query).all(...params) as Record<string, unknown>[]

  const sessions = sessionRows.map((row) => {
    const session = mapSession(row)
    const orders = getOrdersBySession(session.id)
    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    return { session, orders, totalAmount }
  })

  return { sessions }
}
