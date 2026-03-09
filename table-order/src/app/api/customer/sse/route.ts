import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';
import { addConnection, removeConnection } from '@/lib/sse';
import { extractToken } from '@/lib/api-utils';
import { AppError, ErrorCode } from '@/types/error';

/**
 * GET /api/customer/sse
 * SSE 연결 (주문 상태 실시간 업데이트)
 */
export async function GET(request: NextRequest) {
  try {
    // SSE는 헤더 또는 쿼리 파라미터로 토큰 전달
    const token =
      extractToken(request) ||
      request.nextUrl.searchParams.get('token');

    if (!token) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, '세션 토큰이 필요합니다.');
    }

    const session = validateSession(token);
    const clientId = `customer-${session.tableId}-${Date.now()}`;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // 초기 연결 확인 이벤트
        controller.enqueue(
          encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId, type: 'customer', tableId: session.tableId })}\n\n`)
        );

        // SSE 연결 등록
        addConnection(clientId, 'customer', session.tableId, {
          send(event: string, data: unknown) {
            try {
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
              );
            } catch {
              // 연결 종료됨
              removeConnection(clientId);
            }
          },
        });

        // 연결 종료 감지
        request.signal.addEventListener('abort', () => {
          removeConnection(clientId);
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return new Response(JSON.stringify(error.toJSON()), {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: '서버 오류' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
