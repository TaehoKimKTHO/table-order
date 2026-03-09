import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createOrder, getOrdersBySession } from '@/lib/order';
import { notifyNewOrder } from '@/lib/sse';
import { extractToken, errorResponse, successResponse, parseBody } from '@/lib/api-utils';
import { AppError, ErrorCode } from '@/types/error';
import type { CreateOrderRequest } from '@/types/order';

/**
 * POST /api/customer/orders
 * 주문 생성
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, '세션 토큰이 필요합니다.');
    }

    const session = validateSession(token);
    const body = await parseBody<CreateOrderRequest>(request);

    // 요청 검증
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new AppError(ErrorCode.EMPTY_ORDER, '주문 항목이 비어있습니다.');
    }

    for (const item of body.items) {
      if (!item.menuItemId || !Number.isInteger(item.menuItemId) || item.menuItemId <= 0) {
        throw new AppError(ErrorCode.MENU_NOT_FOUND, '유효하지 않은 메뉴 ID입니다.');
      }
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        throw new AppError(ErrorCode.INVALID_QUANTITY, '수량은 1~99 사이여야 합니다.');
      }
    }

    const order = createOrder(session.tableId, session.sessionId, body.items);

    // 관리자에게 신규 주문 알림
    notifyNewOrder(order);

    return successResponse(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * GET /api/customer/orders
 * 현재 세션 주문 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, '세션 토큰이 필요합니다.');
    }

    const session = validateSession(token);
    const orders = getOrdersBySession(session.sessionId);

    return successResponse({ orders });
  } catch (error) {
    return errorResponse(error);
  }
}
