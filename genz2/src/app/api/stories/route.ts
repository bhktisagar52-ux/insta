import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/stories - Get available stories
export async function GET(request: Request) {
  try {
    // Stories are public, no auth required for viewing

    // Get active stories (not expired)
    const activeStories = await db.story.findMany({
      where: {
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
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Group by user and mark as having story
    const storiesMap = new Map()
    activeStories.forEach(story => {
      if (!storiesMap.has(story.userId)) {
        storiesMap.set(story.userId, {
          id: story.id,
          userId: story.userId,
          username: story.user.username,
          avatar: story.user.avatar,
          hasStory: true
        })
      }
    })

    const stories = Array.from(storiesMap.values())

    return NextResponse.json(stories)
  } catch (error) {
    console.error('Stories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}

// POST /api/stories - Create a story
export async function POST(request: Request) {
  try {
    console.log('Story creation API called')

    const session = await getSession()
    console.log('Session:', session?.user?.id ? 'authenticated' : 'not authenticated')

    if (!session?.user?.id) {
      console.log('No session user ID')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)

    const { imageUrl, caption, textOverlay, textPosition, textColor, fontSize } = body

    if (!imageUrl) {
      console.log('No image URL provided')
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // Create story (expires in 24 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    console.log('Creating story with data:', {
      userId: session.user.id,
      imageUrl,
      caption,
      textOverlay,
      textPosition,
      textColor,
      fontSize,
      expiresAt
    })

    const story = await db.story.create({
      data: {
        userId: session.user.id,
        imageUrl,
        caption,
        textOverlay,
        textPosition,
        textColor,
        fontSize,
        expiresAt
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    console.log('Story created successfully:', story.id)
    return NextResponse.json(story, { status: 201 })
  } catch (error) {
    console.error('Story creation error details:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to create story', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
