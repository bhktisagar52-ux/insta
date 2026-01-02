import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/posts/[postId]/comments/[commentId]/like - Toggle like on a comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const session = await getSession()
    const { postId, commentId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user already liked the comment
    const existingLike = await db.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: commentId
        }
      }
    })

    if (existingLike) {
      // Unlike the comment
      await db.commentLike.delete({
        where: {
          userId_commentId: {
            userId: session.user.id,
            commentId: commentId
          }
        }
      })

      // Get updated likes count
      const likesCount = await db.commentLike.count({
        where: { commentId: commentId }
      })

      return NextResponse.json({
        liked: false,
        likesCount
      })
    } else {
      // Like the comment
      await db.commentLike.create({
        data: {
          userId: session.user.id,
          commentId: commentId
        }
      })

      // Get updated likes count
      const likesCount = await db.commentLike.count({
        where: { commentId: commentId }
      })

      // Create notification if liking someone else's comment
      if (comment.userId !== session.user.id) {
        await db.notification.create({
          data: {
            type: 'comment_like',
            userId: comment.userId,
            actorId: session.user.id,
            postId: postId,
            commentId: commentId
          }
        })
      }

      return NextResponse.json({
        liked: true,
        likesCount
      })
    }
  } catch (error) {
    console.error('Comment like error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle comment like' },
      { status: 500 }
    )
  }
}
