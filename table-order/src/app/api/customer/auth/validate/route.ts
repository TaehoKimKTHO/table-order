import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';
import { extractToken, errorResponse, successResponse } from '@/lib/api-utils';
import { AppError, ErrorCode } from '@/types/error';

/**
 * GET /api/customer/auth/validate
 * 세션 토큰 유효성 검증
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, '세션 토큰이 필요합니다.');
    }

    const result = validateSession(token);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
