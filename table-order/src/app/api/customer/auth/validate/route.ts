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
