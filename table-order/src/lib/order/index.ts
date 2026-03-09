import { getDb, queryAll, queryOne, run } from '@/lib/db';
import type { Order, OrderItem, OrderWithItems, MenuItem, TableSession, CreateOrderItem } from '@/types';

// Allowed status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['preparing'],
  preparing: ['completed'],
  completed: [],
};

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${date}-`;

  const last = queryOne<{ order_number: string }>(
    `SELECT order_number FROM "order" WHERE order_number LIKE ? ORDER BY order_number DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let seq = 1;
  if (last) {
    const lastSeq = parseInt(last.order_number.slice(-4), 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, '0')}`;
}

export async function createOrder(
  tableId: number,
  sessionId: number,
  items: CreateOrderItem[]
): Promise<OrderWithItems> {
  await getDb();

  // 1. Validate items not empty
  if (!items || items.length === 0) {
    throw { code: 'EMPTY_ORDER', message: '주문 항목이 비어있습니다.', status: 400 };
  }

  // 2. Validate session
  const session = queryOne<TableSession>(
    'SELECT * FROM table_session WHERE id = ?',
    [sessionId]
  );
  if (!session) {
    throw { code: 'SESSION_NOT_FOUND', message: '세션을 찾을 수 없습니다.', status: 401 };
  }
  if (session.status !== 'active' || session.table_id !== tableId) {
    throw { code: 'SESSION_NOT_ACTIVE', message: '활성 세션이 아닙니다.', status: 400 };
  }

  // 3. Validate each item and collect snapshots
  const orderItems: { menuItemId: number; menuName: string; unitPrice: number; quantity: number; subtotal: number }[] = [];

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw { code: 'INVALID_QUANTITY', message: '수량은 1~99 범위여야 합니다.', status: 400 };
    }

    const menu = queryOne<MenuItem>(
      'SELECT * FROM menu_item WHERE id = ?',
      [item.menuItemId]
    );
    if (!menu) {
      throw { code: 'MENU_NOT_FOUND', message: '메뉴를 찾을 수 없습니다.', status: 404 };
    }
    if (menu.is_available !== 1) {
      throw { code: 'MENU_NOT_AVAILABLE', message: '판매 중지된 메뉴입니다.', status: 400 };
    }

    const subtotal = item.quantity * menu.price;
    orderItems.push({
      menuItemId: menu.id,
      menuName: menu.name,
      unitPrice: menu.price,
      quantity: item.quantity,
      subtotal,
    });
  }

  // 4. Calculate total
  const totalAmount = orderItems.reduce((sum, oi) => sum + oi.subtotal, 0);

  // 5. Generate order number
  const orderNumber = generateOrderNumber();

  // 6. Insert in transaction
  run('BEGIN TRANSACTION', []);
  try {
    run(
      `INSERT INTO "order" (table_id, session_id, order_number, status, total_amount) VALUES (?, ?, ?, 'pending', ?)`,
      [tableId, sessionId, orderNumber, totalAmount]
    );

    // Get the inserted order id
    const inserted = queryOne<{ id: number }>(
      `SELECT id FROM "order" WHERE order_number = ?`,
      [orderNumber]
    );
    const orderId = inserted!.id;

    for (const oi of orderItems) {
      run(
        `INSERT INTO order_item (order_id, menu_item_id, menu_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, oi.menuItemId, oi.menuName, oi.quantity, oi.unitPrice, oi.subtotal]
      );
    }

    run('COMMIT', []);

    // 7. Return created order with items
    return getOrder(orderId);
  } catch (err) {
    try { run('ROLLBACK', []); } catch { /* ignore rollback errors */ }
    throw err;
  }
}

export async function getOrder(orderId: number): Promise<OrderWithItems> {
  await getDb();

  const order = queryOne<Order>(
    'SELECT * FROM "order" WHERE id = ?',
    [orderId]
  );
  if (!order) {
    throw { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다.', status: 404 };
  }

  const items = queryAll<OrderItem>(
    'SELECT * FROM order_item WHERE order_id = ?',
    [orderId]
  );

  return { ...order, items };
}

export async function getOrdersBySession(sessionId: number): Promise<OrderWithItems[]> {
  await getDb();

  const orders = queryAll<Order>(
    'SELECT * FROM "order" WHERE session_id = ? ORDER BY created_at DESC',
    [sessionId]
  );

  return orders.map((order) => {
    const items = queryAll<OrderItem>(
      'SELECT * FROM order_item WHERE order_id = ?',
      [order.id]
    );
    return { ...order, items };
  });
}

export async function getOrdersByTable(tableId: number, activeOnly: boolean = false): Promise<OrderWithItems[]> {
  await getDb();

  const sql = activeOnly
    ? `SELECT * FROM "order" WHERE table_id = ? AND status IN ('pending', 'preparing') ORDER BY created_at DESC`
    : `SELECT * FROM "order" WHERE table_id = ? ORDER BY created_at DESC`;

  const orders = queryAll<Order>(sql, [tableId]);

  return orders.map((order) => {
    const items = queryAll<OrderItem>(
      'SELECT * FROM order_item WHERE order_id = ?',
      [order.id]
    );
    return { ...order, items };
  });
}

export async function getAllActiveOrders(storeId: number): Promise<(OrderWithItems & { table_number: number })[]> {
  await getDb();

  const orders = queryAll<Order & { table_number: number }>(
    `SELECT o.*, rt.table_number
     FROM "order" o
     JOIN restaurant_table rt ON rt.id = o.table_id
     WHERE rt.store_id = ? AND o.status IN ('pending', 'preparing')
     ORDER BY o.created_at ASC`,
    [storeId]
  );

  return orders.map((order) => {
    const items = queryAll<OrderItem>(
      'SELECT * FROM order_item WHERE order_id = ?',
      [order.id]
    );
    return { ...order, items };
  });
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: 'preparing' | 'completed'
): Promise<Order> {
  await getDb();

  const order = queryOne<Order>(
    'SELECT * FROM "order" WHERE id = ?',
    [orderId]
  );
  if (!order) {
    throw { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다.', status: 404 };
  }

  if (order.status === 'completed') {
    throw { code: 'ORDER_ALREADY_COMPLETED', message: '이미 완료된 주문입니다.', status: 400 };
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw { code: 'INVALID_STATUS_TRANSITION', message: '유효하지 않은 상태 전이입니다.', status: 400 };
  }

  run(
    `UPDATE "order" SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    [newStatus, orderId]
  );

  return queryOne<Order>('SELECT * FROM "order" WHERE id = ?', [orderId])!;
}

export async function deleteOrder(orderId: number): Promise<{ orderId: number; tableId: number }> {
  await getDb();

  const order = queryOne<Order>(
    'SELECT * FROM "order" WHERE id = ?',
    [orderId]
  );
  if (!order) {
    throw { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다.', status: 404 };
  }

  const tableId = order.table_id;
  run('DELETE FROM "order" WHERE id = ?', [orderId]);

  return { orderId, tableId };
}

export async function getTableTotalAmount(tableId: number, sessionId: number): Promise<number> {
  await getDb();

  const result = queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(total_amount), 0) as total FROM "order" WHERE table_id = ? AND session_id = ?`,
    [tableId, sessionId]
  );

  return result?.total ?? 0;
}
