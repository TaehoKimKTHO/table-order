'use client';

import { useState } from 'react';

interface LoginFormProps {
  onLogin: (storeCode: string, tableNumber: number) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [storeCode, setStoreCode] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const num = parseInt(tableNumber, 10);
    if (!storeCode.trim()) {
      setError('매장코드를 입력해주세요.');
      return;
    }
    if (isNaN(num) || num < 1 || num > 10) {
      setError('테이블 번호를 1~10 사이로 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin(storeCode.trim(), num);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="mb-2 text-4xl">🍽️</div>
          <h2 className="text-xl font-bold text-gray-800">테이블오더</h2>
          <p className="mt-1 text-sm text-gray-400">매장코드와 테이블 번호를 입력해주세요</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="store-code" className="mb-1 block text-sm font-medium text-gray-600">
            매장코드
          </label>
          <input
            id="store-code"
            type="text"
            value={storeCode}
            onChange={(e) => setStoreCode(e.target.value)}
            placeholder="매장코드 입력"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            data-testid="login-store-code"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="table-number" className="mb-1 block text-sm font-medium text-gray-600">
            테이블 번호
          </label>
          <input
            id="table-number"
            type="number"
            min={1}
            max={10}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="1~10"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            data-testid="login-table-number"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-orange-500 py-3.5 text-base font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          data-testid="login-submit-btn"
        >
          {isSubmitting ? '로그인 중...' : '시작하기'}
        </button>
      </form>
    </div>
  );
}
