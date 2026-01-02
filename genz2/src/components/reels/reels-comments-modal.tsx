'use client'

import React, { useState, useEffect } from 'react'
import { X, Heart, MessageCircle, Send, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'

interface Comment {
  id: string
  author: string
  avatar: string
  time: number
  text: string
  likes: number
  isLiked: boolean
  replies: Comment[]
}

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

interface ReelsCommentsModalProps {
  reel: Reel
  isOpen: boolean
  onClose: () => void
  onCommentCountUpdate?: (count: number) => void
}

export function ReelsCommentsModal({ reel, isOpen, onClose, onCommentCountUpdate }: ReelsCommentsModalProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [liked, setLiked] = useState(reel.isLiked)
  const [likesCount, setLikesCount] = useState(reel.likes)

  useEffect(() => {
    if (session?.user) {
      setCurrentUser({
        name: session.user.name || 'You',
        avatar: session.user.image || `https://picsum.photos/seed/${session.user.id}/40/40`
      })
    } else {
      setCurrentUser({
        name: 'You',
        avatar: 'https://picsum.photos/seed/currentuser/40/40'
      })
    }
    if (isOpen) {
      fetchComments()
    }
  }, [reel.id, session, isOpen])

  const fetchComments = async () => {
    try {
      setLoading(true)
      // Fetch comments for the reel
      const response = await fetch(`/api/reels/${reel.id}/comment`)
      if (response.ok) {
        const data = await response.json()
        const transformedComments = data.comments.map((comment: any) => ({
          id: comment.id,
          author: comment.username,
          avatar: comment.avatar || null,
          time: new Date(comment.createdAt).getTime(),
          text: comment.content,
          likes: comment.likes || 0,
          isLiked: comment.isLiked || false,
          replies: comment.replies ? comment.replies.map((reply: any) => ({
            id: reply.id,
            author: reply.username,
            avatar: reply.avatar || null,
            time: new Date(reply.createdAt).getTime(),
            text: reply.content,
            likes: reply.likes || 0,
            isLiked: reply.isLiked || false,
            replies: []
          })) : []
        }))
        setComments(transformedComments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/reels/${reel.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to post comment')

      const comment = await response.json()
      const newCommentObj = {
        id: comment.id,
        author: currentUser.name,
        avatar: currentUser.avatar,
        time: Date.now(),
        text: comment.content,
        likes: 0,
        isLiked: false,
        replies: []
      }

      setComments(prev => [newCommentObj, ...prev])
      setNewComment('')
      onCommentCountUpdate?.(comments.length + 1)
    } catch (error) {
      console.error('Error posting comment:', error)
    }
  }

  const handleLikeReel = async () => {
    try {
      const response = await fetch(`/api/reels/${reel.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) throw new Error('Failed to like reel')

      const data = await response.json()
      setLiked(data.liked)
      setLikesCount(data.likesCount)
    } catch (error) {
      console.error('Error liking reel:', error)
    }
  }

  const toggleLike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/reels/${reel.id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) throw new Error('Failed to like comment')

      const data = await response.json()

      const updateCommentLikes = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, isLiked: data.liked, likes: data.likesCount }
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: updateCommentLikes(comment.replies) }
          }
          return comment
        })
      }

      setComments(prev => updateCommentLikes(prev))
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const submitReply = async (parentId: string, text: string) => {
    if (!text.trim()) return

    try {
      const response = await fetch(`/api/reels/${reel.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text.trim(),
          parentId
        })
      })

      if (!response.ok) throw new Error('Failed to post reply')

      const reply = await response.json()
      const newReply = {
        id: reply.id,
        author: currentUser.name,
        avatar: currentUser.avatar,
        time: Date.now(),
        text: reply.content,
        likes: 0,
        isLiked: false,
        replies: []
      }

      const addReplyToComment = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === parentId) {
            return { ...comment, replies: [newReply, ...comment.replies] }
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: addReplyToComment(comment.replies) }
          }
          return comment
        })
      }

      setComments(prev => addReplyToComment(prev))
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Comments</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Comments Section */}
          <div className="bg-white">
            {/* Main Input */}
            <div className="flex gap-3 p-4 border-b">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback>{currentUser?.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newComment.trim()) {
                    handleCommentSubmit()
                  }
                }}
                placeholder="Write a comment..."
                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm outline-none focus:bg-gray-50 transition-colors"
              />
            </div>

            {/* Comments List */}
            <div className="p-4">
              {loading ? (
                <div className="text-center text-gray-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onLike={toggleLike}
                      onReply={submitReply}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  onLike: (commentId: string) => void
  onReply: (parentId: string, text: string) => void
  currentUser: any
}

function CommentItem({ comment, onLike, onReply, currentUser }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + "y"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + "m"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + "d"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + "h"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + "min"
    return "Just now"
  }

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText)
      setReplyText('')
      setShowReplyForm(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 animate-fadeIn">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.avatar} />
          <AvatarFallback>{comment.author[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-100 p-3 rounded-2xl">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-sm text-gray-900">{comment.author}</span>
              <span className="text-xs text-gray-500">{timeAgo(comment.time)}</span>
            </div>
            <div className="text-sm text-gray-900 break-words">{comment.text}</div>
          </div>
          <div className="flex gap-3 mt-2 ml-2">
            <button
              className={`text-xs font-semibold cursor-pointer hover:underline ${
                comment.isLiked ? 'text-blue-600' : 'text-gray-500'
              }`}
              onClick={() => onLike(comment.id)}
            >
              {comment.isLiked ? 'Liked' : 'Like'} {comment.likes > 0 ? `• ${comment.likes}` : ''}
            </button>
            <button
              className="text-xs font-semibold text-gray-500 cursor-pointer hover:underline"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              Reply
            </button>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="flex gap-3 mt-3 ml-6 animate-fadeIn">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback>{currentUser?.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && replyText.trim()) {
                    handleReplySubmit()
                  }
                }}
                placeholder="Write a reply..."
                className="flex-1 bg-gray-100 border-none rounded-full px-3 py-2 text-xs outline-none focus:bg-gray-50 transition-colors"
              />
              <Button
                size="sm"
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded h-7"
              >
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReplyForm(false)}
                className="text-gray-500 text-xs px-2 py-1 h-7"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={onLike}
                  onReply={onReply}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
