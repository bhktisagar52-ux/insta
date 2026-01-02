'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X, ImageIcon, MapPin, Wand2, Sparkles, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Link from 'next/link'

export default function CreatePostPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (session === null) {
      router.push('/login')
    }
  }, [session, router])

  if (session === null) {
    return <div>Loading...</div>
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setUploadedImage(data.url)
      setImagePreview(data.url)
      toast({
        title: "Image uploaded!",
        description: "Your photo has been uploaded successfully"
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imagePrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt to generate an image",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingImage(true)

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt })
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      setUploadedImage(data.imageUrl)
      setImagePreview(data.imageUrl)
      setImagePrompt('')
      toast({
        title: "Image generated!",
        description: "Your AI-generated image is ready"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleGenerateCaption = async () => {
    if (!imagePreview) {
      toast({
        title: "Image required",
        description: "Please select or generate an image first",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingCaption(true)

    try {
      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imagePreview })
      })

      if (!response.ok) {
        throw new Error('Failed to generate caption')
      }

      const data = await response.json()
      setCaption(data.caption)
      toast({
        title: "Caption generated!",
        description: "Your AI-generated caption is ready"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate caption. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingCaption(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imagePreview) {
      toast({
        title: "Image required",
        description: "Please upload or generate an image to post",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: imagePreview,
          caption: caption.trim() || undefined,
          location: location.trim() || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully"
      })

      router.push('/')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
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
            <h1 className="text-xl font-semibold">Create new post</h1>
            <div className="flex items-center gap-2">
              <Link href="/reels/create">
                <Button variant="outline" size="sm">
                  Create Reel
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <X size={24} />
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Photo</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Wand2 size={16} />
                          AI Generate
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generate Image with AI</DialogTitle>
                          <DialogDescription>
                            Describe the image you want to create
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleGenerateImage} className="space-y-4">
                          <Textarea
                            placeholder="A beautiful sunset over mountains..."
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            rows={4}
                          />
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={isGeneratingImage}
                          >
                            {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {!imagePreview ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <div className="space-y-2">
                          <div className="animate-pulse bg-muted h-6 w-24 rounded mx-auto" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag photos here or click to select
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG, GIF up to 10MB
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="caption">Caption</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateCaption}
                      disabled={!imagePreview || isGeneratingCaption}
                      className="gap-2"
                    >
                      <Sparkles size={16} />
                      {isGeneratingCaption ? 'Generating...' : 'AI Generate'}
                    </Button>
                  </div>
                  <Textarea
                    id="caption"
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    maxLength={2200}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {caption.length}/2200
                  </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="Add location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Hashtags Preview */}
                {caption.includes('#') && (
                  <div className="space-y-2">
                    <Label>Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {caption.match(/#\w+/g)?.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!imagePreview || isSubmitting}
                >
                  {isSubmitting ? 'Sharing...' : 'Share'}
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
