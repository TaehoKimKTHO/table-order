import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/types/error';

/** 인증된 요청 컨텍스트 */
export interface AuthContext {
  tableId: number;
  sessionId: number;
  tableNumber: number;
  sessionToken: string;
}

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * 에러 응답 생성
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다.' } },
    { status: 500 }
  );
}

/**
 * 성공 응답 생성
 */
export function successResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * 요청 바디 파싱 (JSON)
 */
export async function parseBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json() as T;
  } catch {
    throw new AppError('EMPTY_ORDER' as never, '유효하지 않은 요청 형식입니다.', 400);
  }
}

/**
 * URL 파라미터를 양의 정수로 파싱
 */
export function parseIntParam(value: string | undefined, name: string): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new AppError(
      'INVALID_TABLE_NUMBER' as never,
      `유효하지 않은 ${name} 값입니다.`,
      400
    );
  }
  return num;
}
