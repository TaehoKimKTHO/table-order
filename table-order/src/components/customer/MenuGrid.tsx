'use client';

import type { MenuItem } from '@/types/menu';
import MenuCard from './MenuCard';

interface MenuGridProps {
  items: MenuItem[];
  onAddToCart: (menuItem: MenuItem) => void;
}

export default function MenuGrid({ items, onAddToCart }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400" data-testid="menu-empty">
        메뉴가 없습니다.
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 p-4"
      data-testid="menu-grid"
    >
      {items.map((item) => (
        <MenuCard key={item.id} menuItem={item} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
