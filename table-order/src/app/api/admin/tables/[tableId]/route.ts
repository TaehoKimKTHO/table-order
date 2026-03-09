import { NextRequest, NextResponse } from 'next/server';
import { updateTable } from '@/lib/table';

// PUT /api/admin/tables/[tableId] — 테이블 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
    const body = await request.json();
    const table = await updateTable(Number(tableId), body);
    return NextResponse.json({ data: table });
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.status ?? 500 }
    );
  }
}
