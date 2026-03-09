import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getAllMenuItems } from '@/lib/menu';
import { extractToken, errorResponse, successResponse } from '@/lib/api-utils';
import { AppError, ErrorCode } from '@/types/error';

/**
 * GET /api/customer/menu
 * 전체 메뉴 조회 (카테고리별 그룹핑, 판매 가능 메뉴만)
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, '세션 토큰이 필요합니다.');
    }

    validateSession(token);

    // 단일 매장이므로 storeId=1 사용 (Unit 1 시드 데이터 기준)
    const categories = getAllMenuItems(1);

    // 고객용: 판매 가능 메뉴만 필터링
    const filtered = categories.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.isAvailable),
    })).filter((cat) => cat.items.length > 0);

    return successResponse({ categories: filtered });
  } catch (error) {
    return errorResponse(error);
  }
}
