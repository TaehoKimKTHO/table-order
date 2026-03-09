import { addConnection } from '@/lib/sse';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const clientId = uuidv4();
  const stream = addConnection(clientId, 'admin');

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
