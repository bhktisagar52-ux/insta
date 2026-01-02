import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { userId: string; storyId: string } }
) {
  try {
    console.log('Story view API called for:', params)
    const session = await getSession()
    if (!session?.user?.id) {
      console.log('No session user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, storyId } = params
    let reaction = null
    try {
      const body = await request.json()
      reaction = body.reaction || null
    } catch (e) {
      // Body might be empty, that's okay
      console.log('No body provided, using default reaction')
    }
    console.log('Recording view for user:', session.user.id, 'story:', storyId)

    // Check if view already exists
    const existingView = await db.storyView.findFirst({
      where: {
        storyId,
        userId: session.user.id
      }
    })

    if (!existingView) {
      // Create new view
      await db.storyView.create({
        data: {
          storyId,
          userId: session.user.id,
          reaction: reaction || null
        }
      })
    } else if (reaction && existingView.reaction !== reaction) {
      // Update reaction if different
      await db.storyView.update({
        where: { id: existingView.id },
        data: { reaction }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Story view record error:', error)
    return NextResponse.json(
      { error: 'Failed to record story view' },
      { status: 500 }
    )
  }
}
