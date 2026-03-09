'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/customer/LoginForm';
import { useSession } from '@/hooks/useSession';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useSession();

  // 이미 로그인된 경우 메뉴 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/customer');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogin = async (storeCode: string, tableNumber: number) => {
    await login(storeCode, tableNumber);
    router.replace('/customer');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white shadow-lg">
      <div
        className="px-5 py-4 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
      >
        <h1 className="text-xl font-bold">🍽️ 테이블오더</h1>
      </div>
      <LoginForm onLogin={handleLogin} />
    </div>
  );
}
