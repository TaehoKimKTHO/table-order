import { NextResponse } from 'next/server'
import { addConnection, removeConnection } from '@/lib/sse'
import { v4 as uuidv4 } from 'uuid'

// GET /api/admin/sse — 관리자 SSE 연결
export async function GET() {
  const clientId = uuidv4()

  const stream = new ReadableStream({
    start(controller) {
      addConnection(clientId, 'admin', controller)

      // 초기 연결 확인 이벤트
      const msg = `event: connected\ndata: ${JSON.stringify({ clientId, type: 'admin' })}\n\n`
      controller.enqueue(new TextEncoder().encode(msg))
    },
    cancel() {
      removeConnection(clientId)
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
