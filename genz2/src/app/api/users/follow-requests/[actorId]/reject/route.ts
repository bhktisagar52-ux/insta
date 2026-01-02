import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/users/follow-requests/[actorId]/reject - Reject follow request
export async function POST(
  request: Request,
  { params }: { params: { actorId: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const actorId = params.actorId

    // First check if the follow request exists
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: actorId,
          followingId: session.user.id
        }
      }
    })

    console.log('Existing follow:', existingFollow)
    console.log('Actor ID:', actorId)
    console.log('Session user ID:', session.user.id)

    if (!existingFollow || existingFollow.status !== 'pending') {
      return NextResponse.json(
        { error: 'Follow request not found or not pending' },
        { status: 404 }
      )
    }

    // Delete the follow request
    const follow = await db.follow.deleteMany({
      where: {
        followerId: actorId,
        followingId: session.user.id,
        status: 'pending'
      }
    })

    if (follow.count === 0) {
      return NextResponse.json(
        { error: 'Failed to delete follow request' },
        { status: 500 }
      )
    }

    // Create notification for the requester
    await db.notification.create({
      data: {
        type: 'follow_request_rejected',
        userId: actorId,
        actorId: session.user.id
      }
    })

    return NextResponse.json({ message: 'Follow request rejected' })
  } catch (error) {
    console.error('Reject follow request error:', error)
    return NextResponse.json(
      { error: 'Failed to reject follow request' },
      { status: 500 }
    )
  }
}
