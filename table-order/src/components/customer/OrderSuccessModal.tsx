'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OrderSuccessModalProps {
  isOpen: boolean;
  orderNumber: string;
  onClose?: () => void;
}

export default function OrderSuccessModal({ isOpen, orderNumber, onClose }: OrderSuccessModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose?.();
      router.push('/customer');
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="order-success-modal"
    >
      <div className="w-[90%] max-w-[400px] rounded-2xl bg-white p-6 text-center">
        <div className="mb-3 text-5xl">✅</div>
        <h3 className="mb-2 text-lg font-semibold">주문이 완료되었습니다!</h3>
        <p className="mb-2 text-xl font-bold text-orange-500" data-testid="order-number-display">
          주문번호: {orderNumber}
        </p>
        <p className="mb-4 text-sm text-gray-400">
          5초 후 메뉴 화면으로 이동합니다...
        </p>
        <div className="h-1 overflow-hidden rounded-sm bg-gray-100">
          <div
            className="h-full bg-orange-500"
            style={{ animation: 'countdown 5s linear forwards' }}
          />
        </div>
        <style jsx>{`
          @keyframes countdown {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}
