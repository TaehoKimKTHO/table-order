'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface SSEEvent {
  type: string;
  data: unknown;
}

interface UseSSEOptions {
  token: string | null;
  onOrderStatusChange?: (orderId: number, status: string) => void;
  onOrderDeleted?: (orderId: number) => void;
  onTableCompleted?: () => void;
}

export function useSSE(options: UseSSEOptions) {
  const { token, onOrderStatusChange, onOrderDeleted, onTableCompleted } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/customer/sse?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setIsConnected(true);
    });

    es.addEventListener('order:status', (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent({ type: 'order:status', data });
        onOrderStatusChange?.(data.orderId, data.status);
      } catch {
        // 파싱 실패 무시
      }
    });

    es.addEventListener('order:deleted', (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent({ type: 'order:deleted', data });
        onOrderDeleted?.(data.orderId);
      } catch {
        // 파싱 실패 무시
      }
    });

    es.addEventListener('table:completed', () => {
      setLastEvent({ type: 'table:completed', data: null });
      onTableCompleted?.();
    });

    es.onerror = () => {
      setIsConnected(false);
      // 자동 재연결 (EventSource 기본 동작)
    };
  }, [token, onOrderStatusChange, onOrderDeleted, onTableCompleted]);

  // 토큰 변경 시 연결
  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connect]);

  return { isConnected, lastEvent };
}
