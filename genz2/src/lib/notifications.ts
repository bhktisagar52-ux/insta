import { db } from '@/lib/db'

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'unfollow' | 'mention' | 'tag' | 'share' | 'save' | 'story_like' | 'story_view' | 'story_reply' | 'reel_like' | 'reel_comment' | 'reel_reply'

export interface CreateNotificationData {
  userId: string // The user who will receive the notification
  actorId: string // The user who performed the action
  type: NotificationType
  postId?: string
  reelId?: string
  storyId?: string
  commentId?: string
}

export async function createNotification(data: CreateNotificationData) {
  try {
    // Don't create notification if user is notifying themselves
    if (data.userId === data.actorId) {
      return null
    }

    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId,
        reelId: data.reelId,
        storyId: data.storyId,
        commentId: data.commentId
      }
    })

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const count = await db.notification.count({
      where: {
        userId,
        read: false
      }
    })
    return count
  } catch (error) {
    console.error('Failed to get unread notification count:', error)
    return 0
  }
}
