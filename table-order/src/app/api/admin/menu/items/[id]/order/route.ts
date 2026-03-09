import { NextRequest, NextResponse } from 'next/server';
import { updateMenuOrder } from '@/lib/menu';
import { getDb } from '@/lib/db';

// PATCH /api/admin/menu/items/[id]/order — 메뉴 순서 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDb();
    const { id } = await params;
    const body = await request.json();
    const { sortOrder } = body;
    updateMenuOrder(Number(id), sortOrder);
    return NextResponse.json({ data: { success: true } });
  } catch (e) {
    const err = e as { code?: string; message?: string; statusCode?: number; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.statusCode ?? err.status ?? 500 }
    );
  }
}
