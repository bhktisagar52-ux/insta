import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

// POST /api/posts/[postId]/like - Toggle like on a post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession()
    const { postId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked the post
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike the post
      await db.like.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId
          }
        }
      })

      // Get updated likes count
      const likesCount = await db.like.count({
        where: { postId: postId }
      })

      return NextResponse.json({
        liked: false,
        likesCount
      })
    } else {
      // Like the post
      await db.like.create({
        data: {
          userId: session.user.id,
          postId: postId
        }
      })

      // Get updated likes count
      const likesCount = await db.like.count({
        where: { postId: postId }
      })

      // Create notification if liking someone else's post
      if (post.userId !== session.user.id) {
        await createNotification({
          userId: post.userId,
          actorId: session.user.id,
          type: 'like',
          postId: postId
        })
      }

      return NextResponse.json({
        liked: true,
        likesCount
      })
    }
  } catch (error) {
    console.error('Post like error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle post like' },
      { status: 500 }
    )
  }
}
