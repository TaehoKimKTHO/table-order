// Menu Module — Unit 3 (스텁: 인터페이스 기준 구현)

import { getDb } from '@/lib/db'
import type { Category, MenuItem } from '@/types'

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as number,
    storeId: row.store_id as number,
    name: row.name as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  }
}

function mapMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as number,
    categoryId: row.category_id as number,
    name: row.name as string,
    price: row.price as number,
    description: (row.description as string) || '',
    imagePath: row.image_path as string | null,
    sortOrder: row.sort_order as number,
    isAvailable: !!(row.is_available as number),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    categoryName: row.category_name as string | undefined,
  }
}

export function getCategories(storeId: number): Category[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM category WHERE store_id = ? ORDER BY sort_order').all(storeId) as Record<string, unknown>[]
  return rows.map(mapCategory)
}

export function getMenuItems(categoryId: number): MenuItem[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT mi.*, c.name as category_name FROM menu_item mi JOIN category c ON mi.category_id = c.id WHERE mi.category_id = ? ORDER BY mi.sort_order`
  ).all(categoryId) as Record<string, unknown>[]
  return rows.map(mapMenuItem)
}

export function getAllMenuItems(storeId: number): MenuItem[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT mi.*, c.name as category_name FROM menu_item mi JOIN category c ON mi.category_id = c.id WHERE c.store_id = ? ORDER BY c.sort_order, mi.sort_order`
  ).all(storeId) as Record<string, unknown>[]
  return rows.map(mapMenuItem)
}

export function getMenuItem(menuItemId: number): MenuItem | null {
  const db = getDb()
  const row = db.prepare(
    `SELECT mi.*, c.name as category_name FROM menu_item mi JOIN category c ON mi.category_id = c.id WHERE mi.id = ?`
  ).get(menuItemId) as Record<string, unknown> | undefined
  return row ? mapMenuItem(row) : null
}

export function createMenuItem(data: {
  name: string; price: number; description?: string; categoryId: number; imagePath?: string
}): MenuItem {
  const db = getDb()
  const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM menu_item WHERE category_id = ?').get(data.categoryId) as { next: number }
  const result = db.prepare(
    `INSERT INTO menu_item (category_id, name, price, description, image_path, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(data.categoryId, data.name, data.price, data.description || '', data.imagePath || null, maxSort.next)
  return getMenuItem(result.lastInsertRowid as number)!
}

export function updateMenuItem(menuItemId: number, data: Partial<{
  name: string; price: number; description: string; categoryId: number; imagePath: string | null; isAvailable: boolean
}>): MenuItem {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price) }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
  if (data.categoryId !== undefined) { fields.push('category_id = ?'); values.push(data.categoryId) }
  if (data.imagePath !== undefined) { fields.push('image_path = ?'); values.push(data.imagePath) }
  if (data.isAvailable !== undefined) { fields.push('is_available = ?'); values.push(data.isAvailable ? 1 : 0) }

  fields.push("updated_at = datetime('now')")
  values.push(menuItemId)

  db.prepare(`UPDATE menu_item SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return getMenuItem(menuItemId)!
}

export function deleteMenuItem(menuItemId: number): void {
  const db = getDb()
  db.prepare('DELETE FROM menu_item WHERE id = ?').run(menuItemId)
}

export function updateMenuOrder(menuItemId: number, sortOrder: number): void {
  const db = getDb()
  db.prepare('UPDATE menu_item SET sort_order = ? WHERE id = ?').run(sortOrder, menuItemId)
}

export function createCategory(storeId: number, name: string, sortOrder?: number): Category {
  const db = getDb()
  const order = sortOrder ?? ((db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM category WHERE store_id = ?').get(storeId) as { next: number }).next)
  const result = db.prepare('INSERT INTO category (store_id, name, sort_order) VALUES (?, ?, ?)').run(storeId, name, order)
  const row = db.prepare('SELECT * FROM category WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>
  return mapCategory(row)
}

export function updateCategory(categoryId: number, data: Partial<{ name: string; sortOrder: number }>): Category {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(data.sortOrder) }
  values.push(categoryId)
  db.prepare(`UPDATE category SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  const row = db.prepare('SELECT * FROM category WHERE id = ?').get(categoryId) as Record<string, unknown>
  return mapCategory(row)
}

export function deleteCategory(categoryId: number): void {
  const db = getDb()
  db.prepare('DELETE FROM menu_item WHERE category_id = ?').run(categoryId)
  db.prepare('DELETE FROM category WHERE id = ?').run(categoryId)
}
