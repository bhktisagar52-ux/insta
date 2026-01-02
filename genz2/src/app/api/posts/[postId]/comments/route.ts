import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

// GET /api/posts/[postId]/comments - Get comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const comments = await db.comment.findMany({
      where: { postId, parentId: null },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            likes: true,
            _count: {
              select: {
                likes: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        likes: true,
        _count: {
          select: {
            likes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform the data to include likes count and isLiked status
    const transformedComments = comments.map(comment => ({
      ...comment,
      likes: comment._count.likes,
      isLiked: false, // Temporarily set to false until auth is fixed
      replies: comment.replies.map(reply => ({
        ...reply,
        likes: reply._count.likes,
        isLiked: false // Temporarily set to false until auth is fixed
      }))
    }))

    return NextResponse.json(transformedComments)
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[postId]/comments - Create a comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = await params

    const body = await request.json()
    const { content, parentId } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
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

    // Create comment
    const comment = await db.comment.create({
      data: {
        content,
        userId: session.user.id,
        postId,
        parentId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    // Create notification if commenting on someone else's post
    if (post.userId !== session.user.id) {
      await createNotification({
        userId: post.userId,
        actorId: session.user.id,
        type: parentId ? 'reply' : 'comment',
        postId,
        commentId: comment.id
      })
    }

    // If this is a reply, also notify the parent comment author
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { userId: true }
      })

      if (parentComment && parentComment.userId !== session.user.id && parentComment.userId !== post.userId) {
        await createNotification({
          userId: parentComment.userId,
          actorId: session.user.id,
          type: 'reply',
          postId,
          commentId: comment.id
        })
      }
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
