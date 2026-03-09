import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'table-order.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initializeDb(db)
  }
  return db
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS store (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      store_code  TEXT    NOT NULL UNIQUE,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS restaurant_table (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id      INTEGER NOT NULL REFERENCES store(id),
      table_number  INTEGER NOT NULL,
      is_occupied   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(store_id, table_number)
    );

    CREATE TABLE IF NOT EXISTS table_session (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id       INTEGER NOT NULL REFERENCES restaurant_table(id),
      session_token  TEXT    NOT NULL UNIQUE,
      started_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      ended_at       TEXT    DEFAULT NULL,
      status         TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed'))
    );

    CREATE TABLE IF NOT EXISTS category (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id    INTEGER NOT NULL REFERENCES store(id),
      name        TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menu_item (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id   INTEGER NOT NULL REFERENCES category(id),
      name          TEXT    NOT NULL,
      price         INTEGER NOT NULL,
      description   TEXT    DEFAULT '',
      image_path    TEXT    DEFAULT NULL,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      is_available  INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS "order" (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id      INTEGER NOT NULL REFERENCES restaurant_table(id),
      session_id    INTEGER NOT NULL REFERENCES table_session(id),
      order_number  TEXT    NOT NULL UNIQUE,
      status        TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'completed')),
      total_amount  INTEGER NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_item (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id      INTEGER NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
      menu_item_id  INTEGER NOT NULL REFERENCES menu_item(id),
      menu_name     TEXT    NOT NULL,
      quantity      INTEGER NOT NULL,
      unit_price    INTEGER NOT NULL,
      subtotal      INTEGER NOT NULL
    );
  `)

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_restaurant_table_store ON restaurant_table(store_id);
    CREATE INDEX IF NOT EXISTS idx_table_session_table ON table_session(table_id);
    CREATE INDEX IF NOT EXISTS idx_table_session_status ON table_session(table_id, status);
    CREATE INDEX IF NOT EXISTS idx_category_store ON category(store_id);
    CREATE INDEX IF NOT EXISTS idx_category_sort ON category(store_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_menu_item_category ON menu_item(category_id);
    CREATE INDEX IF NOT EXISTS idx_menu_item_sort ON menu_item(category_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_order_table ON "order"(table_id);
    CREATE INDEX IF NOT EXISTS idx_order_session ON "order"(session_id);
    CREATE INDEX IF NOT EXISTS idx_order_status ON "order"(status);
    CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(order_id);
  `)

  // Seed data
  const storeCount = db.prepare('SELECT COUNT(*) as cnt FROM store').get() as { cnt: number }
  if (storeCount.cnt === 0) {
    db.exec(`
      INSERT INTO store (name, store_code) VALUES ('테스트 매장', 'store001');
      INSERT INTO category (store_id, name, sort_order) VALUES (1, '메인 메뉴', 1), (1, '사이드 메뉴', 2), (1, '음료', 3);
      INSERT INTO menu_item (category_id, name, price, description, sort_order) VALUES
        (1, '불고기', 15000, '양념 소불고기', 1),
        (1, '김치찌개', 9000, '돼지고기 김치찌개', 2),
        (1, '된장찌개', 8000, '두부 된장찌개', 3),
        (2, '계란말이', 7000, '치즈 계란말이', 1),
        (2, '감자전', 6000, '바삭한 감자전', 2),
        (3, '콜라', 2000, '코카콜라 355ml', 1),
        (3, '사이다', 2000, '칠성사이다 355ml', 2);
      INSERT INTO restaurant_table (store_id, table_number) VALUES (1, 1), (1, 2), (1, 3);
    `)
  }
}
