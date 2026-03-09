'use client';

import { useState } from 'react';
import type { Category, MenuItem } from '@/types/menu';

interface Props {
  categories: Category[];
  editingItem: MenuItem | null;
  onClose: () => void;
}

export default function MenuFormModal({ categories, editingItem, onClose }: Props) {
  const [name, setName] = useState(editingItem?.name || '');
  const [price, setPrice] = useState(editingItem?.price?.toString() || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [categoryId, setCategoryId] = useState(editingItem?.categoryId?.toString() || (categories[0]?.id?.toString() || ''));
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('categoryId', categoryId);
    if (image) formData.append('image', image);

    try {
      const url = editingItem ? `/api/admin/menu/items/${editingItem.id}` : '/api/admin/menu/items';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || '저장에 실패했습니다.');
        return;
      }
      onClose();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-[20px] p-8 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-extrabold mb-6 tracking-tight">{editingItem ? '메뉴 수정' : '신규 메뉴 등록'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">메뉴명 *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100}
              className="w-full px-4 py-3 border border-border rounded-[10px] text-sm outline-none focus:border-text transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">가격 (원) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={100} max={10000000}
              className="w-full px-4 py-3 border border-border rounded-[10px] text-sm outline-none focus:border-text transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">카테고리 *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
              className="w-full px-4 py-3 border border-border rounded-[10px] text-sm outline-none focus:border-text transition-colors">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2}
              className="w-full px-4 py-3 border border-border rounded-[10px] text-sm outline-none focus:border-text transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">이미지</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full text-sm text-text-muted" />
          </div>
          {error && <p className="text-primary text-sm font-semibold">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-border rounded-[10px] font-bold text-sm text-text hover:bg-surface-alt cursor-pointer transition-colors">
              취소
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 bg-text text-white rounded-[10px] font-bold text-sm disabled:opacity-50 cursor-pointer active:scale-[0.97] transition-transform">
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
