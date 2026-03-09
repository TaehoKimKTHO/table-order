import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getOrder } from '@/lib/order';
import { extractToken, errorResponse, successResponse, parseIntParam } from '@/lib/api-utils';
import { AppError, ErrorCode } from '@/types/error';

/**
 * GET /api/customer/orders/[orderId]
 * 주문 상세 조회 (자신의 세션 주문만)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const token = extractToken(request);
    if (!token) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, '세션 토큰이 필요합니다.');
    }

    const session = validateSession(token);
    const { orderId } = await params;
    const id = parseIntParam(orderId, 'orderId');
    const order = getOrder(id);

    // 자신의 세션 주문만 접근 가능
    if (order.sessionId !== session.sessionId) {
      return successResponse(
        { error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다.' } },
        403
      );
    }

    return successResponse(order);
  } catch (error) {
    return errorResponse(error);
  }
}
