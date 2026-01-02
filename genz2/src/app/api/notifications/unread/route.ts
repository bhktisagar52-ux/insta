import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUnreadNotificationCount } from '@/lib/notifications'

// GET /api/notifications/unread - Get unread notification count for current user
export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 })
    }

    const count = await getUnreadNotificationCount(session.user.id)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Failed to get unread notification count:', error)
    return NextResponse.json(
      { error: 'Failed to get unread notification count' },
      { status: 500 }
    )
  }
}
