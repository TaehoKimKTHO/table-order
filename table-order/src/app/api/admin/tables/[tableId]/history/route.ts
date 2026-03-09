import { NextRequest, NextResponse } from 'next/server';
import { getOrderHistory } from '@/lib/table';

// GET /api/admin/tables/[tableId]/history — 과거 주문 내역 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const history = await getOrderHistory(Number(tableId), { from, to });
    return NextResponse.json({ data: history });
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.status ?? 500 }
    );
  }
}
