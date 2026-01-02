import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateImage } from 'z-ai-web-dev-sdk'

// POST /api/ai/generate-image - Generate AI image
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate image using z-ai-web-dev-sdk
    const result = await generateImage({
      prompt,
      size: '1024x1024',
      style: 'photorealistic'
    })

    return NextResponse.json({
      imageUrl: result.data.imageUrl,
      prompt: result.data.prompt
    })
  } catch (error) {
    console.error('AI image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
