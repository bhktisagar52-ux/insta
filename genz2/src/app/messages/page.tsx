'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { MessageSquare, Send, MoreVertical, Search, Image, Smile, Reply, X, Heart, ThumbsUp, Laugh, Angry, Sad, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MessageStatus } from '@/components/ui/message-status'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Conversation {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  lastMessage?: {
    content: string
    createdAt: string
  }
  unreadCount: number
}

interface Message {
  id: string
  content: string
  imageUrl?: string
  senderId: string
  receiverId: string
  createdAt: string
  delivered?: boolean
  read?: boolean
  reactions?: Reaction[]
  replyTo?: {
    id: string
    content: string
    senderId: string
    story?: {
      id: string
      imageUrl: string
      userId: string
    }
  }
  story?: {
    id: string
    imageUrl: string
    userId: string
  }
}

interface Reaction {
  id: string
  emoji: string
  userId: string
  messageId: string
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const startNewConversation = (user: any) => {
    const newConversation: Conversation = {
      id: user.id,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      },
      lastMessage: null,
      unreadCount: 0
    }

    // Check if conversation already exists
    const existingConversation = conversations.find(c => c.id === user.id)
    if (!existingConversation) {
      setConversations(prev => [newConversation, ...prev])
    }

    setSelectedConversation(newConversation)
    setSearchQuery('')
    setSearchResults([])
    setMessages([]) // Clear messages for new conversation
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.url
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!newMessage.trim() && !selectedImage) || !selectedConversation) return

    try {
      let imageUrl = null
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.user.id,
          content: newMessage,
          imageUrl,
          replyToId: replyTo?.id
        })
      })

      if (response.ok) {
        const message = await response.json()
        setMessages([...messages, message])
        setNewMessage('')
        setReplyTo(null)
        setSelectedImage(null)
        setImagePreview(null)
        toast.success('Message sent!')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      })

      if (response.ok) {
        // Refresh messages to show updated reactions
        if (selectedConversation) {
          fetchMessages(selectedConversation.id)
        }
      }
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // WebSocket connection
  useEffect(() => {
    if (!session?.user?.id) return

    const socketInstance = io({
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      socketInstance.emit('join-user', session.user.id)
      console.log('Connected to WebSocket')
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from WebSocket')
    })

    socketInstance.on('new-message', (message: Message) => {
      console.log('Received new-message event:', message)

      // Determine the other user in this message
      const otherUserId = message.senderId === session!.user!.id ? message.receiverId : message.senderId

      // Check if this message is for the current conversation
      if (selectedConversation &&
          ((message.senderId === selectedConversation.user.id && message.receiverId === session!.user!.id) ||
           (message.senderId === session!.user!.id && message.receiverId === selectedConversation.user.id))) {
        console.log('Adding message to current conversation')
        setMessages(prev => [...prev, message])
        // Update conversation last message
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: { content: message.content || 'Image', createdAt: message.createdAt } }
            : conv
        ))
      } else if (message.senderId !== session!.user!.id) {
        // Message from someone else - update conversations list
        console.log('Message from another user, updating conversations list')

        // Refresh conversations to show new message in the list
        fetchConversations()

        // If this is a new conversation (not in our current list), we should add it
        const conversationExists = conversations.some(conv => conv.user.id === message.senderId)
        if (!conversationExists) {
          console.log('New conversation detected, adding to list')
          // The fetchConversations() call above will handle adding new conversations
        }
      } else {
        console.log('Outgoing message from current user, no WebSocket action needed')
      }
    })

    socketInstance.on('message-reaction', (data: { messageId: string, reaction: any }) => {
      if (selectedConversation) {
        // Refresh messages to show updated reactions
        fetchMessages(selectedConversation.id)
      }
    })

    socketInstance.on('messages-read', (data: { senderId: string, receiverId: string }) => {
      console.log('Messages marked as read:', data)
      // If we're the sender and the receiver just read our messages, update the read status
      if (data.senderId === session!.user!.id && selectedConversation && selectedConversation.user.id === data.receiverId) {
        console.log('Updating messages as read for sender')
        // Update messages to show as read
        setMessages(prev => prev.map(msg => {
          if (msg.senderId === session!.user!.id && msg.receiverId === data.receiverId && !msg.read) {
            console.log('Marking message as read:', msg.id)
            return { ...msg, read: true, readAt: new Date().toISOString() }
          }
          return msg
        }))
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session?.user?.id])

  // Join/leave conversation rooms
  useEffect(() => {
    if (!socket || !selectedConversation || !session?.user?.id) return

    const conversationId = [session!.user!.id, selectedConversation.user.id].sort().join('-')
    console.log(`Client joining conversation: ${conversationId}`)
    socket.emit('join-conversation', conversationId)

    return () => {
      console.log(`Client leaving conversation: ${conversationId}`)
      socket.emit('leave-conversation', conversationId)
    }
  }, [selectedConversation, socket, session?.user?.id])

  if (!session) {
    return null
  }

  return (
    <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
      <div className="max-w-6xl mx-auto h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-5rem)] flex">
        {/* Conversations List */}
        <div className={`w-full lg:w-96 border-r flex flex-col ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-xl font-semibold">{session.user?.username}</h1>
            <Button variant="ghost" size="icon">
              <MessageSquare size={24} />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Search"
                className="pl-10 bg-muted"
              />
            </div>
          </div>

          {/* Messages Header */}
          <div className="px-4 py-2">
            <p className="font-semibold">Messages</p>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No conversations yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Search for users above to start chatting!
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted transition-colors text-left ${
                    selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                  }`}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={conversation.user.avatar} />
                    <AvatarFallback className="text-lg">
                      {conversation.user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{conversation.user.username}</p>
                    {conversation.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs">
                      {conversation.unreadCount}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation && (
          <div className="flex flex-1 flex-col">
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft size={24} />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.user.avatar} />
                  <AvatarFallback>
                    {selectedConversation.user.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedConversation.user.username}</p>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical size={24} />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === session.user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-xs lg:max-w-md xl:max-w-lg space-y-1">
                      {/* Reply indicator */}
                      {message.replyTo && (
                        <div className="px-3 py-1 bg-muted/50 rounded-lg border-l-2 border-muted-foreground/30">
                          {message.replyTo.story ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={message.replyTo.story.imageUrl}
                                alt="Story thumbnail"
                                className="w-4 h-4 rounded object-cover"
                              />
                              <p className="text-xs text-muted-foreground">
                                Replying to story
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Replying to: {message.replyTo.content.length > 40 ? `${message.replyTo.content.substring(0, 40)}...` : message.replyTo.content}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Story reply indicator */}
                      {message.story && !message.replyTo && (
                        <div className="px-3 py-1 bg-muted/50 rounded-lg border-l-2 border-muted-foreground/30">
                          <div className="flex items-center gap-2">
                            <img
                              src={message.story.imageUrl}
                              alt="Story thumbnail"
                              className="w-4 h-4 rounded object-cover"
                            />
                            <p className="text-xs text-muted-foreground">
                              Story reply
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`relative group px-4 py-2 rounded-2xl break-words overflow-wrap-anywhere ${
                          message.senderId === session.user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {/* Image */}
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            alt="Message"
                            className="rounded-lg max-w-full h-auto mb-2 object-contain"
                          />
                        )}

                        {/* Text content */}
                        {message.content && (
                          <p className="text-sm">{message.content}</p>
                        )}

                        {/* Message status for sent messages */}
                        {message.senderId === session.user?.id && (
                          <div className="flex justify-end mt-1">
                            <MessageStatus
                              key={message.id + (message.read ? 'read' : 'unread')}
                              delivered={message.delivered || false}
                              read={message.read || false}
                              className="text-xs"
                            />
                          </div>
                        )}

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction: any, index: number) => (
                              <span
                                key={index}
                                className="text-xs bg-background/20 rounded-full px-2 py-1"
                              >
                                {reaction.emoji}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Message actions */}
                        <div className={`absolute -top-6 ${
                          message.senderId === session.user?.id ? 'left-0' : 'right-0'
                        } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-background border"
                            onClick={() => setReplyTo(message)}
                          >
                            <Reply size={12} />
                          </Button>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-background border"
                              onClick={() => setShowEmojiPicker(message.id)}
                            >
                              <Smile size={12} />
                            </Button>
                            {showEmojiPicker === message.id && (
                              <div className="absolute top-8 right-0 bg-background border rounded-lg p-2 shadow-lg z-10">
                                <div className="grid grid-cols-4 gap-1">
                                  {['❤️', '👍', '😂', '😮', '😢', '😡'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        addReaction(message.id, emoji)
                                        setShowEmojiPicker(null)
                                      }}
                                      className="hover:bg-muted rounded p-1 text-lg"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply indicator */}
            {replyTo && (
              <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Replying to: {replyTo.content.length > 30 ? `${replyTo.content.substring(0, 30)}...` : replyTo.content}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  className="h-6 w-6 p-0"
                >
                  <X size={14} />
                </Button>
              </div>
            )}

            {/* Story reply indicator */}
            {replyTo?.story && (
              <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={replyTo.story.imageUrl}
                    alt="Story thumbnail"
                    className="w-6 h-6 rounded object-cover"
                  />
                  <span className="text-sm text-muted-foreground">
                    Replying to story
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  className="h-6 w-6 p-0"
                >
                  <X size={14} />
                </Button>
              </div>
            )}

            {/* Image preview */}
            {imagePreview && (
              <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={imagePreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                  <span className="text-sm text-muted-foreground">Image selected</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X size={14} />
                </Button>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={sendMessage} className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="pr-10"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer">
                    <Image size={18} className="text-muted-foreground hover:text-foreground transition-colors" />
                  </label>
                </div>
                <Button type="submit" disabled={!newMessage.trim() && !selectedImage}>
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
// check
