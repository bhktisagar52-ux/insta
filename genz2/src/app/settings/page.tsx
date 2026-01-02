'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Lock, Globe } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user?.id) {
      fetchSettings()
    }
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/users/settings')
      if (response.ok) {
        const data = await response.json()
        setIsPrivate(data.isPrivate || false)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPrivate }),
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="lg:ml-64 min-h-screen bg-background pt-2 lg:pt-0 pb-14 lg:pb-0">
        <div className="max-w-2xl mx-auto py-4 lg:py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="lg:ml-64 min-h-screen bg-background pt-2 lg:pt-0 pb-14 lg:pb-0">
      <div className="max-w-2xl mx-auto py-4 lg:py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              Account Privacy
            </CardTitle>
            <CardDescription>
              Control who can see your posts and follow you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="private-account" className="text-base font-medium">
                  Private Account
                </Label>
                <p className="text-sm text-muted-foreground">
                  When your account is private, only people you approve can follow you and see your posts.
                </p>
              </div>
              <Switch
                id="private-account"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isPrivate ? 'Private Account' : 'Public Account'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPrivate
                    ? 'Only approved followers can see your posts and reels. Follow requests require your approval.'
                    : 'Anyone can follow you and see your posts and reels immediately.'
                  }
                </p>
              </div>
            </div>

            <Button
              onClick={saveSettings}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
