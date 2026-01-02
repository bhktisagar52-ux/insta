import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/posts/[postId]/bookmark - Bookmark a post
export async function POST(
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

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: params.postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create bookmark
    const bookmark = await db.bookmark.create({
      data: {
        userId: session.user.id,
        postId: params.postId
      }
    })

    return NextResponse.json({ message: 'Post bookmarked', bookmark })
  } catch (error) {
    // If bookmark already exists, user might be trying to bookmark again
    console.error('Bookmark error:', error)
    return NextResponse.json(
      { error: 'Failed to bookmark post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[postId]/bookmark - Unbookmark a post
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

    await db.bookmark.deleteMany({
      where: {
        userId: session.user.id,
        postId: params.postId
      }
    })

    return NextResponse.json({ message: 'Post unbookmarked' })
  } catch (error) {
    console.error('Unbookmark error:', error)
    return NextResponse.json(
      { error: 'Failed to unbookmark post' },
      { status: 500 }
    )
  }
}
