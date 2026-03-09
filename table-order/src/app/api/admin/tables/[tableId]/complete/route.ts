import { NextRequest, NextResponse } from 'next/server';
import { completeTable } from '@/lib/table';
import { broadcastToTable, broadcastToAdmin } from '@/lib/sse';

// POST /api/admin/tables/[tableId]/complete — 매장 이용 완료
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
    const tableIdNum = Number(tableId);
    const result = await completeTable(tableIdNum);

    broadcastToTable(tableIdNum, 'table:completed', {
      tableId: tableIdNum,
      sessionId: result.session.id,
    });
    broadcastToAdmin('table:completed', {
      tableId: tableIdNum,
      sessionId: result.session.id,
    });

    return NextResponse.json({ data: result });
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '서버 오류' } },
      { status: err.status ?? 500 }
    );
  }
}
