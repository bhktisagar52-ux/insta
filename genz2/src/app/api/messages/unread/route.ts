import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Count unique users who have sent unread messages to the current user
    const unreadUsers = await db.message.findMany({
      where: {
        receiverId: session.user.id,
        read: false
      },
      select: {
        senderId: true
      },
      distinct: ['senderId']
    })

    const unreadCount = unreadUsers.length

    return NextResponse.json({ count: unreadCount })
  } catch (error) {
    console.error('Unread messages count error:', error)
    return NextResponse.json(
      { error: 'Failed to get unread messages count' },
      { status: 500 }
    )
  }
}
