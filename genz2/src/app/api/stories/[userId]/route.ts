import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/stories/[userId] - Get user's stories
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession()
    const { userId } = params

    // Get active stories for this user
    const stories = await db.story.findMany({
      where: {
        userId,
        expiresAt: {
          gte: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            views: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform the data (simplified without view tracking for now)
    const transformedStories = stories.map((story) => ({
      id: story.id,
      imageUrl: story.imageUrl,
      caption: story.caption,
      textOverlay: story.textOverlay,
      textPosition: story.textPosition,
      textColor: story.textColor,
      fontSize: story.fontSize,
      createdAt: story.createdAt.toISOString(),
      user: story.user,
      views: story._count.views,
      likes: story._count.likes,
      replies: 0, // TODO: implement replies count
      hasViewed: false // TODO: implement view tracking
    }))

    return NextResponse.json(transformedStories)
  } catch (error) {
    console.error('User stories fetch error:', error)
    console.error('Error type:', typeof error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to fetch user stories', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
