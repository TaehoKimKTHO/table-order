'use client';

import type { Order } from '@/types/order';

interface OrderCardProps {
  order: Order;
}

const statusConfig = {
  pending: { label: '⏳ 대기중', className: 'bg-orange-50 text-orange-700' },
  preparing: { label: '🔥 준비중', className: 'bg-blue-50 text-blue-700' },
  completed: { label: '✅ 완료', className: 'bg-green-50 text-green-700' },
};

export default function OrderCard({ order }: OrderCardProps) {
  const status = statusConfig[order.status] ?? statusConfig.pending;
  const time = new Date(order.createdAt).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="mb-3 rounded-xl border border-gray-100 bg-white p-4"
      data-testid={`order-card-${order.id}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold">#{order.orderNumber}</span>
        <span
          className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${status.className}`}
          data-testid={`order-status-${order.id}`}
        >
          {status.label}
        </span>
      </div>
      <div className="mb-2.5 text-xs text-gray-400">{time}</div>
      <div className="border-t border-gray-50 pt-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between py-1 text-sm text-gray-500"
          >
            <span>
              {item.menuName} x{item.quantity}
            </span>
            <span>{item.subtotal.toLocaleString('ko-KR')}원</span>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-gray-50 pt-2 text-right font-bold text-orange-500">
        합계: {order.totalAmount.toLocaleString('ko-KR')}원
      </div>
    </div>
  );
}
