'use client'

import { Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { StoryCreator } from './story-creator'

interface Story {
  id: string
  userId: string
  username: string
  avatar?: string
  hasStory: boolean
  imageUrl?: string
}

interface StoriesProps {
  stories: Story[]
  onStoryCreated?: () => void
}

export function Stories({ stories, onStoryCreated }: StoriesProps) {
  const { data: session } = useSession()
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)

  const handleStoryCreated = () => {
    onStoryCreated?.()
    setIsCreatorOpen(false)
  }

  // Check if current user has a story
  const currentUserStory = stories.find(story => story.userId === session?.user?.id)
  const otherStories = stories.filter(story => story.userId !== session?.user?.id)

  return (
    <>
      <div className="max-w-lg mx-auto mb-4">
        <div className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {/* Your Story / Current User Story */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer">
            <div className="relative">
              {currentUserStory ? (
                <Link href={`/stories/${currentUserStory.userId}`}>
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                    <Avatar className="h-16 w-16 border-2 border-background">
                      <AvatarImage src={currentUserStory.avatar} />
                      <AvatarFallback>{currentUserStory.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </Link>
              ) : (
                <Avatar className="h-16 w-16 border-2 border-background">
                  <AvatarFallback className="bg-muted">Y</AvatarFallback>
                </Avatar>
              )}
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsCreatorOpen(true)}
              >
                <Plus size={14} />
              </Button>
            </div>
            <span className="text-xs">Your story</span>
          </div>

          {/* Other Stories */}
          {otherStories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.userId}`}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div
                className={`p-0.5 rounded-full ${
                  story.hasStory
                    ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                    : ''
                }`}
              >
                <Avatar className={`h-16 w-16 ${story.hasStory ? 'border-2 border-background' : ''}`}>
                  <AvatarImage src={story.avatar} />
                  <AvatarFallback>{story.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs truncate max-w-[70px]">
                {story.username}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <StoryCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onStoryCreated={handleStoryCreated}
      />
    </>
  )
}
