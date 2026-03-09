'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Category, MenuItem, CategoryWithItems } from '@/types/menu';
import MenuFormModal from '@/components/admin/MenuFormModal';
import CategoryManager from '@/components/admin/CategoryManager';

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const fetchData = useCallback(async () => {
    const [catRes, itemRes] = await Promise.all([
      fetch('/api/admin/menu/categories'),
      fetch('/api/admin/menu/items'),
    ]);
    const catData = await catRes.json();
    const itemData = await itemRes.json();
    setCategories(catData.data || []);
    // items API returns CategoryWithItems[] — flatten to MenuItem[]
    const raw = itemData.data || [];
    if (raw.length > 0 && raw[0].items) {
      // CategoryWithItems format
      const flat: MenuItem[] = [];
      (raw as CategoryWithItems[]).forEach((cat) => {
        cat.items.forEach((item) => flat.push({ ...item, categoryId: cat.id }));
      });
      setMenuItems(flat);
    } else {
      setMenuItems(raw);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredItems = selectedCategory
    ? menuItems.filter((i) => i.categoryId === selectedCategory)
    : menuItems;

  const handleDelete = async (id: number) => {
    if (!confirm('이 메뉴를 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/menu/items/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    const formData = new FormData();
    formData.append('isAvailable', String(!item.isAvailable));
    await fetch(`/api/admin/menu/items/${item.id}`, { method: 'PUT', body: formData });
    fetchData();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchData();
  };

  return (
    <>
      <header className="bg-surface px-10 py-6 border-b border-border flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-text tracking-tight">메뉴 및 재고 관리</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowCategoryManager(true)}
            className="px-5 py-3 border border-border rounded-[10px] font-bold text-sm text-text bg-surface hover:bg-surface-alt cursor-pointer transition-colors">
            카테고리 관리
          </button>
          <button onClick={() => setShowForm(true)}
            className="px-5 py-3 bg-text text-white rounded-[10px] font-bold text-sm cursor-pointer flex items-center gap-2 active:scale-[0.97] transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            신규 메뉴 등록
          </button>
        </div>
      </header>
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="flex gap-3 mb-8">
          <button onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2.5 rounded-[10px] font-semibold text-sm border transition-colors cursor-pointer ${
              selectedCategory === null ? 'bg-text text-white border-text' : 'bg-surface text-text-muted border-border hover:bg-surface-alt'
            }`}>전체</button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-[10px] font-semibold text-sm border transition-colors cursor-pointer ${
                selectedCategory === cat.id ? 'bg-text text-white border-text' : 'bg-surface text-text-muted border-border hover:bg-surface-alt'
              }`}>{cat.name}</button>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {filteredItems.map((item) => (
            <div key={item.id}
              className={`bg-surface rounded-[20px] border border-border shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${!item.isAvailable ? 'opacity-80' : ''}`}>
              <div className={`h-40 bg-border flex items-center justify-center text-[40px] relative ${!item.isAvailable ? 'grayscale' : ''}`}>
                {item.imagePath ? (
                  <img src={item.imagePath} alt={item.name} className="w-full h-full object-cover" />
                ) : '🍽️'}
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold backdrop-blur-[10px] ${
                  item.isAvailable ? 'bg-white/90 text-text' : 'bg-status-wait/90 text-white'
                }`}>{item.isAvailable ? '판매중' : '일시품절'}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-lg font-bold mb-2">{item.name}</div>
                <div className="text-base font-extrabold text-primary mb-2">{item.price.toLocaleString('ko-KR')}원</div>
                <div className="text-[13px] text-text-muted leading-snug flex-1">{item.description}</div>
              </div>
              <div className="px-5 py-4 border-t border-border flex gap-3 bg-surface-alt">
                <button onClick={() => { setEditingItem(item); setShowForm(true); }}
                  className="flex-1 py-2.5 rounded-lg border border-border bg-surface text-text font-semibold text-[13px] cursor-pointer hover:bg-bg transition-colors">정보 수정</button>
                <button onClick={() => handleToggleAvailable(item)}
                  className={`flex-1 py-2.5 rounded-lg border border-border bg-surface font-semibold text-[13px] cursor-pointer hover:bg-bg transition-colors ${item.isAvailable ? 'text-primary' : 'text-text'}`}>
                  {item.isAvailable ? '품절 처리' : '판매 재개'}
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredItems.length === 0 && (
          <p className="text-text-muted text-center mt-12">등록된 메뉴가 없습니다.</p>
        )}
      </div>
      {showForm && <MenuFormModal categories={categories} editingItem={editingItem} onClose={handleFormClose} />}
      {showCategoryManager && <CategoryManager categories={categories} onClose={() => { setShowCategoryManager(false); fetchData(); }} />}
    </>
  );
}
