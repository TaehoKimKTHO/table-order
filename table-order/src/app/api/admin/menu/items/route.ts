import { NextRequest, NextResponse } from 'next/server';
import { getAllMenuItems, createMenuItem } from '@/lib/menu';
import { getDb } from '@/lib/db';

// GET /api/admin/menu/items
export async function GET() {
  try {
    await getDb();
    const items = getAllMenuItems(1);
    return NextResponse.json({ data: items });
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.status ?? 500 }
    );
  }
}

// POST /api/admin/menu/items — 메뉴 등록 (multipart)
export async function POST(request: NextRequest) {
  try {
    await getDb();
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const description = (formData.get('description') as string) || '';
    const categoryId = Number(formData.get('categoryId'));
    const imageFile = formData.get('image') as File | null;

    const item = await createMenuItem({
      name,
      price,
      description,
      categoryId,
      image: imageFile && imageFile.size > 0 ? imageFile : undefined,
      imageMimeType: imageFile?.type,
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    const err = e as { code?: string; message?: string; statusCode?: number; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.statusCode ?? err.status ?? 500 }
    );
  }
}
