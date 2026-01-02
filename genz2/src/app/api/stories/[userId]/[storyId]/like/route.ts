import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { userId: string; storyId: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storyId } = params

    // Check if user has liked this story
    const like = await db.storyLike.findFirst({
      where: {
        storyId,
        userId: session.user.id
      }
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error('Story like check error:', error)
    return NextResponse.json(
      { error: 'Failed to check story like status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string; storyId: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storyId } = params

    // Check if like already exists
    const existingLike = await db.storyLike.findFirst({
      where: {
        storyId,
        userId: session.user.id
      }
    })

    if (existingLike) {
      // Unlike: delete the like
      await db.storyLike.delete({
        where: { id: existingLike.id }
      })
      return NextResponse.json({ liked: false })
    } else {
      // Like: create the like
      await db.storyLike.create({
        data: {
          storyId,
          userId: session.user.id
        }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Story like toggle error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle story like' },
      { status: 500 }
    )
  }
}
