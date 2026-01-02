import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/reels/[reelId] - Get a single reel
export async function GET(
  request: Request,
  { params }: { params: { reelId: string } }
) {
  try {
    const reel = await db.reel.findUnique({
      where: { id: params.reelId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          }
        },
        likes: {
          select: {
            userId: true
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              }
            }
          }
        },
        shares: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(reel)
  } catch (error) {
    console.error('Reel fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reel' },
      { status: 500 }
    )
  }
}

// PATCH /api/reels/[reelId] - Update reel details
export async function PATCH(
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
    const { caption, location, isPrivate, allowComments, allowDuet, allowRemix } = body

    const reel = await db.reel.findUnique({
      where: { id: params.reelId }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    if (reel.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only edit your own reels' },
        { status: 403 }
      )
    }

    // Update reel
    const updatedReel = await db.reel.update({
      where: { id: params.reelId },
      data: {
        caption,
        location,
        isPrivate,
        allowComments,
        allowDuet,
        allowRemix,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedReel)
  } catch (error) {
    console.error('Reel update error:', error)
    return NextResponse.json(
      { error: 'Failed to update reel' },
      { status: 500 }
    )
  }
}

// DELETE /api/reels/[reelId] - Delete a reel
export async function DELETE(
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

    const reel = await db.reel.findUnique({
      where: { id: params.reelId }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    if (reel.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own reels' },
        { status: 403 }
      )
    }

    await db.reel.delete({
      where: { id: params.reelId }
    })

    return NextResponse.json({ message: 'Reel deleted successfully' })
  } catch (error) {
    console.error('Reel delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete reel' },
      { status: 500 }
    )
  }
}
