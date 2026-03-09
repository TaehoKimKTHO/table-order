'use client';

import type { Category } from '@/types/menu';

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelect: (categoryId: number | null) => void;
}

export default function CategoryBar({ categories, selectedCategoryId, onSelect }: CategoryBarProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-3"
      data-testid="category-bar"
    >
      <button
        className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
          selectedCategoryId === null
            ? 'border-orange-500 bg-orange-500 text-white'
            : 'border-gray-200 bg-white text-gray-600'
        }`}
        onClick={() => onSelect(null)}
        data-testid="category-btn-all"
      >
        전체
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
            selectedCategoryId === cat.id
              ? 'border-orange-500 bg-orange-500 text-white'
              : 'border-gray-200 bg-white text-gray-600'
          }`}
          onClick={() => onSelect(cat.id)}
          data-testid={`category-btn-${cat.id}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
