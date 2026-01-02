import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/messages/conversations/[conversationId] - Get messages with a user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { conversationId } = await params

    console.log('Debug - conversationId:', conversationId)
    console.log('Debug - session.user.id:', session.user.id)

    const messages = await db.message.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: conversationId
          },
          {
            senderId: conversationId,
            receiverId: session.user.id
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            story: {
              select: {
                id: true,
                imageUrl: true,
                userId: true
              }
            }
          }
        },
        story: {
          select: {
            id: true,
            imageUrl: true,
            userId: true
          }
        }
      }
    })

    // Mark messages as read for the receiver
    if (conversationId !== session.user.id) {
      await db.message.updateMany({
        where: {
          senderId: conversationId,
          receiverId: session.user.id,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      })

      // Emit real-time update to the sender
      const { emitMessagesRead } = await import('@/lib/websocket')
      emitMessagesRead(conversationId, session.user.id) // conversationId is the sender, session.user.id is the reader
    }

    // Reverse to show oldest first
    messages.reverse()

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Messages fetch error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    )
  }
}
