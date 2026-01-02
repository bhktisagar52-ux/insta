import { NextResponse } from 'next/server'
import { chat } from 'z-ai-web-dev-sdk'

// POST /api/ai/generate-caption - Generate AI caption
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageUrl, style = 'engaging' } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Generate caption using LLM
    const prompt = `Generate an ${style} Instagram caption for an image. 
    Make it concise, include relevant emojis, and suggest 2-3 hashtags at the end.
    Format as a single paragraph without any prefixes like "Caption:" or similar.`

    const result = await chat({
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media caption writer specializing in Instagram content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'gpt-4o'
    })

    if (!result || !result.content) {
      return NextResponse.json(
        { error: 'Failed to generate caption' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      caption: result.content.trim()
    })
  } catch (error) {
    console.error('AI caption generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    )
  }
}
