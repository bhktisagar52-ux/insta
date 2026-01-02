import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; storyId: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { userId, storyId } = params

    // Verify the story exists and belongs to the user
    const story = await db.story.findFirst({
      where: {
        id: storyId,
        userId: userId,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Create a message in the chat between the replier and story owner
    const message = await db.message.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        receiverId: userId,
        storyId: storyId,
      }
    })

    // Create notification for the story owner
    if (session.user.id !== userId) {
      await db.notification.create({
        data: {
          type: 'story_reply',
          userId: userId,
          actorId: session.user.id,
          storyId: storyId,
        }
      })
    }

    return NextResponse.json({ message: 'Reply sent successfully', messageId: message.id })
  } catch (error) {
    console.error('Story reply error:', error)
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }
}
