'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CartItemData } from '@/types/order';
import type { MenuItem } from '@/types/menu';

function getStorageKey(tableId: number | null) {
  return `cart_${tableId ?? 'unknown'}`;
}

export function useCart(tableId: number | null) {
  const [items, setItems] = useState<CartItemData[]>([]);

  // localStorage에서 장바구니 복원
  useEffect(() => {
    if (tableId === null) return;
    try {
      const stored = localStorage.getItem(getStorageKey(tableId));
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }, [tableId]);

  // 장바구니 변경 시 localStorage 저장
  useEffect(() => {
    if (tableId === null) return;
    localStorage.setItem(getStorageKey(tableId), JSON.stringify(items));
  }, [items, tableId]);

  // 메뉴 추가
  const addItem = useCallback((menuItem: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === menuItem.id
            ? { ...i, quantity: Math.min(i.quantity + 1, 99) }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          imagePath: menuItem.imagePath,
          quantity: 1,
        },
      ];
    });
  }, []);

  // 수량 변경
  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
      return;
    }
    if (quantity > 99) return;

    setItems((prev) =>
      prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      )
    );
  }, []);

  // 아이템 삭제
  const removeItem = useCallback((menuItemId: number) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  // 장바구니 비우기
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    totalAmount,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
