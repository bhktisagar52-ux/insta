'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Link as LinkIcon, Settings, MessageCircle, LogOut, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PostCard } from '@/components/posts/post-card'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

interface Profile {
  id: string
  username: string
  name?: string
  bio?: string
  avatar?: string
  website?: string
  _count: {
    posts: number
    followers: number
    following: number
  }
  isFollowing?: boolean
  isMutualFollower?: boolean
}

export default function ProfilePage() {
  const params = useParams()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [reels, setReels] = useState<any[]>([])
  const [savedPosts, setSavedPosts] = useState<any[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    website: ''
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [followStatus, setFollowStatus] = useState<{
    isFollowing: boolean
    isPending: boolean
    isMutualFollower: boolean
  }>({
    isFollowing: false,
    isPending: false,
    isMutualFollower: false
  })

  const username = params.username as string
  const isOwnProfile = session?.user?.username === username

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [username, session])

  useEffect(() => {
    if (profile?.id) {
      fetchPosts()
      fetchReels()
      if (isOwnProfile) {
        fetchSavedPosts()
      }
    }
  }, [profile?.id, isOwnProfile])

  useEffect(() => {
    setTotalPosts(posts.length + reels.length)
  }, [posts, reels])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`)
      if (response.ok) {
        const data = await response.json()

        // Check if current user is following this profile and if they are mutual followers
        let followStatus = { isFollowing: false, isPending: false, isMutualFollower: false }
        if (session?.user?.id && !isOwnProfile) {
          try {
            const followCheckResponse = await fetch(`/api/users/${username}/follow`)
            if (followCheckResponse.ok) {
              const followData = await followCheckResponse.json()
              followStatus = {
                isFollowing: followData.isFollowing,
                isPending: followData.isPending,
                isMutualFollower: false
              }

              // Check if this is a mutual follow (both users follow each other)
              if (followStatus.isFollowing) {
                // Check if the profile user follows back the current user
                const mutualCheckResponse = await fetch(`/api/users/${session.user.username}/follow?checkUser=${data.id}`)
                if (mutualCheckResponse.ok) {
                  const mutualData = await mutualCheckResponse.json()
                  followStatus.isMutualFollower = mutualData.isFollowingBack || false
                }
              }
            }
          } catch (error) {
            console.error('Failed to check follow status:', error)
          }
        }

        setFollowStatus(followStatus)
        setProfile({ ...data, ...followStatus })
        // Populate edit form with current profile data
        setEditForm({
          name: data.name || '',
          bio: data.bio || '',
          website: data.website || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    if (!profile?.id) return

    try {
      const response = await fetch(`/api/posts?userId=${profile.id}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    }
  }

  const fetchReels = async () => {
    if (!profile?.id) return

    try {
      const response = await fetch(`/api/reels?userId=${profile.id}`)
      if (response.ok) {
        const data = await response.json()

        // Fetch view counts for each reel
        const reelsWithViews = await Promise.all(
          data.map(async (reel: any) => {
            try {
              const viewResponse = await fetch(`/api/reels/${reel.id}/view`)
              if (viewResponse.ok) {
                const viewData = await viewResponse.json()
                return { ...reel, viewCount: viewData.viewCount }
              }
            } catch (error) {
              console.error(`Failed to fetch views for reel ${reel.id}:`, error)
            }
            return { ...reel, viewCount: 0 }
          })
        )

        setReels(reelsWithViews)
      }
    } catch (error) {
      console.error('Failed to fetch reels:', error)
    }
  }

  const fetchSavedPosts = async () => {
    try {
      const response = await fetch('/api/bookmarks')
      if (response.ok) {
        const data = await response.json()
        setSavedPosts(data)
      }
    } catch (error) {
      console.error('Failed to fetch saved posts:', error)
    }
  }

  const handleFollow = async () => {
    try {
      const isCurrentlyFollowing = profile?.isFollowing
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST'

      const response = await fetch(`/api/users/${username}/follow`, {
        method
      })

      if (response.ok) {
        // Update local state immediately for better UX
        const newIsFollowing = !isCurrentlyFollowing
        setProfile(prev => prev ? { ...prev, isFollowing: newIsFollowing, isMutualFollower: false } : null) // Reset mutual follower status
        // Then refetch to get updated counts and recheck mutual follower status
        const response2 = await fetch(`/api/users/${username}`)
        if (response2.ok) {
          const data = await response2.json()

          // Recheck mutual follower status after the follow/unfollow action
          let newIsMutualFollower = false
          if (newIsFollowing && session?.user?.username) {
            try {
              const mutualCheckResponse = await fetch(`/api/users/${session.user.username}/follow?checkUser=${data.id}`)
              if (mutualCheckResponse.ok) {
                const mutualData = await mutualCheckResponse.json()
                newIsMutualFollower = mutualData.isFollowingBack || false
              }
            } catch (error) {
              console.error('Failed to recheck mutual follower status:', error)
            }
          }

          setProfile(prev => prev ? { ...prev, ...data, isFollowing: newIsFollowing, isMutualFollower: newIsMutualFollower } : null)
        }
        toast({
          title: isCurrentlyFollowing ? "Unfollowed" : "Followed",
          description: isCurrentlyFollowing
            ? `You unfollowed ${username}`
            : `You are now following ${username}`
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update follow status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      })
    }
  }

  const handleCancelEdit = () => {
    // Reset form to current profile data
    if (profile) {
      setEditForm({
        name: profile.name || '',
        bio: profile.bio || '',
        website: profile.website || ''
      })
    }
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setImagePreview(data.url)
      toast({
        title: "Image uploaded!",
        description: "Your profile picture has been uploaded successfully"
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      })
      setSelectedImage(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updateData = {
        ...editForm,
        avatar: imagePreview || profile?.avatar
      }

      const response = await fetch(`/api/users/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        console.log('Updated profile:', updatedProfile)
        setProfile(updatedProfile)
        setImagePreview(null) // Clear preview after successful save
        toast({
          title: "Profile updated!",
          description: "Your profile has been updated successfully"
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      })
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${username}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Account deleted",
          description: "Your account has been deleted successfully"
        })
        await signOut()
        router.push('/login')
      } else {
        const errorData = await response.json()
        toast({
          title: "Delete failed",
          description: errorData.error || "Failed to delete account",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center gap-12 mb-8">
            <div className="h-32 w-32 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="flex gap-8">
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="lg:ml-64 min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </main>
    )
  }

  return (
    <>
      {/* Mobile Header with Settings */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Button variant="ghost" size="icon">
            ←
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {isOwnProfile ? (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings size={20} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                      Manage your account settings and preferences.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Link href="/settings" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full justify-start"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      className="w-full justify-start"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : null}
        </div>
      </div>

      <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Avatar */}
            <div className="flex justify-center md:justify-start">
              {isOwnProfile ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-2 border-gray-300 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={profile.avatar} key={profile.avatar} />
                      <AvatarFallback className="text-4xl">
                        {profile.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit profile</DialogTitle>
                      <DialogDescription>
                        Make changes to your profile here. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={imagePreview || profile?.avatar} />
                          <AvatarFallback className="text-2xl">
                            {profile?.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-center gap-2">
                          <Label htmlFor="avatar">Profile Picture</Label>
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="w-fit"
                            disabled={isUploading}
                          />
                          {isUploading && (
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bio" className="text-right">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          className="col-span-3"
                          placeholder="Tell us about yourself"
                          rows={3}
                          maxLength={150}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="website" className="text-right">
                          Website
                        </Label>
                        <Input
                          id="website"
                          value={editForm.website}
                          onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                          className="col-span-3"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        Save changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-2 border-gray-300">
                  <AvatarImage src={profile.avatar} key={profile.avatar} />
                  <AvatarFallback className="text-4xl">
                    {profile.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 md:flex md:items-start md:gap-8">
              {/* Username and Actions */}
              <div className="flex flex-col items-center sm:items-start gap-4 mb-4 md:mb-0 md:flex-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl md:text-3xl font-light text-center sm:text-left">
                    {profile.username}
                  </h1>
                  {isOwnProfile && (
                    <Link href="/settings">
                      <Button variant="ghost" size="icon" className="hidden md:flex">
                        <Settings size={20} />
                      </Button>
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isOwnProfile && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleFollow}
                        className="px-6 py-1.5 text-sm font-medium"
                        variant={followStatus.isFollowing ? "outline" : followStatus.isPending ? "secondary" : "default"}
                        disabled={followStatus.isPending}
                      >
                        {followStatus.isFollowing ? "Following" : followStatus.isPending ? "Requested" : "Follow"}
                      </Button>
                      {profile?.isMutualFollower && (
                        <Link href="/messages">
                          <Button variant="outline" className="px-4 py-1.5">
                            Message
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio Section - Right below username */}
                <div className="text-center md:text-left max-w-md">
                  {profile.bio && (
                    <p className="text-sm mb-2 whitespace-pre-line">{profile.bio}</p>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Stats - Positioned after profile pic and username on desktop */}
              <div className="flex justify-center md:justify-start gap-8 mb-6 md:mb-0 md:flex-col md:items-start md:gap-0">
                <div className="text-center md:text-left">
                  <p className="font-semibold text-lg">{totalPosts}</p>
                  <p className="text-muted-foreground text-sm">posts</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="font-semibold text-lg">{profile._count.followers}</p>
                  <p className="text-muted-foreground text-sm">followers</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="font-semibold text-lg">{profile._count.following}</p>
                  <p className="text-muted-foreground text-sm">following</p>
                </div>
              </div>
            </div>
          </div>



          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full justify-center md:justify-start border-t border-gray-200 bg-transparent h-auto p-0">
              <TabsTrigger
                value="posts"
                className="flex-1 md:flex-none px-4 py-3 text-xs font-medium border-t-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent rounded-none"
              >
                POSTS
              </TabsTrigger>
              <TabsTrigger
                value="reels"
                className="flex-1 md:flex-none px-4 py-3 text-xs font-medium border-t-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent rounded-none"
              >
                REELS
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="flex-1 md:flex-none px-4 py-3 text-xs font-medium border-t-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent rounded-none"
              >
                SAVED
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No posts yet
                  </p>
                  {isOwnProfile && (
                    <a href="/create" className="text-primary hover:underline">
                      Share your first photo
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="aspect-square bg-muted relative group cursor-pointer"
                    >
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">♥ {post._count?.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reels" className="mt-0">
              {reels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No reels yet
                  </p>
                  {isOwnProfile && (
                    <a href="/create" className="text-primary hover:underline">
                      Create your first reel
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-4">
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      className="aspect-[9/16] bg-muted relative group cursor-pointer"
                    >
                      {reel.thumbnailUrl ? (
                        <img
                          src={reel.thumbnailUrl}
                          alt="Reel thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to video icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">▶ {reel.viewCount || 0}</span>
                        </div>
                      </div>
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 5v10l8-5-8-5z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-0">
              {!isOwnProfile ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Only you can see your saved posts</p>
                </div>
              ) : savedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No saved posts yet
                  </p>
                  <a href="/" className="text-primary hover:underline">
                    Browse posts to save
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-4">
                  {savedPosts.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="aspect-square bg-muted relative group cursor-pointer"
                    >
                      <img
                        src={bookmark.post.imageUrl}
                        alt="Saved post"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">♥ {bookmark.post._count?.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Toaster />
    </>
  )
}
