// SSE Module — Unit 1 (실제 구현은 Unit 1에서)

import type { Order } from '@/types'

interface SSEConnection {
  response: ReadableStreamDefaultController
  type: 'customer' | 'admin'
  tableId?: number
}

const connections = new Map<string, SSEConnection>()

export function addConnection(
  clientId: string,
  type: 'customer' | 'admin',
  controller: ReadableStreamDefaultController,
  tableId?: number
) {
  connections.set(clientId, { response: controller, type, tableId })
}

export function removeConnection(clientId: string) {
  connections.delete(clientId)
}

function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  try {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    controller.enqueue(new TextEncoder().encode(message))
  } catch {
    // connection closed
  }
}

export function broadcastToAdmin(event: string, data: unknown) {
  connections.forEach((conn) => {
    if (conn.type === 'admin') {
      sendEvent(conn.response, event, data)
    }
  })
}

export function broadcastToTable(tableId: number, event: string, data: unknown) {
  connections.forEach((conn) => {
    if (conn.type === 'customer' && conn.tableId === tableId) {
      sendEvent(conn.response, event, data)
    }
  })
}

export function notifyNewOrder(order: Order) {
  broadcastToAdmin('order:new', order)
}

export function notifyOrderStatusChange(order: Order) {
  broadcastToTable(order.tableId, 'order:status', {
    orderId: order.id,
    status: order.status,
  })
  broadcastToAdmin('order:status', {
    orderId: order.id,
    tableId: order.tableId,
    status: order.status,
  })
}

export function notifyOrderDeleted(orderId: number, tableId: number) {
  broadcastToTable(tableId, 'order:deleted', { orderId })
  broadcastToAdmin('order:deleted', { orderId, tableId })
}

export function getConnectionCount() {
  return connections.size
}
