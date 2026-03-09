import { NextRequest, NextResponse } from 'next/server';
import { deleteOrder } from '@/lib/order';
import { notifyOrderDeleted } from '@/lib/sse';

// DELETE /api/admin/orders/[id] — 주문 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteOrder(parseInt(id, 10));

    // SSE 알림
    notifyOrderDeleted(result.orderId, result.tableId);

    return NextResponse.json({ success: true, ...result });
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
