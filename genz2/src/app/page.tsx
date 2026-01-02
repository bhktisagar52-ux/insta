'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileHeader, MobileNav } from '@/components/layout/mobile-nav'
import { PostCard } from '@/components/posts/post-card'
import { ReelCard } from '@/components/reels/reel-card'
import { Stories } from '@/components/stories/stories'

// Types for posts and stories
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

interface Story {
  id: string
  userId: string
  username: string
  avatar?: string
  hasStory: boolean
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchFeed()
      fetchStories()
    }
  }, [session])

  const fetchFeed = async () => {
    try {
      // Fetch posts
      const postsResponse = await fetch('/api/posts')
      const postsData = postsResponse.ok ? await postsResponse.json() : []

      // Fetch reels
      const reelsResponse = await fetch('/api/reels')
      const reelsData = reelsResponse.ok ? await reelsResponse.json() : []

      // Transform posts
      const transformedPosts: FeedItem[] = postsData.map((post: any) => ({
        type: 'post' as const,
        id: post.id,
        user: {
          id: post.user.id,
          username: post.user.username,
          avatar: post.user.avatar,
        },
        imageUrl: post.imageUrl,
        caption: post.caption,
        location: post.location,
        likes: post._count.likes,
        comments: post._count.comments,
        createdAt: new Date(post.createdAt).toISOString(),
        isLiked: post.likes && post.likes.length > 0,
        isBookmarked: false,
        latestComments: post.comments?.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          user: {
            id: comment.user.id,
            username: comment.user.username,
            avatar: comment.user.avatar,
          },
          createdAt: new Date(comment.createdAt).toLocaleDateString(),
        })) || [],
      }))

      // Transform reels
      const transformedReels: FeedItem[] = reelsData.map((reel: any) => ({
        type: 'reel' as const,
        id: reel.id,
        userId: reel.user.id,
        username: reel.user.username,
        avatar: reel.user.avatar,
        videoUrl: reel.videoUrl,
        thumbnailUrl: reel.thumbnailUrl,
        caption: reel.caption,
        musicName: reel.musicName,
        likes: reel._count.likes,
        comments: reel._count.comments,
        shares: reel._count.shares || 0,
        isFollowing: reel.isFollowing,
        isBookmarked: reel.isBookmarked,
        isLiked: reel.isLiked,
        createdAt: new Date(reel.publishedAt || reel.createdAt).toISOString(),
      }))

      // Combine and sort by createdAt (newest first - descending order)
      const combinedFeed = [...transformedPosts, ...transformedReels]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setFeedItems(combinedFeed)
    } catch (error) {
      console.error('Failed to fetch feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories')
      if (response.ok) {
        const data = await response.json()
        setStories(data)
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    }
  }

  const handleStoryCreated = () => {
    fetchStories() // Refresh the stories list when a new story is created
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  const username = session.user?.username || 'user'
  const avatar = session.user?.image

  return (
    <>
      <Sidebar username={username} avatar={avatar} />

      <MobileHeader username={username} avatar={avatar} />

      <main className="lg:ml-64 pt-14 lg:pt-0 pb-14 lg:pb-0 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto py-4 lg:py-8 px-4">
          <Stories stories={stories} onStoryCreated={handleStoryCreated} />

          <div className="space-y-4">
            {feedItems.length > 0 ? (
              feedItems.map((item) => {
                if (item.type === 'post') {
                  return <PostCard key={item.id} post={item as Post} />
                } else {
                  return <ReelCard key={item.id} reel={item as Reel} />
                }
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No posts or reels yet. Create your first post or reel!
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </>
  )
}

// clean config
// reels added
// reels database synced
