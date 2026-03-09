'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerNav from '@/components/customer/CustomerNav';
import { useSession } from '@/hooks/useSession';
import { useCart } from '@/hooks/useCart';
import { useSSE } from '@/hooks/useSSE';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, isLoading, isAuthenticated, validate, logout } = useSession();
  const { itemCount, clearCart } = useCart(session?.tableId ?? null);

  const handleTableCompleted = useCallback(() => {
    clearCart();
    logout();
    router.replace('/customer/login');
  }, [clearCart, logout, router]);

  useSSE({
    token: session?.sessionToken ?? null,
    onTableCompleted: handleTableCompleted,
  });

  // 세션 검증
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/customer/login');
      return;
    }
    validate().then((valid) => {
      if (!valid) router.replace('/customer/login');
    });
  }, [isLoading, isAuthenticated, validate, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white shadow-lg">
      <CustomerHeader storeName={session.storeName} tableNumber={session.tableNumber} />
      <CustomerNav cartItemCount={itemCount} />
      <main>{children}</main>
    </div>
  );
}
