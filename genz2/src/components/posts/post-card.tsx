'use client'

import { Heart, MessageSquare, Bookmark, MoreHorizontal, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  imageUrl: string
  caption?: string
  location?: string
  likes: number
  comments: number
  createdAt: string
  isLiked?: boolean
  isBookmarked?: boolean
  latestComments?: Array<{
    id: string
    content: string
    user: {
      id: string
      username: string
      avatar?: string
    }
    createdAt: string
  }>
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(post.isLiked || false)
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [commentsCount, setCommentsCount] = useState(post.comments)

  const handleLike = async () => {
    try {
      const method = liked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await response.json()
      setLiked(data.liked)
      setLikesCount(data.likesCount)
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update on error
      setLiked(!liked)
      setLikesCount(prev => liked ? prev + 1 : prev - 1)
    }
  }

  const handleBookmark = () => {
    setBookmarked(!bookmarked)
  }



  return (
    <Card className="overflow-hidden max-w-lg mx-auto">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.user.avatar} />
            <AvatarFallback>{post.user.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <button
              className="font-semibold text-sm hover:underline text-left"
              onClick={() => router.push(`/profile/${post.user.username}`)}
            >
              {post.user.username}
            </button>
            {post.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin size={10} />
                {post.location}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal size={20} />
        </Button>
      </div>

      {/* Post Image */}
      <div className="relative aspect-square bg-muted">
        <img
          src={post.imageUrl}
          alt="Post"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Post Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleLike}
            >
              <Heart
                size={24}
                className={liked ? 'fill-red-500 text-red-500' : ''}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/posts/${post.id}`)}
            >
              <MessageSquare size={24} />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleBookmark}
          >
            <Bookmark
              size={24}
              className={bookmarked ? 'fill-current' : ''}
            />
          </Button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm mb-1">
          {likesCount.toLocaleString()} likes
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-1">{post.user.username}</span>
            <span className="break-words">{post.caption}</span>
          </p>
        )}

        {/* Latest Comment */}
        {post.latestComments && post.latestComments.length > 0 && (
          <div className="flex items-start gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.latestComments[0].user.avatar} />
              <AvatarFallback className="text-xs">
                {post.latestComments[0].user.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm flex-1">
              <span className="font-semibold mr-1">{post.latestComments[0].user.username}</span>
              <span className="break-words">{post.latestComments[0].content}</span>
            </p>
          </div>
        )}

        {/* Comments Link */}
        {commentsCount > 0 && (
          <button
            className="text-sm text-muted-foreground mt-1"
            onClick={() => router.push(`/posts/${post.id}`)}
          >
            View all {commentsCount} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2 uppercase">
          {post.createdAt}
        </p>
      </div>


    </Card>
  )
}
