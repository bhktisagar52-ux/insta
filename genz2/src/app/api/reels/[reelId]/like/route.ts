import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

// POST /api/reels/[reelId]/like - Like a reel
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

    const reel = await db.reel.findUnique({
      where: { id: reelId }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await db.videoLike.findUnique({
      where: {
        userId_reelId: {
          userId: session.user.id,
          reelId: params.reelId
        }
      }
    })

    if (existingLike) {
      // Unlike
      await db.videoLike.delete({
        where: { id: existingLike.id }
      })

      await db.videoAnalytics.update({
        where: { reelId: params.reelId },
        data: { likes: { decrement: 1 } }
      })

      return NextResponse.json({ liked: false })
    }

    // Create like
    await db.videoLike.create({
      data: {
        userId: session.user.id,
        reelId: params.reelId
      }
    })

    // Update analytics
    await db.videoAnalytics.update({
      where: { reelId_userId: { reelId, userId: reel.userId } },
      data: { likes: { increment: 1 } }
    })

    // Create notification
    if (reel.userId !== session.user.id) {
      await db.notification.create({
        data: {
          userId: reel.userId,
          actorId: session.user.id,
          type: 'reel_like',
          reelId: params.reelId,
          read: false
        }
      })
    }

    return NextResponse.json({ liked: true })
  } catch (error) {
    console.error('Reel like error:', error)
    return NextResponse.json(
      { error: 'Failed to like reel' },
      { status: 500 }
    )
  }
}
