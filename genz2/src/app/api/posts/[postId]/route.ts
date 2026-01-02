import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/posts/[postId] - Get single post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Transform the post data to match frontend expectations
    const transformedPost = {
      id: post.id,
      caption: post.caption,
      imageUrl: post.imageUrl,
      location: post.location,
      createdAt: post.createdAt,
      user: post.user,
      likes: post._count.likes,
      comments: post._count.comments,
      isLiked: false // Temporarily set to false until auth is fixed
    }

    return NextResponse.json(transformedPost)
  } catch (error) {
    console.error('Post fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[postId] - Delete a post
export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const post = await db.post.findUnique({
      where: { id: params.postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await db.post.delete({
      where: { id: params.postId }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Post deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
