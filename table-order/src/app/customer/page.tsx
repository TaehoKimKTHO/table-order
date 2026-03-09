'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryBar from '@/components/customer/CategoryBar';
import MenuGrid from '@/components/customer/MenuGrid';
import { useSession } from '@/hooks/useSession';
import { useCart } from '@/hooks/useCart';
import type { Category } from '@/types/menu';
import type { MenuItem } from '@/types/menu';

export default function MenuPage() {
  const { session } = useSession();
  const { addItem } = useCart(session?.tableId ?? null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const token = session?.sessionToken;

  // 카테고리 + 전체 메뉴 로드
  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetch('/api/customer/menu', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setMenuItems(data.menuItems ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  // 카테고리 선택 시 필터
  const handleCategorySelect = useCallback(
    (categoryId: number | null) => {
      setSelectedCategoryId(categoryId);
      if (categoryId === null || !token) {
        // 전체 메뉴 다시 로드
        fetch('/api/customer/menu', {
          headers: { Authorization: `Bearer ${token!}` },
        })
          .then((res) => res.json())
          .then((data) => setMenuItems(data.menuItems ?? []))
          .catch(() => {});
        return;
      }
      fetch(`/api/customer/menu/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setMenuItems(data.menuItems ?? []))
        .catch(() => {});
    },
    [token]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">메뉴를 불러오는 중...</div>
    );
  }

  return (
    <div>
      <CategoryBar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={handleCategorySelect}
      />
      <MenuGrid menuItems={menuItems} onAddToCart={addItem} />
    </div>
  );
}
