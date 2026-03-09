'use client';

interface CartSummaryProps {
  totalAmount: number;
  itemCount: number;
  onOrder: () => void;
  onClear: () => void;
}

export default function CartSummary({ totalAmount, itemCount, onOrder, onClear }: CartSummaryProps) {
  return (
    <div className="border-t-2 border-gray-100 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-base">총 주문금액</span>
        <span className="text-lg font-bold text-orange-500" data-testid="cart-total">
          {totalAmount.toLocaleString('ko-KR')}원
        </span>
      </div>
      <button
        className="min-h-[56px] w-full rounded-xl bg-orange-500 text-lg font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
        onClick={onOrder}
        disabled={itemCount === 0}
        data-testid="cart-order-btn"
      >
        주문하기
      </button>
      <button
        className="mt-2 w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm text-gray-400 transition-colors hover:bg-gray-50"
        onClick={onClear}
        data-testid="cart-clear-btn"
      >
        장바구니 비우기
      </button>
    </div>
  );
}
