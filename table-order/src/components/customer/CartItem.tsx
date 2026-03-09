'use client';

import type { CartItemData } from '@/types/order';

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (menuItemId: number, quantity: number) => void;
  onRemove: (menuItemId: number) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const subtotal = (item.price * item.quantity).toLocaleString('ko-KR');

  return (
    <div
      className="flex items-center gap-3 border-b border-gray-50 py-3.5"
      data-testid={`cart-item-${item.menuItemId}`}
    >
      <div className="flex-1">
        <h4 className="text-sm font-medium">{item.name}</h4>
        <p className="text-xs text-gray-400">{item.price.toLocaleString('ko-KR')}원</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg"
          onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
          data-testid={`cart-qty-minus-${item.menuItemId}`}
          aria-label={`${item.name} 수량 감소`}
        >
          −
        </button>
        <span className="min-w-[20px] text-center text-base font-semibold">
          {item.quantity}
        </span>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg"
          onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
          data-testid={`cart-qty-plus-${item.menuItemId}`}
          aria-label={`${item.name} 수량 증가`}
        >
          +
        </button>
      </div>
      <div className="min-w-[80px] text-right text-sm font-semibold">
        {subtotal}원
      </div>
      <button
        className="p-1 text-gray-300 hover:text-red-500"
        onClick={() => onRemove(item.menuItemId)}
        data-testid={`cart-remove-${item.menuItemId}`}
        aria-label={`${item.name} 삭제`}
      >
        ✕
      </button>
    </div>
  );
}
