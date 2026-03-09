/**
 * Table Module — Unit 5: 테이블 관리 + 세션 관리
 */

import { getDb, queryAll, queryOne, run } from '@/lib/db';
import { getOrdersBySession } from '@/lib/order';
import type {
  RestaurantTable,
  TableSession,
  OrderWithItems,
} from '@/types';

export async function createTable(
  storeId: number,
  tableNumber: number
): Promise<RestaurantTable> {
  await getDb();

  if (tableNumber < 1 || tableNumber > 99) {
    throw { code: 'INVALID_TABLE_NUMBER', message: '테이블 번호는 1~99 범위여야 합니다.', status: 400 };
  }

  const existing = queryOne<RestaurantTable>(
    'SELECT id FROM restaurant_table WHERE store_id = ? AND table_number = ?',
    [storeId, tableNumber]
  );
  if (existing) {
    throw { code: 'DUPLICATE_TABLE_NUMBER', message: '이미 존재하는 테이블 번호입니다.', status: 409 };
  }

  run(
    'INSERT INTO restaurant_table (store_id, table_number) VALUES (?, ?)',
    [storeId, tableNumber]
  );

  const created = queryOne<RestaurantTable>(
    'SELECT * FROM restaurant_table WHERE store_id = ? AND table_number = ?',
    [storeId, tableNumber]
  );
  return created!;
}

export async function updateTable(
  tableId: number,
  data: Partial<{ tableNumber: number }>
): Promise<RestaurantTable> {
  await getDb();

  const table = queryOne<RestaurantTable>(
    'SELECT * FROM restaurant_table WHERE id = ?',
    [tableId]
  );
  if (!table) {
    throw { code: 'TABLE_NOT_FOUND', message: '테이블을 찾을 수 없습니다.', status: 404 };
  }

  if (data.tableNumber !== undefined) {
    if (data.tableNumber < 1 || data.tableNumber > 99) {
      throw { code: 'INVALID_TABLE_NUMBER', message: '테이블 번호는 1~99 범위여야 합니다.', status: 400 };
    }
    const dup = queryOne<RestaurantTable>(
      'SELECT id FROM restaurant_table WHERE store_id = ? AND table_number = ? AND id != ?',
      [table.store_id, data.tableNumber, tableId]
    );
    if (dup) {
      throw { code: 'DUPLICATE_TABLE_NUMBER', message: '이미 존재하는 테이블 번호입니다.', status: 409 };
    }
    run('UPDATE restaurant_table SET table_number = ? WHERE id = ?', [data.tableNumber, tableId]);
  }

  return queryOne<RestaurantTable>('SELECT * FROM restaurant_table WHERE id = ?', [tableId])!;
}

export async function getTables(
  storeId: number
): Promise<(RestaurantTable & { activeSession?: TableSession; totalAmount?: number })[]> {
  await getDb();

  const tables = queryAll<RestaurantTable>(
    'SELECT * FROM restaurant_table WHERE store_id = ? ORDER BY table_number',
    [storeId]
  );

  return tables.map((table) => {
    const session = queryOne<TableSession>(
      "SELECT * FROM table_session WHERE table_id = ? AND status = 'active' LIMIT 1",
      [table.id]
    );

    let totalAmount: number | undefined;
    if (session) {
      const row = queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM "order" WHERE session_id = ?`,
        [session.id]
      );
      totalAmount = row?.total ?? 0;
    }

    return { ...table, activeSession: session, totalAmount };
  });
}

export async function getTable(tableId: number): Promise<RestaurantTable | null> {
  await getDb();
  const table = queryOne<RestaurantTable>(
    'SELECT * FROM restaurant_table WHERE id = ?',
    [tableId]
  );
  return table ?? null;
}

export async function startSession(tableId: number): Promise<TableSession> {
  await getDb();
  const { v4: uuidv4 } = await import('uuid');

  const existing = queryOne<TableSession>(
    "SELECT * FROM table_session WHERE table_id = ? AND status = 'active'",
    [tableId]
  );
  if (existing) return existing;

  const token = uuidv4();
  run('INSERT INTO table_session (table_id, session_token) VALUES (?, ?)', [tableId, token]);
  run('UPDATE restaurant_table SET is_occupied = 1 WHERE id = ?', [tableId]);

  const session = queryOne<TableSession>(
    'SELECT * FROM table_session WHERE table_id = ? AND session_token = ?',
    [tableId, token]
  );
  return session!;
}

export async function endSession(sessionId: number): Promise<TableSession> {
  await getDb();

  const session = queryOne<TableSession>(
    'SELECT * FROM table_session WHERE id = ?',
    [sessionId]
  );
  if (!session) {
    throw { code: 'SESSION_NOT_FOUND', message: '세션을 찾을 수 없습니다.', status: 404 };
  }
  if (session.status === 'completed') {
    throw { code: 'SESSION_ALREADY_COMPLETED', message: '이미 완료된 세션입니다.', status: 400 };
  }

  run(
    "UPDATE table_session SET status = 'completed', ended_at = datetime('now') WHERE id = ?",
    [sessionId]
  );
  run('UPDATE restaurant_table SET is_occupied = 0 WHERE id = ?', [session.table_id]);

  return queryOne<TableSession>('SELECT * FROM table_session WHERE id = ?', [sessionId])!;
}

export async function completeTable(
  tableId: number
): Promise<{ session: TableSession; orders: OrderWithItems[] }> {
  await getDb();

  const session = queryOne<TableSession>(
    "SELECT * FROM table_session WHERE table_id = ? AND status = 'active'",
    [tableId]
  );
  if (!session) {
    throw { code: 'SESSION_NOT_FOUND', message: '활성 세션이 없습니다.', status: 404 };
  }

  const orders = await getOrdersBySession(session.id);

  run(
    "UPDATE table_session SET status = 'completed', ended_at = datetime('now') WHERE id = ?",
    [session.id]
  );
  run('UPDATE restaurant_table SET is_occupied = 0 WHERE id = ?', [tableId]);

  const updatedSession = queryOne<TableSession>(
    'SELECT * FROM table_session WHERE id = ?',
    [session.id]
  );

  return { session: updatedSession!, orders };
}

export async function getOrderHistory(
  tableId: number,
  dateFilter?: { from?: string; to?: string }
): Promise<{ sessions: Array<{ session: TableSession; orders: OrderWithItems[]; totalAmount: number }> }> {
  await getDb();

  let query = "SELECT * FROM table_session WHERE table_id = ? AND status = 'completed'";
  const params: unknown[] = [tableId];

  if (dateFilter?.from) {
    query += ' AND started_at >= ?';
    params.push(dateFilter.from);
  }
  if (dateFilter?.to) {
    query += ' AND started_at <= ?';
    params.push(dateFilter.to + 'T23:59:59');
  }
  query += ' ORDER BY started_at DESC';

  const sessionRows = queryAll<TableSession>(query, params);

  const sessions = [];
  for (const sess of sessionRows) {
    const orders = await getOrdersBySession(sess.id);
    const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
    sessions.push({ session: sess, orders, totalAmount });
  }

  return { sessions };
}
