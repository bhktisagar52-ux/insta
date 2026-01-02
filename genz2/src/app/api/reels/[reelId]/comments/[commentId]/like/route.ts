import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/reels/[reelId]/comments/[commentId]/like - Like/unlike a comment
export async function POST(
  request: Request,
  { params }: { params: { reelId: string; commentId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const comment = await db.videoComment.findUnique({
      where: { id: params.commentId },
      select: { id: true, reelId: true, userId: true }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.reelId !== params.reelId) {
      return NextResponse.json(
        { error: 'Comment does not belong to this reel' },
        { status: 400 }
      )
    }

    // Check if user already liked this comment
    const existingLike = await db.videoCommentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: params.commentId
        }
      }
    })

    let liked = false
    let likesCount = 0

    if (existingLike) {
      // Unlike the comment
      await db.videoCommentLike.delete({
        where: { id: existingLike.id }
      })
      liked = false
    } else {
      // Like the comment
      await db.videoCommentLike.create({
        data: {
          userId: session.user.id,
          commentId: params.commentId
        }
      })
      liked = true

      // Create notification (if not own comment)
      if (comment.userId !== session.user.id) {
        await db.notification.create({
          data: {
            userId: comment.userId,
            actorId: session.user.id,
            type: 'reel_comment_like',
            videoCommentId: params.commentId,
            reelId: params.reelId,
            read: false
          }
        })
      }
    }

    // Get updated likes count
    likesCount = await db.videoCommentLike.count({
      where: { commentId: params.commentId }
    })

    return NextResponse.json({
      liked,
      likesCount
    })
  } catch (error) {
    console.error('Comment like error:', error)
    return NextResponse.json(
      { error: 'Failed to like comment' },
      { status: 500 }
    )
  }
}
