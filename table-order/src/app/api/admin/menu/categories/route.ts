import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/menu';
import { getDb } from '@/lib/db';

// GET /api/admin/menu/categories
export async function GET() {
  try {
    await getDb();
    const categories = getCategories(1);
    return NextResponse.json({ data: categories });
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.status ?? 500 }
    );
  }
}

// POST /api/admin/menu/categories
export async function POST(request: NextRequest) {
  try {
    await getDb();
    const body = await request.json();
    const { name, sortOrder } = body;
    const category = createCategory({ storeId: 1, name, sortOrder });
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (e) {
    const err = e as { code?: string; message?: string; statusCode?: number; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.statusCode ?? err.status ?? 500 }
    );
  }
}
