import type { SSEEventType } from '@/types';

interface SSEClient {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
}

// In-memory connection stores
const adminConnections = new Map<string, SSEClient>();
const customerConnections = new Map<number, Map<string, SSEClient>>();

function formatSSE(event: SSEEventType, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sendToClient(client: SSEClient, event: SSEEventType, data: Record<string, unknown>): boolean {
  try {
    client.controller.enqueue(client.encoder.encode(formatSSE(event, data)));
    return true;
  } catch {
    return false;
  }
}

export function addConnection(
  clientId: string,
  type: 'customer' | 'admin',
  tableId?: number
): ReadableStream {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const client: SSEClient = { controller, encoder };

      if (type === 'admin') {
        adminConnections.set(clientId, client);
      } else if (type === 'customer' && tableId !== undefined) {
        if (!customerConnections.has(tableId)) {
          customerConnections.set(tableId, new Map());
        }
        customerConnections.get(tableId)!.set(clientId, client);
      }

      // Send initial connected event
      sendToClient(client, 'connected', { clientId, type });
    },
    cancel() {
      removeConnection(clientId, type, tableId);
    },
  });

  return stream;
}

export function removeConnection(clientId: string, type?: 'customer' | 'admin', tableId?: number): void {
  if (type === 'admin' || adminConnections.has(clientId)) {
    adminConnections.delete(clientId);
  }

  if (type === 'customer' && tableId !== undefined) {
    customerConnections.get(tableId)?.delete(clientId);
    if (customerConnections.get(tableId)?.size === 0) {
      customerConnections.delete(tableId);
    }
  } else {
    // Search all tables if tableId not provided
    for (const [tid, clients] of customerConnections) {
      if (clients.has(clientId)) {
        clients.delete(clientId);
        if (clients.size === 0) customerConnections.delete(tid);
        break;
      }
    }
  }
}

export function broadcastToAdmin(event: SSEEventType, data: Record<string, unknown>): void {
  for (const [clientId, client] of adminConnections) {
    if (!sendToClient(client, event, data)) {
      adminConnections.delete(clientId);
    }
  }
}

export function broadcastToTable(tableId: number, event: SSEEventType, data: Record<string, unknown>): void {
  const clients = customerConnections.get(tableId);
  if (!clients) return;

  for (const [clientId, client] of clients) {
    if (!sendToClient(client, event, data)) {
      clients.delete(clientId);
    }
  }
  if (clients.size === 0) customerConnections.delete(tableId);
}

export function notifyNewOrder(order: Record<string, unknown>): void {
  broadcastToAdmin('order:new', order);
}

export function notifyOrderStatusChange(order: { orderId: number; tableId: number; status: string }): void {
  broadcastToTable(order.tableId, 'order:status', { orderId: order.orderId, status: order.status });
  broadcastToAdmin('order:status', order);
}

export function notifyOrderDeleted(orderId: number, tableId: number): void {
  broadcastToTable(tableId, 'order:deleted', { orderId });
  broadcastToAdmin('order:deleted', { orderId, tableId });
}
