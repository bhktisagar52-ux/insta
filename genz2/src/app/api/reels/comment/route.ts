import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/reels/[reelId]/comment - Comment on a reel
export async function POST(
  request: Request,
  { params }: { params: { reelId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, parentId } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const reel = await db.reel.findUnique({
      where: { id: params.reelId }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    if (!reel.allowComments) {
      return NextResponse.json(
        { error: 'Comments are disabled for this reel' },
        { status: 403 }
      )
    }

    // Create comment
    const comment = await db.videoComment.create({
      data: {
        userId: session.user.id,
        reelId: params.reelId,
        content: content.trim(),
        parentId: parentId || null
      }
    })

    // Update reel comment count in analytics
    await db.videoAnalytics.update({
      where: { reelId: params.reelId },
      data: {
        comments: { increment: 1 },
        engagementRate: {
          increment: 1
        }
      }
    })

    // Create notification (if not own reel)
    if (reel.userId !== session.user.id) {
      await db.notification.create({
        data: {
          userId: reel.userId,
          actorId: session.user.id,
          type: 'reel_comment',
          videoCommentId: comment.id,
          reelId: params.reelId,
          read: false
        }
      })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Reel comment error:', error)
    return NextResponse.json(
      { error: 'Failed to comment on reel' },
      { status: 500 }
    )
  }
}
