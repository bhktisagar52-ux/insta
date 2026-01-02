'use client'

import { Home, Search, Compass, Heart, PlusSquare, MessageSquare, User, LogOut, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useUnreadNotifications } from '@/hooks/use-notifications'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { useSession } from 'next-auth/react'

interface NavigationItem {
  icon: React.ReactNode
  label: string
  href: string
}

interface SidebarProps {
  username?: string
  avatar?: string
}

export function Sidebar({ username = 'username', avatar }: SidebarProps) {
  const { data: session } = useSession()
  const { unreadCount } = useUnreadNotifications(session?.user?.id)
  const { unreadCount: unreadMessagesCount } = useUnreadMessages(session?.user?.id)
  const profileHref = username === 'username' ? '/login' : `/profile/${username}`

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background hidden lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b">
          <Link href="/" className="text-2xl font-bold">
            InstaClone
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
              <Home size={24} />
              <span>Home</span>
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
              <Search size={24} />
              <span>Search</span>
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
              <Compass size={24} />
              <span>Explore</span>
            </Button>
          </Link>
          <Link href="/notifications" className="relative">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
              <Heart size={24} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/messages" className="relative">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
              <MessageSquare size={24} />
              <span>Messages</span>
              {unreadMessagesCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-4 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/reels">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
              <Video size={24} />
              <span>Reels</span>
            </Button>
          </Link>
          <Link href="/create">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
              <PlusSquare size={24} />
              <span>Create</span>
            </Button>
          </Link>
          <Link href={profileHref}>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base">
              <User size={24} />
              <span>Profile</span>
            </Button>
          </Link>
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          <Link href={profileHref} className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={avatar} />
              <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{username}</p>
              <p className="text-xs text-muted-foreground">Switch accounts</p>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut size={20} />
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  )
}
