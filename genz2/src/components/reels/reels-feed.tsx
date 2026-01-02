'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play } from 'lucide-react'
import { VideoPlayer } from '@/components/reels/video-player'
import { ReelsCommentsModal } from '@/components/reels/reels-comments-modal'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

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

interface ReelsFeedProps {
  reels: Reel[]
  autoPlay?: boolean
  onScrollToNext?: () => void
}

export function ReelsFeed({ reels: initialReels, autoPlay = true, onScrollToNext }: ReelsFeedProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels)
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)
  const [activeReelId, setActiveReelId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { data: session } = useSession()

  // Update reels when initialReels changes
  useEffect(() => {
    setReels(initialReels)
  }, [initialReels])

  const handleLike = async (reelId: string, userId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state
        setReels(prevReels =>
          prevReels.map(reel =>
            reel.id === reelId
              ? {
                  ...reel,
                  isLiked: data.liked,
                  likes: data.liked ? reel.likes + 1 : reel.likes - 1
                }
              : reel
          )
        )
      }
    } catch (error) {
      console.error('Failed to like reel:', error)
    }
  }

  const handleComment = (reel: Reel) => {
    setSelectedReel(reel)
    setShowComments(true)
  }

  const handleFollow = async (userId: string) => {
    // TODO: Implement follow functionality
    console.log('Follow user:', userId)
  }

  const handleBookmark = async (reelId: string) => {
    // TODO: Implement bookmark functionality
    console.log('Bookmark reel:', reelId)
  }





  // Set up scroll event listeners for natural scrolling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const reelHeight = container.clientHeight
      const newIndex = Math.round(scrollTop / reelHeight)

      if (newIndex !== currentReelIndex && newIndex >= 0 && newIndex < reels.length) {
        setCurrentReelIndex(newIndex)
        setActiveReelId(reels[newIndex]?.id || null)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [currentReelIndex, reels.length])

  // Intersection Observer for autoplay management
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            const reelElement = entry.target as HTMLElement
            const reelIndex = Array.from(containerRef.current?.children || []).indexOf(reelElement)
            if (reelIndex !== -1 && reelIndex !== currentReelIndex) {
              setCurrentReelIndex(reelIndex)
              setActiveReelId(reels[reelIndex]?.id || null)
            }
          }
        })
      },
      {
        threshold: 0.7,
        rootMargin: '-10% 0px -10% 0px'
      }
    )

    if (containerRef.current) {
      const children = Array.from(containerRef.current.children)
      children.forEach((child) => {
        observer.observe(child)
      })
    }

    return () => {
      if (containerRef.current) {
        const children = Array.from(containerRef.current.children)
        children.forEach((child) => {
          observer.unobserve(child)
        })
      }
    }
  }, [currentReelIndex, reels])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  if (!reels.length) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
        <p className="text-white text-lg mb-4">No reels yet</p>
        <Link href="/reels/create">
          <Button className="bg-white text-black hover:bg-gray-200">
            Create Your First Reel
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black/50 border-b border-white/10 p-2">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Play size={16} />
            <span className="font-semibold">Reels</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <X size={20} />
            </Button>
          </Link>
        </div>
      </div>

     {/* Reels Container */}
<div
  ref={containerRef}
  className="snap-y snap-mandatory w-full h-full overflow-y-scroll scroll-smooth no-scrollbar"
  style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
>
  {reels.map((reel, index) => (
    <div
      key={reel.id}
      data-reel-id={reel.id}
      className="w-full h-full snap-start flex-shrink-0 bg-black relative"
    >
      <VideoPlayer
        src={reel.videoUrl}
        thumbnail={reel.thumbnailUrl}
        username={reel.username}
        avatar={reel.avatar}
        caption={reel.caption}
        musicName={reel.musicName}
        likes={reel.likes}
        comments={reel.comments}
        shares={reel.shares}
        isFollowing={reel.isFollowing}
        isBookmarked={reel.isBookmarked}
        isLiked={reel.isLiked}
        autoPlay={index === currentReelIndex}
        loop={false}
        muted={false}
        onLike={() => handleLike(reel.id, reel.userId)}
        onComment={() => handleComment(reel)}
        onShare={() => {}}
        onFollow={() => handleFollow(reel.userId)}
        onBookmark={() => handleBookmark(reel.id)}

      />
    </div>
  ))}
</div>


      {/* Comments Modal */}
      {showComments && selectedReel && (
        <ReelsCommentsModal
          reel={selectedReel}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          onCommentCountUpdate={(count) => {
            setReels(prevReels =>
              prevReels.map(reel =>
                reel.id === selectedReel.id
                  ? { ...reel, comments: count }
                  : reel
              )
            )
          }}
        />
      )}
    </div>
  )
}
