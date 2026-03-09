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
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: { code: 'SESSION_NOT_FOUND', message: '세션 토큰이 필요합니다.' } },
        { status: 401 }
      );
    }

    const result = await validateSession(token);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message ?? '서버 오류가 발생했습니다.' } },
      { status: error.status ?? 500 }
    );
  }
}
