import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { setupTestDb, getTestDb, teardownTestDb } from '../helpers/db'

// getDb를 테스트 DB로 모킹
vi.mock('@/lib/db', () => ({
  getDb: () => getTestDb(),
}))

import {
  createTable,
  updateTable,
  getTables,
  getTable,
  startSession,
  endSession,
  completeTable,
  getOrderHistory,
} from '@/lib/table'

describe('Table Module', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  describe('createTable', () => {
    it('새 테이블을 생성한다', () => {
      const table = createTable(1, 10)
      expect(table.tableNumber).toBe(10)
      expect(table.storeId).toBe(1)
      expect(table.isOccupied).toBe(false)
    })

    it('중복 테이블 번호는 에러를 던진다', () => {
      expect(() => createTable(1, 10)).toThrow('DUPLICATE_TABLE_NUMBER')
    })

    it('범위 밖 테이블 번호는 에러를 던진다', () => {
      expect(() => createTable(1, 0)).toThrow('INVALID_TABLE_NUMBER')
      expect(() => createTable(1, 100)).toThrow('INVALID_TABLE_NUMBER')
    })
  })

  describe('updateTable', () => {
    it('테이블 번호를 변경한다', () => {
      const table = createTable(1, 20)
      const updated = updateTable(table.id, { tableNumber: 21 })
      expect(updated.tableNumber).toBe(21)
    })

    it('존재하지 않는 테이블은 에러를 던진다', () => {
      expect(() => updateTable(9999, { tableNumber: 50 })).toThrow('TABLE_NOT_FOUND')
    })

    it('중복 번호로 변경 시 에러를 던진다', () => {
      // 테이블 1은 시드 데이터에 존재
      const table = createTable(1, 30)
      expect(() => updateTable(table.id, { tableNumber: 1 })).toThrow('DUPLICATE_TABLE_NUMBER')
    })
  })

  describe('getTables', () => {
    it('매장의 테이블 목록을 반환한다', () => {
      const tables = getTables(1)
      expect(tables.length).toBeGreaterThanOrEqual(3) // 시드 3개 + 테스트에서 추가한 것들
      expect(tables[0].tableNumber).toBeLessThanOrEqual(tables[1].tableNumber) // 정렬 확인
    })
  })

  describe('getTable', () => {
    it('테이블을 조회한다', () => {
      const table = getTable(1)
      expect(table).not.toBeNull()
      expect(table!.tableNumber).toBe(1)
    })

    it('없는 테이블은 null을 반환한다', () => {
      const table = getTable(9999)
      expect(table).toBeNull()
    })
  })

  describe('startSession / endSession', () => {
    it('세션을 시작하고 종료한다', () => {
      const session = startSession(1)
      expect(session.status).toBe('active')
      expect(session.tableId).toBe(1)
      expect(session.sessionToken).toBeTruthy()

      // 테이블이 occupied 상태인지 확인
      const table = getTable(1)
      expect(table!.isOccupied).toBe(true)

      // 같은 테이블에 다시 startSession하면 기존 세션 반환
      const sameSession = startSession(1)
      expect(sameSession.id).toBe(session.id)

      // 세션 종료
      const ended = endSession(session.id)
      expect(ended.status).toBe('completed')
      expect(ended.endedAt).not.toBeNull()

      // 테이블이 비어있는지 확인
      const tableAfter = getTable(1)
      expect(tableAfter!.isOccupied).toBe(false)
    })

    it('이미 종료된 세션을 다시 종료하면 에러', () => {
      const session = startSession(2)
      endSession(session.id)
      expect(() => endSession(session.id)).toThrow('SESSION_ALREADY_COMPLETED')
    })
  })

  describe('completeTable', () => {
    it('테이블 이용 완료 처리를 한다', () => {
      // 세션 시작
      const session = startSession(3)

      // 주문 생성 (직접 DB에 삽입)
      const db = getTestDb()
      db.prepare(
        `INSERT INTO "order" (table_id, session_id, order_number, status, total_amount) VALUES (?, ?, ?, 'pending', ?)`
      ).run(3, session.id, `ORD-TEST-${Date.now()}`, 15000)

      // 이용 완료
      const result = completeTable(3)
      expect(result.session.status).toBe('completed')
      expect(result.orders.length).toBeGreaterThanOrEqual(1)

      // 테이블 상태 확인
      const table = getTable(3)
      expect(table!.isOccupied).toBe(false)
    })

    it('활성 세션이 없으면 에러', () => {
      expect(() => completeTable(3)).toThrow('SESSION_NOT_FOUND')
    })
  })

  describe('getOrderHistory', () => {
    it('과거 주문 내역을 조회한다', () => {
      // 테이블 3은 위에서 completeTable로 세션이 종료됨
      const history = getOrderHistory(3)
      expect(history.sessions.length).toBeGreaterThanOrEqual(1)
      expect(history.sessions[0].session.status).toBe('completed')
      expect(history.sessions[0].totalAmount).toBeGreaterThanOrEqual(0)
    })

    it('내역이 없는 테이블은 빈 배열', () => {
      const newTable = createTable(1, 50)
      const history = getOrderHistory(newTable.id)
      expect(history.sessions).toHaveLength(0)
    })
  })
})
