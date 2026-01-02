import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/reels/[reelId]/share - Share a reel
export async function POST(
  request: Request,
  { params }: { params: { reelId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { platform, shareUrl } = body

    const reel = await db.reel.findUnique({
      where: { id: params.reelId }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    // Create share record
    await db.videoShare.create({
      data: {
        userId: session.user.id,
        reelId: params.reelId,
        platform: platform || 'instagram',
        shareUrl: shareUrl || null
      }
    })

    // Update analytics - increment share count
    await db.videoAnalytics.update({
      where: { reelId: params.reelId },
      data: { shares: { increment: 1 }, engagementRate: { increment: 1 } }
    })

    // Create notification
    if (reel.userId !== session.user.id) {
      await db.notification.create({
        data: {
          userId: reel.userId,
          actorId: session.user.id,
          type: 'reel_share',
          reelId: params.reelId,
          read: false
        }
      })
    }

    return NextResponse.json({ message: 'Reel shared successfully' })
  } catch (error) {
    console.error('Reel share error:', error)
    return NextResponse.json(
      { error: 'Failed to share reel' },
      { status: 500 }
    )
  }
}
