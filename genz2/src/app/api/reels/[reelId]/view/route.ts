import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/reels/[reelId]/view - Track a view on a reel
export async function POST(
  request: Request,
  { params }: { params: { reelId: string } }
) {
  try {
    const session = await getSession()
    const reelId = params.reelId

    // Validate reel exists
    const reel = await db.reel.findUnique({
      where: { id: reelId },
      select: { id: true, userId: true }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    // Track the view (always count, even for same user multiple times)
    await db.videoView.create({
      data: {
        reelId,
        userId: session?.user?.id || null, // Allow anonymous views
        viewedAt: new Date()
      }
    })

    // Get updated view count
    const viewCount = await db.videoView.count({
      where: { reelId }
    })

    return NextResponse.json({ viewCount })
  } catch (error) {
    console.error('View tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}

// GET /api/reels/[reelId]/view - Get view count for a reel
export async function GET(
  request: Request,
  { params }: { params: { reelId: string } }
) {
  try {
    const reelId = params.reelId

    // Validate reel exists
    const reel = await db.reel.findUnique({
      where: { id: reelId },
      select: { id: true }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    // Get view count
    const viewCount = await db.videoView.count({
      where: { reelId }
    })

    return NextResponse.json({ viewCount })
  } catch (error) {
    console.error('View count fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch view count' },
      { status: 500 }
    )
  }
}
