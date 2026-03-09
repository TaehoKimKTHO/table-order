export const SCHEMA_SQL = `
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
  category_id   INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
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

-- Indexes
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
`;
