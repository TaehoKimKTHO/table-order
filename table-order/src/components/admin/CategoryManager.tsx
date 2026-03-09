'use client';

import { useState } from 'react';
import type { Category } from '@/types/menu';

interface Props {
  categories: Category[];
  onClose: () => void;
}

export default function CategoryManager({ categories: initialCategories, onClose }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const refresh = async () => {
    const res = await fetch('/api/admin/menu/categories');
    const data = await res.json();
    setCategories(data.data || []);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await fetch('/api/admin/menu/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName('');
    refresh();
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await fetch(`/api/admin/menu/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditingId(null);
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 카테고리와 하위 메뉴가 모두 삭제됩니다. 계속하시겠습니까?')) return;
    await fetch(`/api/admin/menu/categories/${id}`, { method: 'DELETE' });
    refresh();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-[20px] p-8 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-extrabold mb-6 tracking-tight">카테고리 관리</h2>
        <div className="flex gap-2 mb-5">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="새 카테고리명"
            className="flex-1 px-4 py-3 border border-border rounded-[10px] text-sm outline-none focus:border-text transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <button onClick={handleAdd}
            className="px-5 py-3 bg-text text-white rounded-[10px] font-bold text-sm cursor-pointer active:scale-[0.97] transition-transform">
            추가
          </button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 p-3 rounded-xl hover:bg-bg transition-colors">
              {editingId === cat.id ? (
                <>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-text"
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)} autoFocus />
                  <button onClick={() => handleUpdate(cat.id)} className="text-sm font-semibold text-text cursor-pointer">저장</button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-text-muted cursor-pointer">취소</button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-semibold">{cat.name}</span>
                  <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    className="text-sm text-text-muted hover:text-text cursor-pointer transition-colors">수정</button>
                  <button onClick={() => handleDelete(cat.id)}
                    className="text-sm text-primary hover:opacity-70 cursor-pointer transition-opacity">삭제</button>
                </>
              )}
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full mt-5 py-3 border border-border rounded-[10px] font-bold text-sm text-text hover:bg-surface-alt cursor-pointer transition-colors">
          닫기
        </button>
      </div>
    </div>
  );
}
