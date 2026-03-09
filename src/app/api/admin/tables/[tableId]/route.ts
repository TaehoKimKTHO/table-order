import { NextRequest, NextResponse } from 'next/server'
import { updateTable } from '@/lib/table'

// PUT /api/admin/tables/[tableId] — 테이블 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params
    const body = await request.json()
    const table = updateTable(Number(tableId), body)
    return NextResponse.json({ data: table })
  } catch (e) {
    const err = e as Error
    const statusCode = err.message === 'TABLE_NOT_FOUND' ? 404
      : err.message === 'INVALID_TABLE_NUMBER' ? 400
      : err.message === 'DUPLICATE_TABLE_NUMBER' ? 409
      : 500
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: statusCode })
  }
}
