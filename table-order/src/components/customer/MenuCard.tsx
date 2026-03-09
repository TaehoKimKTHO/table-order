'use client';

import type { MenuItem } from '@/types/menu';

interface MenuCardProps {
  menuItem: MenuItem;
  onAddToCart: (menuItem: MenuItem) => void;
}

export default function MenuCard({ menuItem, onAddToCart }: MenuCardProps) {
  const formattedPrice = menuItem.price.toLocaleString('ko-KR');

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      data-testid={`menu-card-${menuItem.id}`}
    >
      <div className="flex h-24 items-center justify-center bg-orange-50 text-4xl">
        {menuItem.imagePath ? (
          <img
            src={menuItem.imagePath}
            alt={menuItem.name}
            className="h-full w-full object-cover"
          />
        ) : (
          '🍽️'
        )}
      </div>
      <div className="p-3">
        <h4 className="mb-1 text-sm font-semibold">{menuItem.name}</h4>
        {menuItem.description && (
          <p className="mb-2 text-xs leading-relaxed text-gray-400">
            {menuItem.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-orange-500">
            {formattedPrice}원
          </span>
          <button
            className="min-h-[44px] min-w-[44px] rounded-md bg-orange-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-orange-600"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(menuItem);
            }}
            data-testid={`menu-add-btn-${menuItem.id}`}
          >
            담기
          </button>
        </div>
      </div>
    </div>
  );
}
