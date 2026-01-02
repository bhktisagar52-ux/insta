import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/posts - Get all posts (feed)
export async function GET(request: Request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const explore = searchParams.get('explore')

    let posts

    if (userId) {
      // Check if the user is private and if current user can view their posts
      const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { isPrivate: true }
      })

      let canViewPosts = true

      if (targetUser?.isPrivate && session?.user?.id) {
        // Allow access if user is viewing their own profile
        if (session.user.id === userId) {
          canViewPosts = true
        } else {
          // Check if current user is an accepted follower
          const follow = await db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: session.user.id,
                followingId: userId
              },
              status: 'accepted'
            }
          })
          canViewPosts = !!follow
        }
      } else if (targetUser?.isPrivate && !session?.user?.id) {
        // Private account and not logged in - cannot view
        canViewPosts = false
      }

      if (!canViewPosts) {
        return NextResponse.json([])
      }

      // Get posts by specific user
      posts = await db.post.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              likes: true
            }
          },
          likes: session?.user?.id ? {
            where: {
              userId: session.user.id
            },
            select: {
              id: true
            }
          } : false
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Get feed - posts from followed users or all posts
      posts = await db.post.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          },
          likes: session?.user?.id ? {
            where: {
              userId: session.user.id
            },
            select: {
              id: true
            }
          } : false,
          comments: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    }

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new post
export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { imageUrl, caption, location } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // Create post
    const post = await db.post.create({
      data: {
        userId: session.user.id,
        imageUrl,
        caption,
        location
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      }
    })

    // Extract and create hashtags
    if (caption) {
      const hashtagRegex = /#(\w+)/g
      const matches = caption.match(hashtagRegex)

      if (matches) {
        for (const tag of matches) {
          const hashtagName = tag.slice(1).toLowerCase()

          const hashtag = await db.hashtag.upsert({
            where: { name: hashtagName },
            update: {
              count: { increment: 1 }
            },
            create: {
              name: hashtagName,
              count: 1
            }
          })

          await db.postHashtag.create({
            data: {
              postId: post.id,
              hashtagId: hashtag.id
            }
          })
        }
      }
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
