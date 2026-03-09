import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/order';
import { notifyOrderStatusChange } from '@/lib/sse';

// PATCH /api/admin/orders/[id]/status — 주문 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status: 'preparing' | 'completed' };

    if (!status || !['preparing', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS_TRANSITION', message: '유효하지 않은 상태입니다.' } },
        { status: 400 }
      );
    }

    const order = await updateOrderStatus(parseInt(id, 10), status);

    // SSE 알림
    notifyOrderStatusChange({
      orderId: order.id,
      tableId: order.table_id,
      status: order.status,
    });

    return NextResponse.json(order);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; status?: number };
    if (error.code && error.status) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
