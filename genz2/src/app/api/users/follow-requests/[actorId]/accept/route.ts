import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/users/follow-requests/[actorId]/accept - Accept follow request
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

    // Update the follow request status to accepted
    const follow = await db.follow.updateMany({
      where: {
        followerId: actorId,
        followingId: session.user.id,
        status: 'pending'
      },
      data: {
        status: 'accepted'
      }
    })

    if (follow.count === 0) {
      return NextResponse.json(
        { error: 'Follow request not found' },
        { status: 404 }
      )
    }

    // Create notification for the requester
    await db.notification.create({
      data: {
        type: 'follow_request_accepted',
        userId: actorId,
        actorId: session.user.id
      }
    })

    return NextResponse.json({ message: 'Follow request accepted' })
  } catch (error) {
    console.error('Accept follow request error:', error)
    return NextResponse.json(
      { error: 'Failed to accept follow request' },
      { status: 500 }
    )
  }
}
