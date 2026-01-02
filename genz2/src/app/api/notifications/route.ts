import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/notifications - Get user notifications
export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Fetch post images for like/comment notifications
    const notificationsWithPosts = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.postId) {
          const post = await db.post.findUnique({
            where: { id: notification.postId },
            select: { imageUrl: true }
          })
          return {
            ...notification,
            post
          }
        }
        return notification
      })
    )

    return NextResponse.json(notificationsWithPosts)
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
