import { useState, useEffect } from 'react'

export function useUnreadMessages(userId?: string) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchUnreadCount = async () => {
    if (!userId) return

    try {
      const response = await fetch('/api/messages/unread')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('Failed to fetch unread messages count:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
  }, [userId])

  // Function to refresh count (can be called after reading messages)
  const refreshCount = () => {
    fetchUnreadCount()
  }

  return { unreadCount, loading, refreshCount }
}
