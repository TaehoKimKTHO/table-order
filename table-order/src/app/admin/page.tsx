'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RestaurantTable, TableSession, OrderWithItems } from '@/types';
import OrderDashboard from '@/components/admin/OrderDashboard';

interface TableWithSession extends RestaurantTable {
  activeSession?: TableSession;
  totalAmount?: number;
}

interface TableGroup {
  table: TableWithSession;
  orders: OrderWithItems[];
  totalAmount: number;
}

export default function AdminDashboardPage() {
  const [tableGroups, setTableGroups] = useState<TableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch('/api/admin/tables'),
        fetch('/api/admin/orders'),
      ]);
      const tablesJson = await tablesRes.json();
      const ordersJson = await ordersRes.json();

      // tables API returns { data: [...] }, orders API returns array directly
      const tables: TableWithSession[] = tablesJson.data || [];
      const orders: (OrderWithItems & { table_number: number })[] = Array.isArray(ordersJson) ? ordersJson : (ordersJson.data || []);

      const groups: TableGroup[] = tables
        .filter((t) => t.is_occupied)
        .map((table) => {
          const tableOrders = orders.filter((o) => o.table_id === table.id);
          const totalAmount = tableOrders.reduce((sum, o) => sum + o.total_amount, 0);
          return { table, orders: tableOrders, totalAmount };
        });

      setTableGroups(groups);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const eventSource = new EventSource('/api/admin/sse');

    eventSource.addEventListener('order:new', (e) => {
      const order = JSON.parse(e.data);
      setNewOrderIds((prev) => new Set(prev).add(order.id));
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(order.id);
          return next;
        });
      }, 5000);
      fetchData();
    });

    eventSource.addEventListener('order:status', () => fetchData());
    eventSource.addEventListener('order:deleted', () => fetchData());
    eventSource.addEventListener('table:completed', () => fetchData());

    return () => eventSource.close();
  }, [fetchData]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error('Status change failed:', err);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('이 주문을 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCompleteTable = async (tableId: number) => {
    if (!confirm('해당 테이블의 이용을 완료처리하시겠습니까?\n모든 내역이 과거 이력으로 이동하며 0원으로 리셋됩니다.')) return;
    try {
      await fetch(`/api/admin/tables/${tableId}/complete`, { method: 'POST' });
      fetchData();
    } catch (err) {
      console.error('Complete failed:', err);
    }
  };

  return (
    <OrderDashboard
      tableGroups={tableGroups}
      loading={loading}
      newOrderIds={newOrderIds}
      onStatusChange={handleStatusChange}
      onDeleteOrder={handleDeleteOrder}
      onCompleteTable={handleCompleteTable}
    />
  );
}
