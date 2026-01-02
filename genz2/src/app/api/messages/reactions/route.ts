import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/messages/reactions - Add reaction to message
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
    const { messageId, emoji } = body

    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: 'Message ID and emoji are required' },
        { status: 400 }
      )
    }

    // Check if message exists and user has access to it
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Check if reaction already exists
    const existingReaction = await db.messageReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    })

    if (existingReaction) {
      // Remove reaction if it exists
      await db.messageReaction.delete({
        where: { id: existingReaction.id }
      })
    } else {
      // Add reaction
      await db.messageReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reaction error:', error)
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    )
  }
}
