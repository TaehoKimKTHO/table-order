import { NextRequest, NextResponse } from 'next/server'
import { completeTable } from '@/lib/table'
import { broadcastToTable, broadcastToAdmin } from '@/lib/sse'

// POST /api/admin/tables/[tableId]/complete — 매장 이용 완료
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params
    const tableIdNum = Number(tableId)
    const result = completeTable(tableIdNum)

    // SSE 알림: 고객에게 세션 종료 알림
    broadcastToTable(tableIdNum, 'table:completed', {
      tableId: tableIdNum,
      sessionId: result.session.id,
    })
    // SSE 알림: 관리자에게 테이블 상태 업데이트
    broadcastToAdmin('table:completed', {
      tableId: tableIdNum,
      sessionId: result.session.id,
    })

    return NextResponse.json({ data: result })
  } catch (e) {
    const err = e as Error
    const statusCode = err.message === 'SESSION_NOT_FOUND' ? 404 : 500
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: statusCode })
  }
}
