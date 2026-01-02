'use client'

import { Heart, MessageSquare, Bookmark, MoreHorizontal, Play, Volume2, VolumeX } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ReelsCommentsModal } from '@/components/reels/reels-comments-modal'

interface Reel {
  id: string
  userId: string
  username: string
  avatar?: string
  videoUrl: string
  thumbnailUrl: string
  caption?: string
  musicName?: string
  likes: number
  comments: number
  shares: number
  isFollowing?: boolean
  isBookmarked?: boolean
  isLiked: boolean
}

interface ReelCardProps {
  reel: Reel
}

export function ReelCard({ reel }: ReelCardProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(reel.isLiked)
  const [bookmarked, setBookmarked] = useState(reel.isBookmarked || false)
  const [likesCount, setLikesCount] = useState(reel.likes)
  const [commentsCount, setCommentsCount] = useState(reel.comments)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/reels/${reel.id}/like`, {
        method: 'POST',
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

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleCommentClick = () => {
    setShowCommentsModal(true)
  }

  const handleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      videoRef.current.muted = newMuted
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)

      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)

      return () => {
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
      }
    }
  }, [])

  // Intersection Observer for auto-play when 60% visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setIsVisible(true)
            if (videoRef.current && !isPlaying) {
              videoRef.current.play().catch(() => {
                // Auto-play failed, user interaction required
              })
            }
          } else {
            setIsVisible(false)
            if (videoRef.current && isPlaying) {
              videoRef.current.pause()
            }
          }
        })
      },
      { threshold: 0.6 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [isPlaying])

  return (
    <Card ref={cardRef} className="overflow-hidden max-w-lg mx-auto">
      {/* Reel Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={reel.avatar} />
            <AvatarFallback>{reel.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <button
              className="font-semibold text-sm hover:underline text-left"
              onClick={() => router.push(`/profile/${reel.username}`)}
            >
              {reel.username}
            </button>
            {reel.musicName && (
              <p className="text-xs text-muted-foreground">
                {reel.musicName}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal size={20} />
        </Button>
      </div>

      {/* Reel Video */}
      <div className="relative aspect-[9/16] bg-muted max-h-96 overflow-hidden">
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.thumbnailUrl}
          className="w-full h-full object-cover cursor-pointer"
          onClick={handleVideoClick}
          loop
          playsInline
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70"
              onClick={handleVideoClick}
            >
              <Play size={32} className="text-white ml-1" />
            </Button>
          </div>
        )}
        {/* Reel indicator */}
        <div className="absolute top-2 left-2 bg-black/50 rounded px-2 py-1">
          <span className="text-white text-xs font-semibold">Reel</span>
        </div>

        {/* Mute Button */}
        <div className="absolute bottom-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-white hover:bg-black/20"
            onClick={handleMute}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
        </div>
      </div>

      {/* Reel Actions */}
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
              onClick={handleCommentClick}
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
        {reel.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-1">{reel.username}</span>
            <span className="break-words">{reel.caption}</span>
          </p>
        )}

        {/* Comments Link */}
        {commentsCount > 0 && (
          <button
            className="text-sm text-muted-foreground mt-1"
            onClick={handleCommentClick}
          >
            View all {commentsCount} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2 uppercase">
          2h ago
        </p>
      </div>

      {/* Comments Modal */}
      <ReelsCommentsModal
        reel={reel}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        onCommentCountUpdate={(count) => setCommentsCount(count)}
      />
    </Card>
  )
}
