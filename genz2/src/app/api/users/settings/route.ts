import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/users/settings - Get user settings
export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        isPrivate: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      isPrivate: user.isPrivate || false
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/settings - Update user settings
export async function PATCH(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { isPrivate } = body

    if (typeof isPrivate !== 'boolean') {
      return NextResponse.json(
        { error: 'isPrivate must be a boolean' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { isPrivate },
      select: {
        isPrivate: true
      }
    })

    return NextResponse.json({
      isPrivate: user.isPrivate
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
