import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession()
    const { userId } = params
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get('storyId')

    // Check if the current user is the story owner
    if (session?.user?.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Build where clause
    const whereClause: any = {
      story: {
        userId: userId
      }
    }

    if (storyId) {
      whereClause.storyId = storyId
    }

    // Get story views
    const storyViews = await db.storyView.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        story: {
          select: {
            id: true,
            imageUrl: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' }
    })

    if (storyId) {
      // Return viewers for specific story
      const viewers = storyViews.map(view => ({
        id: view.id,
        user: view.user,
        viewedAt: view.viewedAt.toISOString(),
        reaction: view.reaction
      }))
      return NextResponse.json(viewers)
    } else {
      // Group views by story (original behavior)
      const groupedViews = storyViews.reduce((acc, view) => {
        const storyId = view.story.id
        if (!acc[storyId]) {
          acc[storyId] = {
            storyId,
            storyImage: view.story.imageUrl,
            viewers: []
          }
        }
        acc[storyId].viewers.push({
          id: view.id,
          user: view.user,
          viewedAt: view.viewedAt.toISOString(),
          reaction: view.reaction
        })
        return acc
      }, {} as Record<string, any>)

      return NextResponse.json(Object.values(groupedViews))
    }
  } catch (error) {
    console.error('Story viewers fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch story viewers' },
      { status: 500 }
    )
  }
}
