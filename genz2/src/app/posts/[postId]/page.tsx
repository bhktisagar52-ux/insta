'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
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

interface Post {
  id: string
  imageUrl: string
  caption?: string
  createdAt: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  likes: number
  comments: number
  isLiked?: boolean
}

export default function PostCommentsPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string
  const { data: session } = useSession()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

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
    fetchPostAndComments()
  }, [postId, session])

  const fetchPostAndComments = async () => {
    try {
      // Fetch post details
      const postResponse = await fetch(`/api/posts/${postId}`)
      if (!postResponse.ok) throw new Error('Failed to fetch post')
      const postData = await postResponse.json()
      setPost(postData)
      setLiked(postData.isLiked || false)
      setLikesCount(postData.likes || 0)

      // Fetch comments and transform to match UI structure
      const commentsResponse = await fetch(`/api/posts/${postId}/comments`)
      if (!commentsResponse.ok) throw new Error('Failed to fetch comments')
      const commentsData = await commentsResponse.json()

      const transformedComments = commentsData.map((comment: any) => ({
        id: comment.id,
        author: comment.user.username,
        avatar: comment.user.avatar || null, // Use null to show AvatarFallback instead of random image
        time: new Date(comment.createdAt).getTime(),
        text: comment.content,
        likes: comment.likes || 0,
        isLiked: comment.isLiked || false,
        replies: comment.replies ? comment.replies.map((reply: any) => ({
          id: reply.id,
          author: reply.user.username,
          avatar: reply.user.avatar || null, // Use null to show AvatarFallback instead of random image
          time: new Date(reply.createdAt).getTime(),
          text: reply.content,
          likes: reply.likes || 0,
          isLiked: reply.isLiked || false,
          replies: []
        })) : []
      }))

      setComments(transformedComments)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const showToast = (msg: string) => {
    // Simple toast implementation - you can enhance this
    console.log('Toast:', msg)
  }

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
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
      setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null)
      showToast('Comment posted')
    } catch (error) {
      console.error('Error posting comment:', error)
    }
  }

  const handleLikePost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) throw new Error('Failed to like post')

      const data = await response.json()
      setLiked(data.liked)
      setLikesCount(data.likesCount)
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const toggleLike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
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

  const toggleReplyForm = (commentId: string) => {
    // This will be handled in the CommentItem component
  }

  const submitReply = async (parentId: string, text: string) => {
    if (!text.trim()) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
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
      showToast('Reply posted')
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Post not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-4 flex items-center gap-4 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-semibold">Comments</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Post Preview */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback>{post.user.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link
                href={`/profile/${post.user.username}`}
                className="font-semibold hover:underline"
              >
                {post.user.username}
              </Link>
              {post.caption && (
                <p className="mt-1 text-sm">{post.caption}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-3 aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikePost}
              className="flex items-center gap-2"
            >
              <Heart
                size={20}
                className={liked ? 'fill-red-500 text-red-500' : ''}
              />
              <span>{likesCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span>{post.comments}</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white shadow-sm">
          <h4 className="text-base text-gray-600 font-semibold p-4 border-b">Comments</h4>

          {/* Main Input */}
          <div className="flex gap-3 p-4">
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
          <div className="px-4 pb-4">
            {comments.length === 0 ? (
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
