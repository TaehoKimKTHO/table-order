import { NextRequest } from 'next/server';
import { loginTable } from '@/lib/auth';
import { errorResponse, successResponse, parseBody } from '@/lib/api-utils';

interface LoginRequest {
  storeCode: string;
  tableNumber: number;
}

/**
 * POST /api/customer/auth/login
 * 테이블 로그인 (매장코드 + 테이블번호)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<LoginRequest>(request);

    if (!body.storeCode || typeof body.storeCode !== 'string') {
      return successResponse(
        { error: { code: 'BAD_REQUEST', message: '매장코드는 필수입니다.' } },
        400
      );
    }

    if (!body.tableNumber || !Number.isInteger(body.tableNumber) || body.tableNumber <= 0) {
      return successResponse(
        { error: { code: 'BAD_REQUEST', message: '테이블번호는 양의 정수여야 합니다.' } },
        400
      );
    }

    const result = loginTable(body.storeCode, body.tableNumber);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
import { NextRequest, NextResponse } from 'next/server';
import { loginTable } from '@/lib/auth';
import type { LoginRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;

    if (!body.storeCode || typeof body.tableNumber !== 'number') {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: '매장 코드와 테이블 번호를 입력해주세요.' } },
        { status: 400 }
      );
    }

    const result = await loginTable(body.storeCode, body.tableNumber);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message ?? '서버 오류가 발생했습니다.' } },
      { status: error.status ?? 500 }
    );
  }
}
