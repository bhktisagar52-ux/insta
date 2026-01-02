import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/users/[username]/follow - Check if current user is following
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user to check follow status
    const userToCheck = await db.user.findUnique({
      where: { username: params.username }
    })

    if (!userToCheck) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if following
    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userToCheck.id
        }
      }
    })

    // Check for mutual follow (if checkUser param is provided)
    const url = new URL(request.url)
    const checkUserId = url.searchParams.get('checkUser')

    let isFollowingBack = false
    if (checkUserId) {
      const mutualFollow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userToCheck.id,
            followingId: checkUserId
          }
        }
      })
      isFollowingBack = !!mutualFollow
    }

    return NextResponse.json({
      isFollowing: follow?.status === 'accepted',
      isPending: follow?.status === 'pending',
      isFollowingBack
    })
  } catch (error) {
    console.error('Follow check error:', error)
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    )
  }
}

// POST /api/users/[username]/follow - Follow user
export async function POST(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user to follow
    const userToFollow = await db.user.findUnique({
      where: { username: params.username }
    })

    if (!userToFollow) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (userToFollow.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userToFollow.id
        }
      }
    })

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following' },
        { status: 400 }
      )
    }

    // Check if the user being followed has a private account
    const isPrivateAccount = userToFollow.isPrivate

    // Create follow
    await db.follow.create({
      data: {
        followerId: session.user.id,
        followingId: userToFollow.id,
        status: isPrivateAccount ? 'pending' : 'accepted'
      }
    })

    // Create notification
    await db.notification.create({
      data: {
        type: isPrivateAccount ? 'follow_request' : 'follow',
        userId: userToFollow.id,
        actorId: session.user.id
      }
    })

    return NextResponse.json({ message: 'Followed successfully' })
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[username]/follow - Unfollow user
export async function DELETE(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user to unfollow
    const userToUnfollow = await db.user.findUnique({
      where: { username: params.username }
    })

    if (!userToUnfollow) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete follow
    await db.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: userToUnfollow.id
      }
    })

    return NextResponse.json({ message: 'Unfollowed successfully' })
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    )
  }
}
