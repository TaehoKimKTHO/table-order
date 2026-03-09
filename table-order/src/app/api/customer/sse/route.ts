import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';
import { addConnection } from '@/lib/sse';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: { code: 'SESSION_NOT_FOUND', message: '세션 토큰이 필요합니다.' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const session = await validateSession(token);
    const clientId = uuidv4();
    const stream = addConnection(clientId, 'customer', session.tableId);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; status?: number };
    return new Response(
      JSON.stringify({ error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message ?? '서버 오류' } }),
      { status: error.status ?? 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
