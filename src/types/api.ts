// ===== API Response Types =====

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

export interface ApiSuccess<T = unknown> {
  data: T
}

// ===== SSE Event Types =====

export type SSEEventType =
  | 'connected'
  | 'order:new'
  | 'order:status'
  | 'order:deleted'
  | 'table:completed'

export interface SSEMessage {
  event: SSEEventType
  data: unknown
}
