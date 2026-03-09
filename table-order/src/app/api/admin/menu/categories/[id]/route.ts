import { NextRequest, NextResponse } from 'next/server';
import { updateCategory, deleteCategory } from '@/lib/menu';
import { getDb } from '@/lib/db';

// PUT /api/admin/menu/categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDb();
    const { id } = await params;
    const body = await request.json();
    const category = updateCategory(Number(id), body);
    return NextResponse.json({ data: category });
  } catch (e) {
    const err = e as { code?: string; message?: string; statusCode?: number; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.statusCode ?? err.status ?? 500 }
    );
  }
}

// DELETE /api/admin/menu/categories/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDb();
    const { id } = await params;
    await deleteCategory(Number(id));
    return NextResponse.json({ data: { success: true } });
  } catch (e) {
    const err = e as { code?: string; message?: string; statusCode?: number; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.statusCode ?? err.status ?? 500 }
    );
  }
}
