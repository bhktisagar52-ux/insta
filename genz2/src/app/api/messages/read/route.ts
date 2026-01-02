import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { emitMessagesRead } from '@/lib/websocket'

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { senderId } = body

    if (!senderId) {
      return NextResponse.json(
        { error: 'Sender ID is required' },
        { status: 400 }
      )
    }

    // Mark all messages from this sender to the current user as read
    await db.message.updateMany({
      where: {
        senderId,
        receiverId: session.user.id,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    // Emit real-time update to the sender
    emitMessagesRead(senderId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark messages as read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
