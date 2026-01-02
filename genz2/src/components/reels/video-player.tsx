'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface VideoPlayerProps {
  src: string
  thumbnail?: string
  username?: string
  avatar?: string
  caption?: string
  musicName?: string
  likes?: number
  comments?: number
  shares?: number
  isFollowing?: boolean
  isBookmarked?: boolean
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  onFollow?: () => void
  onBookmark?: () => void
  onScrollToNext?: () => void
  isLiked?: boolean
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  externalMuted?: boolean // External control for muting
}

export function VideoPlayer({
  src,
  thumbnail,
  username,
  avatar,
  caption,
  musicName,
  likes = 0,
  comments = 0,
  shares = 0,
  isFollowing = false,
  isBookmarked = false,
  onLike,
  onComment,
  onShare,
  onFollow,
  onBookmark,
  onScrollToNext,
  isLiked = false,
  autoPlay = true,
  loop = true,
  muted = false,
  externalMuted
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolume, setShowVolume] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Effective muted state - external control takes precedence
  const effectiveMuted = externalMuted !== undefined ? externalMuted : isMuted

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current?.currentTime || 0)
    updateProgressBar()
  }

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current?.duration || 0)
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (!loop) {
      // Auto-advance to next reel when current one ends
      onScrollToNext?.()
    }
  }

  // Auto-play when component becomes active
  useEffect(() => {
    if (autoPlay && videoRef.current && !isPlaying) {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch((error) => {
            // Auto-play was prevented, user interaction required
            console.log('Auto-play prevented:', error)
          })
      }
    } else if (!autoPlay && videoRef.current && isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [autoPlay, isPlaying])

  const updateProgressBar = () => {
    if (progressRef.current && videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100
      progressRef.current.style.width = `${percent}%`
    }
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const toggleMute = () => {
    // Don't allow manual mute toggle when external control is active
    if (externalMuted !== undefined) return

    if (!videoRef.current) return
    const newMuted = !isMuted
    setIsMuted(newMuted)
    videoRef.current.muted = newMuted
    if (newMuted) {
      setVolume(0)
    } else {
      videoRef.current.muted = false
      videoRef.current.volume = 1
      setVolume(1)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      videoRef.current.muted = false
      setIsMuted(false)
    }
  }

  const handleProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = progressRef.current?.getBoundingClientRect()
    const clickX = e.clientX - (rect?.left || 0)
    const newTime = (clickX / (rect?.width || 1)) * (videoRef.current.duration || 0)
    videoRef.current.currentTime = newTime
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        muted={effectiveMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onClick={togglePlay}
      />

      {/* Play/Pause Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="text-white" size={24} />
            ) : (
              <Play className="text-white" size={24} />
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/30">
        <div
          ref={progressRef}
          className="h-full bg-white transition-all duration-100"
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
      </div>

      {/* Right Side Action Buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
            onClick={onLike}
          >
            <Heart className={`w-7 h-7 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <span className="text-white text-xs font-medium">{likes > 0 ? likes.toLocaleString() : ''}</span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
            onClick={onComment}
          >
            <MessageCircle className="w-7 h-7" />
          </Button>
          <span className="text-white text-xs font-medium">{comments > 0 ? comments.toLocaleString() : ''}</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
            onClick={onShare}
          >
            <Send className="w-7 h-7" />
          </Button>
          <span className="text-white text-xs font-medium">{shares > 0 ? shares.toLocaleString() : ''}</span>
        </div>

        {/* Bookmark Button */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
          onClick={onBookmark}
        >
          <Bookmark className={`w-7 h-7 ${isBookmarked ? "fill-white" : ""}`} />
        </Button>

        {/* More Options */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
        >
          <MoreHorizontal className="w-7 h-7" />
        </Button>

        {/* Music Disc */}
        {musicName && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center animate-spin">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
            </div>
            <div className="text-center">
              <p className="text-white text-xs font-medium truncate max-w-20">{musicName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
        <div className="flex items-end gap-3">
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-8 h-8 border border-white/20">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-xs bg-white/20 text-white">
                  {username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-semibold text-sm">{username}</span>
              {!isFollowing && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-3 text-xs font-medium bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={onFollow}
                >
                  Follow
                </Button>
              )}
            </div>

            {/* Caption */}
            {caption && (
              <p className="text-white text-sm leading-relaxed mb-2 line-clamp-2">
                {caption}
              </p>
            )}

            {/* Music Name */}
            {musicName && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                <span className="text-white/80 text-xs font-medium">{musicName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Volume Control */}
      <div className="absolute bottom-4 right-20">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-white hover:bg-black/20"
            onClick={toggleMute}
            disabled={externalMuted !== undefined}
          >
            {effectiveMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
