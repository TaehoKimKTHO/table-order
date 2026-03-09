import { NextRequest, NextResponse } from 'next/server'
import { updateMenuOrder } from '@/lib/menu'

// PATCH /api/admin/menu/items/[id]/order — 메뉴 순서 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { sortOrder } = body
    updateMenuOrder(Number(id), sortOrder)
    return NextResponse.json({ data: { success: true } })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: 500 })
  }
}
