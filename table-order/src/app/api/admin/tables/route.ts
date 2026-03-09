import { NextRequest, NextResponse } from 'next/server';
import { getTables, createTable } from '@/lib/table';

// GET /api/admin/tables — 테이블 목록 조회
export async function GET() {
  try {
    const storeId = 1;
    const tables = await getTables(storeId);
    return NextResponse.json({ data: tables });
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.status ?? 500 }
    );
  }
}

// POST /api/admin/tables — 테이블 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber } = body;
    const storeId = 1;
    const table = await createTable(storeId, tableNumber);
    return NextResponse.json({ data: table }, { status: 201 });
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.status ?? 500 }
    );
  }
}
