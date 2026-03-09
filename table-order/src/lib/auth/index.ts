import { v4 as uuidv4 } from 'uuid';
import { getDb, queryOne, run } from '@/lib/db';
import type { Store, RestaurantTable, TableSession, LoginResponse, SessionValidation } from '@/types';

export async function loginTable(storeCode: string, tableNumber: number): Promise<LoginResponse> {
  await getDb();

  const store = queryOne<Store>('SELECT * FROM store WHERE store_code = ?', [storeCode]);
  if (!store) {
    throw { code: 'STORE_NOT_FOUND', message: '매장을 찾을 수 없습니다.', status: 404 };
  }

  const table = queryOne<RestaurantTable>(
    'SELECT * FROM restaurant_table WHERE store_id = ? AND table_number = ?',
    [store.id, tableNumber]
  );
  if (!table) {
    throw { code: 'TABLE_NOT_FOUND', message: '테이블을 찾을 수 없습니다.', status: 404 };
  }

  const activeSession = queryOne<TableSession>(
    "SELECT * FROM table_session WHERE table_id = ? AND status = 'active'",
    [table.id]
  );

  if (activeSession) {
    return {
      sessionToken: activeSession.session_token,
      tableId: table.id,
      tableNumber: table.table_number,
      storeName: store.name,
    };
  }

  const sessionToken = uuidv4();
  run('INSERT INTO table_session (table_id, session_token) VALUES (?, ?)', [table.id, sessionToken]);
  run('UPDATE restaurant_table SET is_occupied = 1 WHERE id = ?', [table.id]);

  return { sessionToken, tableId: table.id, tableNumber: table.table_number, storeName: store.name };
}

export async function validateSession(sessionToken: string): Promise<SessionValidation> {
  await getDb();

  const row = queryOne<{ session_id: number; table_id: number; status: string; table_number: number }>(
    `SELECT ts.id as session_id, ts.table_id, ts.status, rt.table_number
     FROM table_session ts
     JOIN restaurant_table rt ON rt.id = ts.table_id
     WHERE ts.session_token = ?`,
    [sessionToken]
  );

  if (!row) {
    throw { code: 'SESSION_NOT_FOUND', message: '세션을 찾을 수 없습니다.', status: 401 };
  }

  if (row.status === 'completed') {
    throw { code: 'SESSION_EXPIRED', message: '세션이 만료되었습니다.', status: 401 };
  }

  return { tableId: row.table_id, sessionId: row.session_id, tableNumber: row.table_number, isValid: true };
}

export async function getActiveSession(tableId: number): Promise<TableSession | null> {
  await getDb();
  const session = queryOne<TableSession>(
    "SELECT * FROM table_session WHERE table_id = ? AND status = 'active'",
    [tableId]
  );
  return session ?? null;
}
