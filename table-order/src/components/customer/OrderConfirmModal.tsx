'use client';

import type { CartItemData } from '@/types/order';

interface OrderConfirmModalProps {
  isOpen: boolean;
  items: CartItemData[];
  totalAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function OrderConfirmModal({
  isOpen,
  items,
  totalAmount,
  onConfirm,
  onCancel,
}: OrderConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="order-confirm-modal"
    >
      <div className="w-[90%] max-w-[400px] rounded-2xl bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">주문 확인</h3>
        <div className="mb-4">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex justify-between py-1.5 text-sm"
            >
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>{(item.price * item.quantity).toLocaleString('ko-KR')}원</span>
            </div>
          ))}
          <hr className="my-2 border-gray-100" />
          <div className="flex justify-between text-base font-bold text-orange-500">
            <span>합계</span>
            <span>{totalAmount.toLocaleString('ko-KR')}원</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg border border-gray-200 bg-white py-3 text-sm"
            onClick={onCancel}
            data-testid="order-cancel-btn"
          >
            취소
          </button>
          <button
            className="flex-1 rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white"
            onClick={onConfirm}
            data-testid="order-confirm-btn"
          >
            주문 확정
          </button>
        </div>
      </div>
    </div>
  );
}
