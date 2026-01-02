'use client'

import { useState, useEffect } from 'react'
import { Eye, Heart, Laugh, Angry, ThumbsUp, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Viewer {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  viewedAt: string
  reaction?: string
}

interface StoryViewersProps {
  userId: string
  storyId?: string
  storyImage: string
  isOpen: boolean
  onClose: () => void
}

const reactionIcons = {
  heart: Heart,
  laugh: Laugh,
  angry: Angry,
  thumbsup: ThumbsUp,
}

const reactionEmojis = {
  heart: '❤️',
  laugh: '😂',
  angry: '😡',
  thumbsup: '👍',
}

export function StoryViewers({ userId, storyId, storyImage, isOpen, onClose }: StoryViewersProps) {
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchViewers()
    }
  }, [isOpen, userId, storyId])

  const fetchViewers = async () => {
    try {
      const url = storyId
        ? `/api/stories/${userId}/viewers?storyId=${storyId}`
        : `/api/stories/${userId}/viewers`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (storyId) {
          // Direct array of viewers for specific story
          setViewers(data)
        } else {
          // Grouped by story - flatten all viewers
          const allViewers = data.flatMap((storyData: any) => storyData.viewers)
          setViewers(allViewers)
        }
      }
    } catch (error) {
      console.error('Failed to fetch viewers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReactionEmoji = (reaction?: string) => {
    if (!reaction) return ''
    return reactionEmojis[reaction as keyof typeof reactionEmojis] || ''
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye size={20} />
            Story Viewers
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Story Preview */}
          <div className="flex justify-center">
            <img
              src={storyImage}
              alt="Story"
              className="w-24 h-24 object-cover rounded-lg border"
            />
          </div>

          {/* Viewers List */}
          {loading ? (
            <div className="text-center py-4">Loading viewers...</div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No one has viewed this story yet
            </div>
          ) : (
            <div className="space-y-3">
              {viewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={viewer.user.avatar} />
                    <AvatarFallback>
                      {viewer.user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {viewer.user.username} {getReactionEmoji(viewer.reaction)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(viewer.viewedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
