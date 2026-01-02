'use client'

import { useState, useRef } from 'react'
import { X, Type, Smile, Music, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface StoryCreatorProps {
  isOpen: boolean
  onClose: () => void
  onStoryCreated: () => void
}

export function StoryCreator({ isOpen, onClose, onStoryCreated }: StoryCreatorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [textOverlay, setTextOverlay] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 })
  const [textColor, setTextColor] = useState('#ffffff')
  const [fontSize, setFontSize] = useState(24)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Start uploading the image
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'stories')

        // Simulate progress (since we can't track real progress with fetch)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!uploadResponse.ok) {
          let errorMessage = 'Failed to upload image'
          try {
            const errorData = await uploadResponse.json()
            errorMessage = errorData.error || errorMessage
            if (errorData.details) {
              console.error('Upload error details:', errorData.details)
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError)
            // If we can't parse the error, include the status code
            errorMessage = `Upload failed with status ${uploadResponse.status}`
          }
          throw new Error(errorMessage)
        }

        const uploadData = await uploadResponse.json()

        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload image')
        }

        setUploadedImageUrl(uploadData.url)
        setUploadProgress(0) // Hide progress bar
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload image. Please try again.')
        setSelectedImage(null)
        setUploadProgress(0)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleCreateStory = async () => {
    if (!uploadedImageUrl) return

    setIsUploading(true)
    try {
      // Create the story using the already uploaded image URL
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          caption: caption.trim() || undefined,
          textOverlay: textOverlay.trim() || undefined,
          textPosition,
          textColor,
          fontSize,
        }),
      })

      if (response.ok) {
        onStoryCreated()
        onClose()
        resetForm()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Story creation failed:', response.status, errorData)
        throw new Error(errorData.error || `Failed to create story (${response.status})`)
      }
    } catch (error) {
      console.error('Error creating story:', error)
      alert('Failed to create story. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedImage(null)
    setUploadedImageUrl(null)
    setCaption('')
    setTextOverlay('')
    setTextPosition({ x: 50, y: 50 })
    setTextColor('#ffffff')
    setFontSize(24)
    setUploadProgress(0)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-auto bg-black text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-white">Create Story</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Add photos and text to create engaging stories for your followers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedImage ? (
            // Image selection
            <div
              className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
                  <ImageIcon size={32} />
                </div>
                <p className="text-sm text-gray-400">Tap to add photo</p>
              </div>
            </div>
          ) : (
            // Image preview with editing tools
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />

                {/* Text overlay */}
                {textOverlay && (
                  <div
                    className="absolute cursor-move"
                    style={{
                      left: `${textPosition.x}%`,
                      top: `${textPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      userSelect: 'none',
                    }}
                    onMouseDown={(e) => {
                      const startX = e.clientX
                      const startY = e.clientY
                      const startPos = { ...textPosition }

                      const handleMouseMove = (e: MouseEvent) => {
                        const deltaX = e.clientX - startX
                        const deltaY = e.clientY - startY
                        const rect = e.currentTarget.parentElement.getBoundingClientRect()
                        const newX = Math.max(0, Math.min(100, startPos.x + (deltaX / rect.width) * 100))
                        const newY = Math.max(0, Math.min(100, startPos.y + (deltaY / rect.height) * 100))
                        setTextPosition({ x: newX, y: newY })
                      }

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove)
                        document.removeEventListener('mouseup', handleMouseUp)
                      }

                      document.addEventListener('mousemove', handleMouseMove)
                      document.addEventListener('mouseup', handleMouseUp)
                    }}
                  >
                    {textOverlay}
                  </div>
                )}

                {/* Upload Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-white text-center mt-1">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => {
                    setSelectedImage(null)
                    setUploadedImageUrl(null)
                    setUploadProgress(0)
                  }}
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Text overlay input */}
              <div className="space-y-2">
                <Input
                  placeholder="Add text to your story..."
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                />

                {/* Text styling controls */}
                {textOverlay && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Size:</span>
                      <input
                        type="range"
                        min="12"
                        max="48"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-16"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Color:</span>
                      <div className="flex gap-1">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 ${
                              textColor === color ? 'border-white' : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setTextColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption */}
              <Textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 resize-none"
                rows={2}
              />

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Type size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Smile size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Music size={20} />
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex-1 text-white hover:bg-gray-800"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStory}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!uploadedImageUrl || isUploading}
            >
              {isUploading ? 'Sharing...' : 'Share to Story'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
