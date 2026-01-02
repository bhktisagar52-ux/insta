import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/messages - Send a message
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
    const { receiverId, content, imageUrl, replyToId } = body

    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: 'Content or image is required' },
        { status: 400 }
      )
    }

    // Check if receiver exists
    const receiver = await db.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      )
    }

    // Create message
    const message = await db.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        imageUrl,
        replyToId,
        delivered: true // Message is delivered immediately when sent
      },
      include: {
        reactions: true,
        replyTo: true
      }
    })

    // Only create notification for story replies, not regular messages
    // Check if this message is a reply to a story
    if (replyToId) {
      const replyToMessage = await db.message.findUnique({
        where: { id: replyToId },
        include: { story: true }
      })

      if (replyToMessage?.story) {
        // This is a story reply - create notification
        await db.notification.create({
          data: {
            type: 'message',
            userId: receiverId,
            actorId: session.user.id
          }
        })
      }
    }

    // Emit new message via WebSocket
    const conversationId = [session.user.id, receiverId].sort().join('-')
    const { emitNewMessage } = await import('@/lib/websocket')
    emitNewMessage(conversationId, message)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Message send error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
