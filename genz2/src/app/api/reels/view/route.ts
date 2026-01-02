import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/reels/[reelId]/view - Track when someone watches a reel
export async function POST(
  request: Request,
  { params }: { params: { reelId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      // Allow anonymous view tracking (no auth required)
      // In production, you might want to require auth
    }

    const reel = await db.reel.findUnique({
      where: { id: params.reelId }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    // Check if user has already viewed this reel
    const existingView = await db.reelView.findUnique({
      where: {
        reelId: params.reelId,
        userId: session?.user?.id
      }
    })

    if (existingView) {
      // Update existing view - increment watch time
      const watchTimeUpdate = Math.random() * 60 + 1 // Random 1-60 seconds (demo)
      await db.reelView.update({
        where: { id: existingView.id },
        data: {
          watchTime: { increment: watchTimeUpdate },
          completed: true // Mark as completed if they watched again
        }
      })
    } else {
      // Create new view record
      const watchTime = Math.random() * 30 + 5 // Random 5-35 seconds (demo)
      await db.reelView.create({
        data: {
          reelId: params.reelId,
          userId: session?.user?.id || null,
          watchTime,
          completed: false
        }
      })
    }

    // Update total views in analytics
    await db.videoAnalytics.update({
      where: { reelId: params.reelId },
      data: {
        views: { increment: 1 },
        watchTime: { increment: existingView ? (Math.random() * 60 + 1) : watchTime }
      }
    })

    // Calculate completion rate
    const totalViews = await db.videoAnalytics.findUnique({
      where: { reelId: params.reelId }
    })

    if (totalViews) {
      const completedViews = await db.reelView.count({
        where: {
          reelId: params.reelId,
          completed: true
        }
      })

      const completionRate = completedViews / totalViews.views

      await db.videoAnalytics.update({
        where: { reelId: params.reelId },
        data: {
          completionRate
        }
      })
    }

    return NextResponse.json({ message: 'View tracked' })
  } catch (error) {
    console.error('View tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}
