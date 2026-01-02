'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, Send, MoreHorizontal, Pause, Play, Eye, Laugh, Angry, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'
import { StoryViewers } from '@/components/stories/story-viewers'

interface Story {
  id: string
  imageUrl: string
  caption?: string
  textOverlay?: string
  textPosition?: { x: number; y: number }
  textColor?: string
  fontSize?: number
  createdAt: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  views: number
  likes: number
  replies: number
}

interface StoryViewerProps {
  stories: Story[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

function StoryViewer({ stories, currentIndex, onClose, onNext, onPrevious, userId }: StoryViewerProps & { userId: string }) {
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [reply, setReply] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [currentReaction, setCurrentReaction] = useState<string | null>(null)
  const [replySent, setReplySent] = useState(false)
  const { data: session } = useSession()

  const isOwner = session?.user?.id === userId

  const currentStory = stories[currentIndex]

  useEffect(() => {
    if (!isPaused && currentStory) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            // Use setTimeout to avoid calling state updates during render
            setTimeout(() => {
              if (currentIndex < stories.length - 1) {
                onNext()
              } else {
                onClose()
              }
            }, 0)
            return 0
          }
          return prev + 1 // Slower progress for better UX
        })
      }, 50)

      return () => clearInterval(interval)
    }
  }, [isPaused, currentIndex, stories.length, onNext, onClose])

  useEffect(() => {
    setProgress(0)
    checkLikeStatus() // Check like status for current story
    recordView(currentReaction) // Record view for current story with current reaction
  }, [currentIndex])

  // Pause story when viewers modal is open
  useEffect(() => {
    setIsPaused(showViewers)
  }, [showViewers])

  const recordView = async (reaction?: string | null) => {
    console.log('recordView called for story:', currentStory?.id, 'user:', session?.user?.id, 'owner:', userId, 'reaction:', reaction)
    if (!session?.user?.id) {
      console.log('Skipping view recording - user not logged in')
      return
    }

    // Allow owners to record their own views for testing purposes
    try {
      console.log('Making API call to record view')
      const response = await fetch(`/api/stories/${userId}/${currentStory.id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reaction: reaction || null
        })
      })
      console.log('View recording API response status:', response.status)
      if (!response.ok) {
        console.error('View recording API failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to record view:', error)
    }
  }

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/stories/${userId}/${stories[currentIndex]?.id}/like`)
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
      }
    } catch (error) {
      console.error('Failed to check like status:', error)
    }
  }

  const handleSendReply = async () => {
    if (!reply.trim()) return

    try {
      const response = await fetch(`/api/stories/${userId}/${currentStory.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reply.trim()
        })
      })

      if (response.ok) {
        setReplySent(true)
        setReply('')
        setShowReply(false)
        // Reset the sent indicator after 2 seconds
        setTimeout(() => {
          setReplySent(false)
        }, 2000)
      } else {
        console.error('Failed to send reply:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
    }
  }

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/stories/${userId}/${currentStory.id}/like`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
      }
    } catch (error) {
      console.error('Failed to like story:', error)
    }
  }

  const handleReaction = async (reaction: string) => {
    const newReaction = currentReaction === reaction ? null : reaction
    setCurrentReaction(newReaction)
    setShowReactions(false)
    await recordView(newReaction)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  if (!currentStory) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        onClick={onClose}
      >
        <X size={24} />
      </Button>

      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-16 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Pause/Play button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-16 right-4 text-white hover:bg-white/20 z-10"
        onClick={togglePause}
      >
        {isPaused ? <Play size={20} /> : <Pause size={20} />}
      </Button>

      {/* Story content */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={currentStory.imageUrl}
          alt="Story"
          className="max-w-full max-h-full object-contain"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        />

        {/* Text overlay */}
        {currentStory.textOverlay && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${currentStory.textPosition?.x || 50}%`,
              top: `${currentStory.textPosition?.y || 50}%`,
              transform: 'translate(-50%, -50%)',
              color: currentStory.textColor || '#ffffff',
              fontSize: `${currentStory.fontSize || 24}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              textAlign: 'center',
              maxWidth: '80%',
              wordWrap: 'break-word',
            }}
          >
            {currentStory.textOverlay}
          </div>
        )}

        {/* Navigation areas */}
        <div
          className="absolute left-0 top-0 w-1/2 h-full cursor-pointer"
          onClick={onPrevious}
        />
        <div
          className="absolute right-0 top-0 w-1/2 h-full cursor-pointer"
          onClick={onNext}
        />

        {/* User info */}
        <div className="absolute top-16 left-4 flex items-center gap-3 z-10">
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarImage src={currentStory.user.avatar} />
            <AvatarFallback className="text-xs">
              {currentStory.user.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-semibold text-sm">{currentStory.user.username}</p>
            <p className="text-xs opacity-80">
              {new Date(currentStory.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>



        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4 z-10">
            <p className="text-white text-sm bg-black/50 px-3 py-2 rounded-lg">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Reaction buttons */}
        {showReactions && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex gap-2 bg-black/70 rounded-full p-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleReaction('heart')}
              >
                <Heart size={20} className={currentReaction === 'heart' ? 'fill-red-500 text-red-500' : ''} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleReaction('laugh')}
              >
                <Laugh size={20} className={currentReaction === 'laugh' ? 'text-yellow-400' : ''} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleReaction('thumbsup')}
              >
                <ThumbsUp size={20} className={currentReaction === 'thumbsup' ? 'text-blue-400' : ''} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleReaction('angry')}
              >
                <Angry size={20} className={currentReaction === 'angry' ? 'text-red-600' : ''} />
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          {showReply ? (
            <div className="flex gap-2">
              <Avatar className="h-8 w-8 border-2 border-white flex-shrink-0">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="text-xs bg-white text-black">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder="Reply to story..."
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value)
                  if (replySent) setReplySent(false)
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 bg-black/50 border-white/30 text-white placeholder:text-white/70"
                autoFocus
              />
              <Button
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                onClick={handleSendReply}
                disabled={!reply.trim() || replySent}
              >
                {replySent ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Sent</span>
                  </div>
                ) : (
                  <Send size={16} />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 flex-shrink-0"
                onClick={() => setShowReply(false)}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <Input
                placeholder="Send message"
                className="flex-1 bg-black/50 border-white/30 text-white placeholder:text-white/70"
                onFocus={() => setShowReply(true)}
                readOnly
              />
              <div className="flex gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowReply(true)}
                >
                  <MessageCircle size={24} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowReactions(!showReactions)}
                >
                  <Laugh size={24} className={currentReaction ? 'text-yellow-400' : ''} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => alert('Share functionality coming soon!')}
                >
                  <Send size={24} />
                </Button>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setShowViewers(true)}
                  >
                    <Eye size={24} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <MoreHorizontal size={24} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewers Modal */}
      {isOwner && (
        <StoryViewers
          userId={userId}
          storyId={currentStory.id}
          storyImage={currentStory.imageUrl}
          isOpen={showViewers}
          onClose={() => setShowViewers(false)}
        />
      )}
    </div>
  )
}

export default function StoryPage() {
  const params = useParams()
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const userId = params.userId as string

  const fetchUserStories = useCallback(async () => {
    try {
      const response = await fetch(`/api/stories/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setStories(data)
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchUserStories()
    }
  }, [userId, fetchUserStories])

  const handleClose = useCallback(() => {
    router.back()
  }, [router])

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, stories.length])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  if (loading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading...</div>
  }

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="mb-4">No stories available</p>
          <Button onClick={handleClose}>Close</Button>
        </div>
      </div>
    )
  }

  return (
    <StoryViewer
      stories={stories}
      currentIndex={currentIndex}
      onClose={handleClose}
      onNext={handleNext}
      onPrevious={handlePrevious}
      userId={userId}
    />
  )
}
