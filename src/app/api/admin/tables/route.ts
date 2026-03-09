import { NextRequest, NextResponse } from 'next/server'
import { getTables, createTable } from '@/lib/table'

// GET /api/admin/tables — 테이블 목록 조회
export async function GET() {
  try {
    const storeId = 1
    const tables = getTables(storeId)
    return NextResponse.json({ data: tables })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: 500 })
  }
}

// POST /api/admin/tables — 테이블 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableNumber } = body
    const storeId = 1
    const table = createTable(storeId, tableNumber)
    return NextResponse.json({ data: table }, { status: 201 })
  } catch (e) {
    const err = e as Error
    const statusCode = err.message === 'INVALID_TABLE_NUMBER' ? 400
      : err.message === 'DUPLICATE_TABLE_NUMBER' ? 409
      : 500
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: statusCode })
  }
}
