import { NextRequest } from 'next/server'
import { initWebSocket } from '@/lib/websocket'

// This is a placeholder route to ensure the WebSocket path exists
// The actual WebSocket handling is done in server.js
export async function GET(request: NextRequest) {
  return new Response('WebSocket endpoint', { status: 200 })
}
