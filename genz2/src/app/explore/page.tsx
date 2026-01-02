'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart } from 'lucide-react'
import Link from 'next/link'

interface ExplorePost {
  id: string
  imageUrl: string
  likes: number
  comments: number
  user: {
    id: string
    username: string
    avatar?: string
  }
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<ExplorePost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExplorePosts()
  }, [])

  const fetchExplorePosts = async () => {
    try {
      const response = await fetch('/api/posts?explore=true')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Failed to fetch explore posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-xl font-semibold mb-6">Explore</h1>

        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No posts to explore yet
            </p>
            <Link href="/create">
              <Button>Share your first photo</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/p/${post.id}`}
                className="group relative aspect-square bg-muted"
              >
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white transition-opacity">
                  <div className="flex items-center gap-2">
                    <Heart size={20} fill="white" />
                    <span className="font-semibold">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart size={20} fill="none" />
                    <span className="font-semibold">{post.comments}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
// check
