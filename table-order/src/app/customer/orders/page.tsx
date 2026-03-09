'use client';

import { useState, useEffect, useCallback } from 'react';
import OrderCard from '@/components/customer/OrderCard';
import { useSession } from '@/hooks/useSession';
import { useSSE } from '@/hooks/useSSE';
import type { Order } from '@/types/order';

export default function OrdersPage() {
  const { session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = session?.sessionToken ?? null;

  // 주문 목록 로드
  const fetchOrders = useCallback(() => {
    if (!token) return;
    fetch('/api/customer/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // SSE로 주문 상태 변경 시 목록 새로고침
  const handleOrderStatusChange = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderDeleted = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  useSSE({
    token,
    onOrderStatusChange: handleOrderStatusChange,
    onOrderDeleted: handleOrderDeleted,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">주문 내역을 불러오는 중...</div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-400">
        <div className="mb-2 text-4xl">📋</div>
        <p>주문 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
