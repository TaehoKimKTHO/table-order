'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CartItem from '@/components/customer/CartItem';
import CartSummary from '@/components/customer/CartSummary';
import OrderConfirmModal from '@/components/customer/OrderConfirmModal';
import OrderSuccessModal from '@/components/customer/OrderSuccessModal';
import { useSession } from '@/hooks/useSession';
import { useCart } from '@/hooks/useCart';

export default function CartPage() {
  const router = useRouter();
  const { session } = useSession();
  const { items, totalAmount, itemCount, updateQuantity, removeItem, clearCart } = useCart(
    session?.tableId ?? null
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);

  const handleOrder = () => {
    if (items.length === 0) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!session?.sessionToken) return;
    try {
      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.sessionToken}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || '주문 실패');

      setShowConfirm(false);
      setSuccessOrderNumber(data.orderNumber);
      clearCart();
    } catch {
      alert('주문에 실패했습니다. 다시 시도해주세요.');
      setShowConfirm(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOrderNumber(null);
    router.push('/customer');
  };

  if (items.length === 0 && !successOrderNumber) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-400">
        <div className="mb-2 text-4xl">🛒</div>
        <p>장바구니가 비어있습니다</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4">
        {items.map((item) => (
          <CartItem
            key={item.menuItemId}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>
      <CartSummary
        totalAmount={totalAmount}
        itemCount={itemCount}
        onOrder={handleOrder}
        onClear={clearCart}
      />
      <OrderConfirmModal
        isOpen={showConfirm}
        items={items}
        totalAmount={totalAmount}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
      {successOrderNumber && (
        <OrderSuccessModal
          isOpen={true}
          orderNumber={successOrderNumber}
          onClose={handleSuccessClose}
        />
      )}
    </div>
  );
}
