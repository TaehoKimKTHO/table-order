import { NextRequest, NextResponse } from 'next/server';
import { getMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/menu';
import { getDb } from '@/lib/db';

// PUT /api/admin/menu/items/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDb();
    const { id } = await params;
    const formData = await request.formData();

    const name = formData.get('name') as string | null;
    const price = formData.get('price');
    const description = formData.get('description');
    const categoryId = formData.get('categoryId');
    const isAvailable = formData.get('isAvailable');
    const imageFile = formData.get('image') as File | null;

    const item = await updateMenuItem(Number(id), {
      name: name || undefined,
      price: price ? Number(price) : undefined,
      description: description !== null ? (description as string) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isAvailable: isAvailable !== null ? isAvailable === 'true' : undefined,
      image: imageFile && imageFile.size > 0 ? imageFile : undefined,
      imageMimeType: imageFile?.type,
    });

    return NextResponse.json({ data: item });
  } catch (e) {
    const err = e as { code?: string; message?: string; statusCode?: number; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.statusCode ?? err.status ?? 500 }
    );
  }
}

// DELETE /api/admin/menu/items/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDb();
    const { id } = await params;
    await deleteMenuItem(Number(id));
    return NextResponse.json({ data: { success: true } });
  } catch (e) {
    const err = e as { code?: string; message?: string; statusCode?: number; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.statusCode ?? err.status ?? 500 }
    );
  }
}
