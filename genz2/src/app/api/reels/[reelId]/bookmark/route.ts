import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/reels/[reelId]/bookmark - Bookmark/unbookmark a reel
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

    const { reelId } = await params

    // Check if reel exists
    const reel = await db.reel.findUnique({
      where: { id: reelId }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    // Check if already bookmarked
    const existingBookmark = await db.videoBookmark.findUnique({
      where: {
        userId_reelId: {
          userId: session.user.id,
          reelId
        }
      }
    })

    if (existingBookmark) {
      // Unbookmark
      await db.videoBookmark.delete({
        where: { id: existingBookmark.id }
      })

      return NextResponse.json({ bookmarked: false })
    }

    // Bookmark
    await db.videoBookmark.create({
      data: {
        userId: session.user.id,
        reelId
      }
    })

    return NextResponse.json({ bookmarked: true })
  } catch (error) {
    console.error('Bookmark error:', error)
    return NextResponse.json(
      { error: 'Failed to bookmark reel' },
      { status: 500 }
    )
  }
}
