import { NextResponse } from 'next/server';
import { getAllActiveOrders } from '@/lib/order';

// GET /api/admin/orders — 전체 활성 주문 조회
export async function GET() {
  try {
    // MVP: storeId=1 (단일 매장)
    const orders = await getAllActiveOrders(1);
    return NextResponse.json(orders);
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
