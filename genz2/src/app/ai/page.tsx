'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sparkles, Wand2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Link from 'next/link'

const stylePresets = [
  { id: 'photorealistic', name: 'Photorealistic', prompt: 'photorealistic, high quality, detailed' },
  { id: 'artistic', name: 'Artistic', prompt: 'artistic, oil painting style, vibrant colors' },
  { id: 'minimalist', name: 'Minimalist', prompt: 'minimalist, clean design, simple' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'cinematic, dramatic lighting, movie-like' },
  { id: 'vintage', name: 'Vintage', prompt: 'vintage style, nostalgic, film photography' },
  { id: 'modern', name: 'Modern', prompt: 'modern, contemporary, sleek design' }
]

export default function AICreatePage() {
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('photorealistic')
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your image",
        variant: "destructive"
      })
      return
    }

    setGenerating(true)
    try {
      const stylePreset = stylePresets.find(s => s.id === selectedStyle)
      const enhancedPrompt = `${prompt}, ${stylePreset?.prompt || 'high quality'}`

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: enhancedPrompt })
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImage(data.imageUrl)
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
      setGenerating(false)
    }
  }

  const handleUseImage = () => {
    if (!generatedImage) return
    // Store image in session storage to use in create post
    sessionStorage.setItem('aiGeneratedImage', generatedImage)
    window.location.href = '/create'
  }

  if (!session) {
    return (
      <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0 flex items-center justify-center">
        <div className="text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Sign in to use AI features</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="lg:ml-64 min-h-screen bg-background pt-14 lg:pt-0 pb-14 lg:pb-0">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="text-primary" />
              AI Image Generator
            </h1>
            <p className="text-muted-foreground">
              Create stunning images with AI for your posts
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Controls */}
            <div className="space-y-6">
              {/* Prompt Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 size={20} />
                    Describe your image
                  </CardTitle>
                  <CardDescription>
                    Be specific about what you want to create
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="A serene sunset over mountains with a lake reflecting the golden sky..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />

                  {/* Style Presets */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {stylePresets.map((style) => (
                        <Button
                          key={style.id}
                          variant={selectedStyle === style.id ? 'default' : 'outline'}
                          onClick={() => setSelectedStyle(style.id)}
                          className="justify-start"
                        >
                          {style.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Sparkles className="mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Prompt Ideas */}
              <Card>
                <CardHeader>
                  <CardTitle>Prompt Ideas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => setPrompt('A cozy coffee shop interior with warm lighting and plants')}
                    >
                      ☕ Cozy coffee shop interior
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => setPrompt('A majestic mountain landscape at golden hour')}
                    >
                      🏔️ Mountain landscape at golden hour
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => setPrompt('Colorful street food market at night with neon lights')}
                    >
                      🌃 Street food market at night
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                    >
                      🐾 Your pet in a cute setting
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImage ? (
                  <div className="space-y-4">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      onClick={handleUseImage}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="mr-2" />
                      Use This Image for Post
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Your generated image will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Toaster />
    </>
  )
}
// check
