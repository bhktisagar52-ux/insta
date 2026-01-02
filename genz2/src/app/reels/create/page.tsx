'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X, Video, Plus, Music, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Link from 'next/link'

const DURATION_PRESETS = [
  { id: 'short', label: 'Short', seconds: 15 },
  { id: 'standard', label: 'Standard', seconds: 30 },
  { id: 'long', label: 'Long', seconds: 60 },
  { id: 'max', label: 'Max (90s)', seconds: 90 }
]

export default function CreateReelPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [duration, setDuration] = useState(15)
  const [isPrivate, setIsPrivate] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [allowDuet, setAllowDuet] = useState(true)
  const [allowRemix, setAllowRemix] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!session) {
    return null
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setVideoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }

  const removeVideo = () => {
    setVideoFile(null)
    setVideoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAudio = () => {
    setAudioFile(null)
    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!videoFile) {
      toast({
        title: 'Video required',
        description: 'Please select a video to create a reel',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('caption', caption.trim() || '')
      formData.append('location', location.trim() || '')
      formData.append('hashtags', hashtags.trim() || '')
      formData.append('mentionIds', '')
      formData.append('allowComments', String(allowComments))
      formData.append('allowDuet', String(allowDuet))
      formData.append('allowRemix', String(allowRemix))

      if (audioFile) {
        formData.append('audio', audioFile)
      }

      const response = await fetch('/api/reels', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      toast({
        title: 'Reel created!',
        description: 'Your reel has been shared successfully'
      })

      router.push('/')
    } catch (error) {
      console.error('Reel creation error:', error)
      toast({
        title: 'Error',
        description: 'Failed to create reel. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Video size={24} className="text-primary" />
              Create Reel
            </h1>
            <Link href="/">
              <Button variant="ghost" size="icon">
                <X size={24} />
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Video Upload */}
                <div className="space-y-2">
                  <Label>Video</Label>
                  {!videoPreview ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Video size={48} className="mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag video here or click to select
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP4, MOV, WebM up to 500MB
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 9:16 aspect ratio
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden bg-black">
                        <video
                          src={videoPreview}
                          className="w-full max-h-96 object-contain"
                          controls
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeVideo}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio/Music */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Background Music</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAudioFile(null)}
                        className="gap-1"
                      >
                        <Plus size={14} />
                        Upload Audio
                      </Button>
                    </div>
                  </div>
                  {audioFile ? (
                    <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                      <span className="text-sm truncate">{audioFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeAudio}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      <Music size={32} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Click to add background music
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports MP3, WAV
                      </p>
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Write a caption for your reel..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    maxLength={2200}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {caption.length}/2200
                  </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Add location (optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Hashtags */}
                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Input
                    id="hashtags"
                    type="text"
                    placeholder="#travel #adventure #nature"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas
                  </p>
                </div>

                {/* Duration Preset */}
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATION_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        type="button"
                        variant={duration === preset.seconds ? 'default' : 'outline'}
                        onClick={() => setDuration(preset.seconds)}
                        className="h-12"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose clip duration
                  </p>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-3 border rounded-lg p-4">
                  <Label className="text-sm font-medium mb-2">Reel Settings</Label>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allowComments"
                        checked={allowComments}
                        onChange={(e) => setAllowComments(e.target.checked)}
                        className="w-4 h-4 rounded border-input"
                      />
                      <label
                        htmlFor="allowComments"
                        className="text-sm cursor-pointer"
                      >
                        Allow Comments
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Let others comment on your reel
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allowDuet"
                        checked={allowDuet}
                        onChange={(e) => setAllowDuet(e.target.checked)}
                        className="w-4 h-4 rounded border-input"
                      />
                      <label
                        htmlFor="allowDuet"
                        className="text-sm cursor-pointer"
                      >
                        Allow Duet
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Others can create duets with your reel
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allowRemix"
                        checked={allowRemix}
                        onChange={(e) => setAllowRemix(e.target.checked)}
                        className="w-4 h-4 rounded border-input"
                      />
                      <label
                        htmlFor="allowRemix"
                        className="text-sm cursor-pointer"
                      >
                        Allow Remix
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Others can remix your reel
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="w-4 h-4 rounded border-input"
                      />
                      <label
                        htmlFor="isPrivate"
                        className="text-sm cursor-pointer"
                      >
                        Private Reel
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only you can see your reel
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!videoFile || isSubmitting || isUploading}
                  size="lg"
                >
                  {isSubmitting ? 'Creating...' : isUploading ? 'Uploading...' : 'Share Reel'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Toaster />
    </>
  )
}
