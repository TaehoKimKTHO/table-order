import { NextResponse } from 'next/server'
import { getAllActiveOrders } from '@/lib/order'

// GET /api/admin/orders — 전체 활성 주문 조회
export async function GET() {
  try {
    const storeId = 1 // MVP: 단일 매장
    const orders = getAllActiveOrders(storeId)
    return NextResponse.json({ data: orders })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: 500 })
  }
}
