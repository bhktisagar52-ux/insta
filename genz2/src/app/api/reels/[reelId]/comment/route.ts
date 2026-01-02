
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/reels/[reelId]/comment - Get comments for a reel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reelId: string }> }
) {
  try {
    const session = await getSession()

    // Check if user is authenticated (optional for viewing comments)
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { reelId } = await params

    const reel = await db.reel.findUnique({
      where: { id: reelId },
      select: { id: true, allowComments: true }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    // Get comments with user info
    const comments = await db.videoComment.findMany({
      where: {
        reelId: reelId,
        parentId: null // Only top-level comments for now
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform comments to match frontend interface
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      username: comment.user.username || comment.user.name || 'User',
      avatar: comment.user.avatar,
      createdAt: comment.createdAt.toISOString(),
      likes: 0, // TODO: Implement comment likes
      isLiked: false, // TODO: Implement comment likes
      repliesCount: comment._count.replies
    }))

    // Get total count
    const totalCount = await db.videoComment.count({
      where: { reelId: reelId }
    })

    return NextResponse.json({
      comments: transformedComments,
      totalCount
    })
  } catch (error) {
    console.error('Get reel comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/reels/[reelId]/comment - Create a new comment on a reel
export async function POST(
  request: Request,
  { params }: { params: Promise<{ reelId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user exists in database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { reelId } = await params

    const body = await request.json()
    const { content, parentId } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Check if reel exists and allows comments
    const reel = await db.reel.findUnique({
      where: { id: reelId },
      select: { id: true, allowComments: true, userId: true }
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

    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await db.videoComment.findUnique({
        where: { id: parentId },
        select: { id: true, reelId: true }
      })

      if (!parentComment || parentComment.reelId !== reelId) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create the comment
    const comment = await db.videoComment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        reelId: reelId,
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Create notification if commenting on someone else's reel
    if (reel.userId !== session.user.id) {
      await createNotification({
        userId: reel.userId,
        actorId: session.user.id,
        type: 'reel_comment',
        reelId: reelId,
        commentId: comment.id
      })
    }

    // If this is a reply, also notify the parent comment author
    if (parentId) {
      const parentComment = await db.videoComment.findUnique({
        where: { id: parentId },
        select: { userId: true }
      })

      if (parentComment && parentComment.userId !== session.user.id && parentComment.userId !== reel.userId) {
        await createNotification({
          userId: parentComment.userId,
          actorId: session.user.id,
          type: 'reply',
          reelId: reelId,
          commentId: comment.id
        })
      }
    }

    // Transform the comment for the response
    const transformedComment = {
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      username: comment.user.username || comment.user.name || 'User',
      avatar: comment.user.avatar,
      createdAt: comment.createdAt.toISOString(),
      likes: 0,
      isLiked: false,
      repliesCount: 0
    }

    return NextResponse.json(transformedComment, { status: 201 })
  } catch (error) {
    console.error('Create reel comment error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
