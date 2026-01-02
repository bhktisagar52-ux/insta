'use client'

import { useState, useEffect } from 'react'
import { ReelsFeed } from '@/components/reels/reels-feed'
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

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    fetchReels()
  }, [])

  const fetchReels = async () => {
    try {
      const response = await fetch('/api/reels')
      if (response.ok) {
        const data = await response.json()

        // Transform API data to match component interface
        const transformedReels: Reel[] = data.map((reel: any) => ({
          id: reel.id,
          userId: reel.userId,
          username: reel.user.username,
          avatar: reel.user.avatar,
          videoUrl: reel.videoUrl,
          thumbnailUrl: reel.thumbnailUrl,
          caption: reel.caption,
          musicName: reel.musicName,
          likes: reel._count.likes,
          comments: reel._count.comments,
          shares: 0, // Shares not implemented yet
          isFollowing: reel.isFollowing || false,
          isBookmarked: reel.isBookmarked || false,
          isLiked: reel.isLiked || false
        }))

        setReels(transformedReels)
      }
    } catch (error) {
      console.error('Failed to fetch reels:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <p className="text-white text-lg">Loading reels...</p>
      </div>
    )
  }

  return <ReelsFeed reels={reels} />
}
