import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { setupTestDb, getTestDb, teardownTestDb } from '../helpers/db'

vi.mock('@/lib/db', () => ({
  getDb: () => getTestDb(),
}))

import {
  getCategories,
  getMenuItems,
  getAllMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuOrder,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/menu'

describe('Menu Module (Unit 5 관련)', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  describe('Category CRUD', () => {
    it('카테고리 목록을 조회한다', () => {
      const categories = getCategories(1)
      expect(categories.length).toBe(2) // 시드: 메인 메뉴, 사이드 메뉴
      expect(categories[0].name).toBe('메인 메뉴')
    })

    it('카테고리를 생성한다', () => {
      const cat = createCategory(1, '음료', 3)
      expect(cat.name).toBe('음료')
      expect(cat.sortOrder).toBe(3)
    })

    it('카테고리를 수정한다', () => {
      const categories = getCategories(1)
      const last = categories[categories.length - 1]
      const updated = updateCategory(last.id, { name: '음료수' })
      expect(updated.name).toBe('음료수')
    })

    it('카테고리를 삭제하면 하위 메뉴도 삭제된다', () => {
      const cat = createCategory(1, '삭제용', 99)
      createMenuItem({ name: '삭제될메뉴', price: 1000, categoryId: cat.id })
      const before = getAllMenuItems(1)
      deleteCategory(cat.id)
      const after = getAllMenuItems(1)
      expect(after.length).toBe(before.length - 1)
    })
  })

  describe('MenuItem CRUD', () => {
    it('메뉴를 생성한다', () => {
      const item = createMenuItem({
        name: '된장찌개',
        price: 8000,
        description: '두부 된장찌개',
        categoryId: 1,
      })
      expect(item.name).toBe('된장찌개')
      expect(item.price).toBe(8000)
      expect(item.categoryName).toBe('메인 메뉴')
    })

    it('메뉴를 조회한다', () => {
      const items = getMenuItems(1)
      expect(items.length).toBeGreaterThanOrEqual(2)
    })

    it('전체 메뉴를 조회한다', () => {
      const items = getAllMenuItems(1)
      expect(items.length).toBeGreaterThanOrEqual(3)
    })

    it('메뉴를 수정한다', () => {
      const items = getAllMenuItems(1)
      const item = items[0]
      const updated = updateMenuItem(item.id, { price: 16000 })
      expect(updated.price).toBe(16000)
    })

    it('메뉴 순서를 변경한다', () => {
      const items = getMenuItems(1)
      const item = items[0]
      updateMenuOrder(item.id, 99)
      const updated = getMenuItem(item.id)
      expect(updated!.sortOrder).toBe(99)
    })

    it('메뉴를 삭제한다', () => {
      const item = createMenuItem({ name: '삭제용', price: 1000, categoryId: 1 })
      deleteMenuItem(item.id)
      expect(getMenuItem(item.id)).toBeNull()
    })
  })
})
