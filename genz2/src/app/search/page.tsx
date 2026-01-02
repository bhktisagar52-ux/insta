'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface SearchResult {
  id: string
  username: string
  name?: string
  avatar?: string
  _count?: {
    posts: number
    followers: number
  }
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query)
      } else {
        setUsers([])
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const searchUsers = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setUsers([])
  }

  return (
    <>
      <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search users or hashtags"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 pr-12 h-14 text-lg"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={clearSearch}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {query ? (
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-muted-foreground">Searching...</p>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No results found for "{query}"
                </p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xl">
                          {user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{user.username}</p>
                        {user.name && (
                          <p className="text-sm text-muted-foreground">{user.name}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Recent Searches or Suggestions
            <div>
              <h2 className="text-lg font-semibold mb-4">Discover</h2>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
// check
