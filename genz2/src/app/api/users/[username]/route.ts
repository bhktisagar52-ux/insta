import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/users/[username] - Get user profile
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: { username: params.username },
      select: {
        id: true,
        username: true,
        email: false,
        name: true,
        bio: true,
        avatar: true,
        website: true,
        isPrivate: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[username] - Update user profile
export async function PUT(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is updating their own profile
    if (session.user.username !== params.username) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, bio, website, avatar } = body

    const user = await db.user.update({
      where: { username: params.username },
      data: {
        name,
        bio,
        website,
        avatar
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        website: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
