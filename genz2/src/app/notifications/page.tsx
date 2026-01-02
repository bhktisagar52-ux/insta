'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Heart, User, MessageSquare, UserMinus, AtSign, Tag, Share, Bookmark, Eye, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useUnreadNotifications } from '@/hooks/use-notifications'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'reply' | 'follow' | 'follow_request' | 'follow_request_accepted' | 'follow_request_rejected' | 'unfollow' | 'mention' | 'tag' | 'share' | 'save' | 'story_like' | 'story_view' | 'story_reply' | 'reel_like' | 'reel_comment' | 'reel_reply'
  read: boolean
  createdAt: string
  actor?: {
    id: string
    username: string
    avatar?: string
  }
  post?: {
    id: string
    imageUrl: string
  }
  reel?: {
    id: string
    thumbnailUrl: string
  }
  story?: {
    id: string
    imageUrl: string
  }
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const { refetch } = useUnreadNotifications(session?.user?.id)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    markAllAsRead()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      })
      refetch()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleAcceptFollowRequest = async (actorId: string) => {
    try {
      const response = await fetch(`/api/users/follow-requests/${actorId}/accept`, {
        method: 'POST'
      })

      if (response.ok) {
        // Refresh notifications to remove the request
        fetchNotifications()
        // You might want to show a success toast here
      } else {
        const errorData = await response.json()
        console.error('Failed to accept follow request:', errorData)
      }
    } catch (error) {
      console.error('Error accepting follow request:', error)
    }
  }

  const handleRejectFollowRequest = async (actorId: string) => {
    try {
      const response = await fetch(`/api/users/follow-requests/${actorId}/reject`, {
        method: 'POST'
      })

      if (response.ok) {
        // Refresh notifications to remove the request
        fetchNotifications()
        // You might want to show a success toast here
      } else {
        const errorData = await response.json()
        console.error('Failed to reject follow request:', errorData)
      }
    } catch (error) {
      console.error('Error rejecting follow request:', error)
    }
  }



  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'reel_like':
      case 'story_like':
        return <Heart size={24} className="text-red-500 fill-red-500" />
      case 'comment':
      case 'reply':
      case 'reel_comment':
      case 'reel_reply':
      case 'story_reply':
        return <MessageSquare size={24} />
      case 'follow':
      case 'follow_request':
      case 'follow_request_accepted':
      case 'follow_request_rejected':
        return <User size={24} />
      case 'unfollow':
        return <UserMinus size={24} />
      case 'mention':
        return <AtSign size={24} />
      case 'tag':
        return <Tag size={24} />
      case 'share':
        return <Share size={24} />
      case 'save':
        return <Bookmark size={24} />
      case 'story_view':
        return <Eye size={24} />
      default:
        return null
    }
  }

  const getNotificationText = (notification: Notification) => {
    if (!notification.actor) return ''

    switch (notification.type) {
      case 'like':
        return 'liked your post'
      case 'reel_like':
        return 'liked your reel'
      case 'story_like':
        return 'liked your story'
      case 'comment':
        return 'commented on your post'
      case 'reel_comment':
        return 'commented on your reel'
      case 'reply':
        return 'replied to your comment'
      case 'reel_reply':
        return 'replied to your reel comment'
      case 'story_reply':
        return 'replied to your story'
      case 'follow':
        return 'started following you'
      case 'follow_request':
        return 'sent you a follow request'
      case 'follow_request_accepted':
        return 'accepted your follow request'
      case 'follow_request_rejected':
        return 'declined your follow request'
      case 'unfollow':
        return 'unfollowed you'
      case 'mention':
        return 'mentioned you'
      case 'tag':
        return 'tagged you'
      case 'share':
        return 'shared your post'
      case 'save':
        return 'saved your post'
      case 'story_view':
        return 'viewed your story'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <main className="lg:ml-64 min-h-screen bg-background pt-2 lg:pt-0 pb-14 lg:pb-0">
        <div className="max-w-4xl mx-auto py-4 lg:py-8 px-4">
          <h1 className="text-xl font-semibold mb-6">Notifications</h1>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="lg:ml-64 min-h-screen bg-background pt-2 lg:pt-0 pb-14 lg:pb-0">
      <div className="max-w-4xl mx-auto py-4 lg:py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="h-8 w-8"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">Notifications</h1>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors ${
                      !notification.read ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={notification.actor?.avatar} />
                      <AvatarFallback>
                        {notification.actor?.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <Link
                          href={`/profile/${notification.actor?.username}`}
                          className="font-semibold hover:underline"
                        >
                          {notification.actor?.username}
                        </Link>
                        {' '}
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true
                        })}
                      </p>
                      {notification.type === 'follow_request' && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptFollowRequest(notification.actor?.id)}
                            className="h-7 px-3 text-xs"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectFollowRequest(notification.actor?.id)}
                            className="h-7 px-3 text-xs"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                    {(notification.post || notification.reel || notification.story) && (
                      <img
                        src={notification.post?.imageUrl || notification.reel?.thumbnailUrl || notification.story?.imageUrl}
                        alt={notification.post ? "Post" : notification.reel ? "Reel" : "Story"}
                        className="h-12 w-12 object-cover rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
// check
