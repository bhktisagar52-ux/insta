'use client'

import { Home, Search, PlusSquare, User, Video, Bell, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useUnreadNotifications } from '@/hooks/use-notifications'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { useSession } from 'next-auth/react'

export function MobileHeader({ username = 'username', avatar }: { username?: string, avatar?: string }) {
  const { data: session } = useSession()
  const { unreadCount } = useUnreadNotifications(session?.user?.id)
  const profileHref = username === 'username' ? '/login' : `/profile/${username}`

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b bg-background lg:hidden">
      <div className="flex h-full items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          InstaClone
        </Link>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User Avatar */}
          <Link href={profileHref}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar} />
              <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function MobileNav() {
  const { data: session } = useSession()
  const { unreadCount: unreadMessagesCount } = useUnreadMessages(session?.user?.id)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 border-t bg-background lg:hidden">
      <div className="flex h-full items-center justify-around px-2">
        <Link href="/" className="flex-1 flex justify-center py-2">
          <Button variant="ghost" size="icon" className="h-full w-full">
            <Home size={24} />
          </Button>
        </Link>
        <Link href="/search" className="flex-1 flex justify-center py-2">
          <Button variant="ghost" size="icon" className="h-full w-full">
            <Search size={24} />
          </Button>
        </Link>
        <Link href="/create" className="flex-1 flex justify-center py-2">
          <Button variant="ghost" size="icon" className="h-full w-full">
            <PlusSquare size={24} />
          </Button>
        </Link>
        <Link href="/reels" className="flex-1 flex justify-center py-2">
          <Button variant="ghost" size="icon" className="h-full w-full">
            <Video size={24} />
          </Button>
        </Link>
        <Link href="/messages" className="flex-1 flex justify-center py-2 relative">
          <Button variant="ghost" size="icon" className="h-full w-full">
            <MessageSquare size={24} />
            {unreadMessagesCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>
    </nav>
  )
}
