import { NextRequest, NextResponse } from 'next/server'
import { updateOrderStatus } from '@/lib/order'
import { notifyOrderStatusChange } from '@/lib/sse'

// PATCH /api/admin/orders/[orderId]/status — 주문 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: { code: 'MISSING_STATUS', message: '상태값이 필요합니다.' } },
        { status: 400 }
      )
    }

    const order = updateOrderStatus(Number(orderId), status)
    notifyOrderStatusChange(order)
    return NextResponse.json({ data: order })
  } catch (e) {
    const err = e as Error
    const statusCode = err.message === 'ORDER_NOT_FOUND' ? 404
      : err.message === 'INVALID_STATUS_TRANSITION' ? 400
      : 500
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: statusCode })
  }
}
