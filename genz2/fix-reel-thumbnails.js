const { PrismaClient } = require('@prisma/client')
const { cloudinary } = require('./src/lib/cloudinary')

const prisma = new PrismaClient()

async function fixReelThumbnails() {
  console.log('Starting thumbnail fix for existing reels...')

  try {
    // Find all reels without thumbnailUrl
    const reelsWithoutThumbnails = await prisma.reel.findMany({
      where: {
        thumbnailUrl: null
      },
      select: {
        id: true,
        videoUrl: true,
        userId: true
      }
    })

    console.log(`Found ${reelsWithoutThumbnails.length} reels without thumbnails`)

    let successCount = 0
    let errorCount = 0

    for (const reel of reelsWithoutThumbnails) {
      try {
        console.log(`Processing reel ${reel.id}...`)

        // Extract publicId from videoUrl
        // Cloudinary URLs are like: https://res.cloudinary.com/{cloud_name}/video/upload/v{version}/{public_id}.{format}
        const urlParts = reel.videoUrl.split('/')
        const publicIdWithExt = urlParts[urlParts.length - 1]
        const publicId = publicIdWithExt.split('.')[0] // Remove extension

        console.log(`Generating thumbnail for public_id: ${publicId}`)

        // Generate thumbnail using Cloudinary explicit transformation
        const thumbnailResult = await cloudinary.uploader.explicit(publicId, {
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
          const thumbnailUrl = thumbnailResult.eager[0].secure_url

          // Update reel with thumbnail URL
          await prisma.reel.update({
            where: { id: reel.id },
            data: { thumbnailUrl }
          })

          console.log(`✅ Updated reel ${reel.id} with thumbnail: ${thumbnailUrl}`)
          successCount++
        } else {
          console.log(`❌ No thumbnail generated for reel ${reel.id}`)
          errorCount++
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ Error processing reel ${reel.id}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n🎉 Thumbnail fix completed!`)
    console.log(`✅ Successfully updated: ${successCount} reels`)
    console.log(`❌ Errors: ${errorCount} reels`)

  } catch (error) {
    console.error('Script error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixReelThumbnails()
  .then(() => {
    console.log('Script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
