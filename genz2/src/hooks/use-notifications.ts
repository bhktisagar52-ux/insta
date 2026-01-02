import { useState, useEffect } from 'react'

export function useUnreadNotifications(userId?: string) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchUnreadCount = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/notifications/unread')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [userId])

  return { unreadCount, loading, refetch: fetchUnreadCount }
}
