'use client';

import { useState, useEffect, useCallback } from 'react';

interface SessionInfo {
  sessionToken: string;
  tableId: number;
  sessionId: number;
  tableNumber: number;
  storeName: string;
}

const STORAGE_KEY = 'session_info';

export function useSession() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // localStorage에서 세션 복원
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSession(JSON.parse(stored));
      }
    } catch {
      // 파싱 실패 시 무시
    }
    setIsLoading(false);
  }, []);

  // 로그인
  const login = useCallback(async (storeCode: string, tableNumber: number) => {
    const res = await fetch('/api/customer/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeCode, tableNumber }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || '로그인 실패');

    const sessionInfo: SessionInfo = {
      sessionToken: data.sessionToken,
      tableId: data.tableId,
      sessionId: data.sessionId ?? 0,
      tableNumber: data.tableNumber,
      storeName: data.storeName,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionInfo));
    setSession(sessionInfo);
    return sessionInfo;
  }, []);

  // 세션 검증
  const validate = useCallback(async (): Promise<boolean> => {
    if (!session?.sessionToken) return false;

    try {
      const res = await fetch('/api/customer/auth/validate', {
        headers: { Authorization: `Bearer ${session.sessionToken}` },
      });

      if (!res.ok) {
        logout();
        return false;
      }

      const data = await res.json();
      // sessionId 업데이트
      if (data.sessionId && data.sessionId !== session.sessionId) {
        const updated = { ...session, sessionId: data.sessionId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSession(updated);
      }
      return data.isValid;
    } catch {
      return false;
    }
  }, [session]);

  // 로그아웃
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    login,
    validate,
    logout,
  };
}
