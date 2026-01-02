import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/messages/conversations - Get user's conversations
export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all users (excluding current user) for starting new conversations
    const allUsers = await db.user.findMany({
      where: {
        id: {
          not: session.user.id
        }
      },
      select: {
        id: true,
        username: true,
        avatar: true
      },
      take: 50 // Limit to prevent performance issues
    })

    const userIds = new Set(allUsers.map(user => user.id))

    // Create conversations with last message info
    const conversations = await Promise.all(
      Array.from(userIds).map(async (userId) => {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            avatar: true
          }
        })

        if (!user) {
          console.log(`Debug - User ${userId} not found`)
          return null
        }

        console.log(`Debug - Processing user ${user.username} (${userId})`)

        // Get last message (if any)
        const lastMessage = await db.message.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: userId },
              { senderId: userId, receiverId: session.user.id }
            ]
          },
          orderBy: { createdAt: 'desc' }
        })

        // Count unread
        const unreadCount = await db.message.count({
          where: {
            senderId: userId,
            receiverId: session.user.id,
            read: false
          }
        })

        const conversation = {
          id: userId,
          user,
          lastMessage,
          unreadCount
        }

        console.log(`Debug - Created conversation for ${user.username}:`, {
          hasLastMessage: !!lastMessage,
          unreadCount
        })

        return conversation
      })
    )

    // Filter nulls and sort by last message time (conversations with messages first)
    const validConversations = conversations
      .filter(c => c !== null)
      .sort((a, b) => {
        const aTime = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
        const bTime = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
        return bTime - aTime
      })

    console.log(`Debug - Final conversations count: ${validConversations.length}`)

    return NextResponse.json(validConversations)
  } catch (error) {
    console.error('Conversations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
