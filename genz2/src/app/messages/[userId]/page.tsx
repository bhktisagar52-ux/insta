'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, MoreVertical, Image as ImageIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  imageUrl?: string
  senderId: string
  createdAt: string
}

interface User {
  id: string
  username: string
  avatar?: string
}

export default function ChatPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const userId = params.userId as string

  useEffect(() => {
    fetchMessages()
    fetchUser()
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      // Mock data for demo
      setTimeout(() => {
        setMessages([
          {
            id: '1',
            content: 'Hey! How are you?',
            senderId: userId,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            content: 'I\'m good! Just finished a project',
            senderId: session?.user?.id || '',
            createdAt: new Date(Date.now() - 3000000).toISOString()
          },
          {
            id: '3',
            content: 'That\'s great! What kind of project?',
            senderId: userId,
            createdAt: new Date(Date.now() - 2400000).toISOString()
          }
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: session?.user?.id || '',
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // In production, send to API
    // await fetch('/api/messages', { ... })
  }

  if (loading) {
    return (
      <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
          <div className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex-1 space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-48" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b">
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser?.avatar} />
            <AvatarFallback>
              {currentUser?.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold">{currentUser?.username}</h2>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical size={20} />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === session?.user?.id
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.imageUrl ? (
                    <img
                      src={message.imageUrl}
                      alt="Message image"
                      className="rounded-lg mb-2"
                    />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10">
              <ImageIcon size={20} />
            </Button>
            <Input
              type="text"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10"
              disabled={!newMessage.trim()}
            >
              <Send size={20} />
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
