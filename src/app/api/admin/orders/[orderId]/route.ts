import { NextRequest, NextResponse } from 'next/server'
import { deleteOrder } from '@/lib/order'
import { notifyOrderDeleted } from '@/lib/sse'

// DELETE /api/admin/orders/[orderId] — 주문 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const { tableId } = deleteOrder(Number(orderId))
    notifyOrderDeleted(Number(orderId), tableId)
    return NextResponse.json({ data: { success: true } })
  } catch (e) {
    const err = e as Error
    const statusCode = err.message === 'ORDER_NOT_FOUND' ? 404 : 500
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: statusCode })
  }
}
