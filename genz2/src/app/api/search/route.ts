import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/search - Search users and hashtags
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json([])
    }

    // Search users
    const users = await db.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { name: { contains: query } }
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            posts: true,
            followers: true
          }
        }
      },
      take: 20
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
