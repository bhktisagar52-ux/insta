

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadToCloudinary, cloudinary } from '@/lib/cloudinary'

// POST /api/reels - Upload and create a new reel
export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string
    const location = formData.get('location') as string
    const audioFile = formData.get('audio') as File | null
    const hashtags = formData.get('hashtags') as string
    const mentionIds = formData.get('mentionIds') as string
    const allowComments = formData.get('allowComments') === 'true'
    const allowDuet = formData.get('allowDuet') === 'true'
    const allowRemix = formData.get('allowRemix') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'Video file is required' },
        { status: 400 }
      )
    }

    // Upload video to Cloudinary
    console.log('Starting video upload to Cloudinary...')
    const videoUpload = await uploadToCloudinary(file, {
      folder: `user-${session.user.id}/reels`,
      resource_type: 'video'
    })

    if (!videoUpload.success || !videoUpload.url) {
      console.error('Video upload failed:', videoUpload.error)
      return NextResponse.json(
        { error: videoUpload.error || 'Video upload failed' },
        { status: 500 }
      )
    }
    console.log('Video uploaded successfully:', videoUpload.url)

    // Upload audio if provided
    let audioUrl: string | undefined
    if (audioFile) {
      const audioUpload = await uploadToCloudinary(audioFile, {
        folder: `user-${session.user.id}/audio`,
        resource_type: 'auto',
        transformation: {
          quality: 'auto',
          format: 'mp3'
        }
      })

      audioUrl = audioUpload.url
    }

    // Generate thumbnail from video using Cloudinary explicit transformation
    let thumbnailUrl: string | undefined
    try {
      console.log('Generating thumbnail from video...')
      // Use Cloudinary's explicit API to generate thumbnail from the uploaded video
      const thumbnailResult = await cloudinary.uploader.explicit(videoUpload.publicId, {
        type: 'upload',
        eager: [
          {
            width: 540,
            height: 960,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            format: 'jpg'
          }
        ],
        // Extract frame at 1 second
        start_offset: '1'
      })

      if (thumbnailResult.eager && thumbnailResult.eager.length > 0) {
        thumbnailUrl = thumbnailResult.eager[0].secure_url
      }
      console.log('Thumbnail URL generated:', thumbnailUrl)
    } catch (thumbnailError) {
      console.error('Thumbnail generation failed:', thumbnailError)
      // Fallback: generate thumbnail URL using Cloudinary URL transformation
      try {
        const videoPublicId = videoUpload.publicId
        thumbnailUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/so_1,w_540,h_960,c_fill,g_auto,q_auto,f_jpg/${videoPublicId}.jpg`
        console.log('Fallback thumbnail URL generated:', thumbnailUrl)
      } catch (fallbackError) {
        console.error('Fallback thumbnail generation also failed:', fallbackError)
      }
    }

    // Create reel
    console.log('Creating reel in database...')
    console.log('User ID:', session.user.id)
    console.log('Video URL:', videoUpload.url)
    console.log('Thumbnail URL:', thumbnailUrl)

    const reel = await db.reel.create({
      data: {
        userId: session.user.id,
        videoUrl: videoUpload.url,
        thumbnailUrl: thumbnailUrl || null,
        caption: caption || null,
        location: location || null,
        duration: 0, // Will be set by video processing
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        audioUrl: audioUrl,
        mentionIds: mentionIds || null,
        allowComments,
        allowDuet,
        allowRemix
      }
    })
    console.log('Reel created successfully:', reel.id)

    // Process hashtags if provided
    if (hashtags) {
      const hashtagList = hashtags.split(',').map(h => h.trim()).filter(h => h.length > 0)
      const videoHashtags = await db.videoHashtag.findMany({
        where: { name: { in: hashtagList } }
      })

      for (const hashtag of hashtagList) {
        const existingHashtag = videoHashtags.find(h => h.name === hashtag)

        if (existingHashtag) {
          await db.videoHashtag.update({
            where: { id: existingHashtag.id },
            data: { count: { increment: 1 } }
          })

          await db.videoHashtagReel.create({
            data: {
              reelId: reel.id,
              hashtagId: existingHashtag.id
            }
          })
        } else {
          const newHashtag = await db.videoHashtag.create({
            data: { name: hashtag, count: 1 }
          })

          await db.videoHashtagReel.create({
            data: {
              reelId: reel.id,
              hashtagId: newHashtag.id
            }
          })
        }
      }
    }

    // Create video analytics
    console.log('Creating video analytics...')
    await db.videoAnalytics.create({
      data: {
        reelId: reel.id,
        userId: session.user.id,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        watchTime: 0,
        completionRate: 0,
        engagementRate: 0
      }
    })
    console.log('Video analytics created successfully')

    return NextResponse.json(reel, { status: 201 })
  } catch (error) {
    console.error('Reel creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create reel' },
      { status: 500 }
    )
  }
}
// GET /api/reels - Get all reels (feed)
export async function GET(request: Request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const explore = searchParams.get('explore')
    const trending = searchParams.get('trending')

    let reels

    if (trending) {
      // Get trending reels based on engagement (simplified for now)
      reels = await db.reel.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ],
          isPrivate: false
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
              views: true,
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    } else if (userId) {
      // Check if the user is private and if current user can view their reels
      const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { isPrivate: true }
      })

      let canViewReels = true

      if (targetUser?.isPrivate && session?.user?.id) {
        // Allow access if user is viewing their own profile
        if (session.user.id === userId) {
          canViewReels = true
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
          canViewReels = !!follow
        }
      } else if (targetUser?.isPrivate && !session?.user?.id) {
        // Private account and not logged in - cannot view
        canViewReels = false
      }

      if (!canViewReels) {
        return NextResponse.json([])
      }

      // Get user's reels
      reels = await db.reel.findMany({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
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
              views: true,
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { publishedAt: 'desc' }
      })
    } else if (explore) {
      // Get explore page reels (random discovery)
      reels = await db.reel.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ],
          isPrivate: false
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
              views: true,
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    } else {
      // Get reels feed (all reels)
      reels = await db.reel.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
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
              views: true,
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { publishedAt: 'desc' },
        take: 30
      })
    }

    // If user is authenticated, add follow/bookmark status
    if (session?.user?.id) {
      const reelIds = reels.map(reel => reel.id)
      const userIds = [...new Set(reels.map(reel => reel.userId))]

      // Check follows
      const follows = await db.follow.findMany({
        where: {
          followerId: session.user.id,
          followingId: { in: userIds }
        },
        select: { followingId: true }
      })
      const followingIds = new Set(follows.map(f => f.followingId))

      // Check bookmarks
      const bookmarks = await db.videoBookmark.findMany({
        where: {
          userId: session.user.id,
          reelId: { in: reelIds }
        },
        select: { reelId: true }
      })
      const bookmarkedIds = new Set(bookmarks.map(b => b.reelId))

      // Check likes
      const likes = await db.videoLike.findMany({
        where: {
          userId: session.user.id,
          reelId: { in: reelIds }
        },
        select: { reelId: true }
      })
      const likedIds = new Set(likes.map(l => l.reelId))

      // Add status to reels
      reels = reels.map(reel => ({
        ...reel,
        isFollowing: followingIds.has(reel.userId),
        isBookmarked: bookmarkedIds.has(reel.id),
        isLiked: likedIds.has(reel.id)
      }))
    } else {
      // Add default false values for unauthenticated users
      reels = reels.map(reel => ({
        ...reel,
        isFollowing: false,
        isBookmarked: false,
        isLiked: false
      }))
    }

    return NextResponse.json(reels)
  } catch (error) {
    console.error('Reels fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reels' },
      { status: 500 }
    )
  }
}
