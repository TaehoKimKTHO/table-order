import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getMenuItems } from '@/lib/menu';
import { extractToken, errorResponse, successResponse, parseIntParam } from '@/lib/api-utils';
import { AppError, ErrorCode } from '@/types/error';

/**
 * GET /api/customer/menu/[categoryId]
 * 카테고리별 메뉴 조회 (판매 가능 메뉴만)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const token = extractToken(request);
    if (!token) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, '세션 토큰이 필요합니다.');
    }

    validateSession(token);

    const { categoryId } = await params;
    const id = parseIntParam(categoryId, 'categoryId');
    const items = getMenuItems(id);

    return successResponse({ items });
  } catch (error) {
    return errorResponse(error);
  }
}
