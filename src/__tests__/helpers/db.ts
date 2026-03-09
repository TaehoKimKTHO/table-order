import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let testDb: Database.Database | null = null
let testDbPath: string = ''

/**
 * 테스트용 인메모리가 아닌 임시 파일 DB를 생성합니다.
 * 각 테스트 스위트마다 독립된 DB를 사용합니다.
 */
export function setupTestDb(): Database.Database {
  testDbPath = path.join(process.cwd(), 'data', `test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`)
  const dir = path.dirname(testDbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  testDb = new Database(testDbPath)
  testDb.pragma('journal_mode = WAL')
  testDb.pragma('foreign_keys = ON')

  testDb.exec(`
    CREATE TABLE store (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      store_code TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE restaurant_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES store(id),
      table_number INTEGER NOT NULL,
      is_occupied INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(store_id, table_number)
    );
    CREATE TABLE table_session (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL REFERENCES restaurant_table(id),
      session_token TEXT NOT NULL UNIQUE,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed'))
    );
    CREATE TABLE category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES store(id),
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE menu_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES category(id),
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT DEFAULT '',
      image_path TEXT DEFAULT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE "order" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL REFERENCES restaurant_table(id),
      session_id INTEGER NOT NULL REFERENCES table_session(id),
      order_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'completed')),
      total_amount INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE order_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
      menu_item_id INTEGER NOT NULL REFERENCES menu_item(id),
      menu_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL
    );
  `)

  // 시드 데이터
  testDb.exec(`
    INSERT INTO store (name, store_code) VALUES ('테스트 매장', 'store001');
    INSERT INTO category (store_id, name, sort_order) VALUES (1, '메인 메뉴', 1), (1, '사이드 메뉴', 2);
    INSERT INTO menu_item (category_id, name, price, description, sort_order) VALUES
      (1, '불고기', 15000, '양념 소불고기', 1),
      (1, '김치찌개', 9000, '돼지고기 김치찌개', 2),
      (2, '계란말이', 7000, '치즈 계란말이', 1);
    INSERT INTO restaurant_table (store_id, table_number) VALUES (1, 1), (1, 2), (1, 3);
  `)

  return testDb
}

export function getTestDb(): Database.Database {
  if (!testDb) throw new Error('Test DB not initialized. Call setupTestDb() first.')
  return testDb
}

export function teardownTestDb() {
  if (testDb) {
    testDb.close()
    testDb = null
  }
  if (testDbPath && fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
    // WAL/SHM 파일도 정리
    if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal')
    if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm')
  }
}
