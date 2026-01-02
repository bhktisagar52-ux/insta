const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkReels() {
  console.log('Checking reels in database...')

  try {
    const reels = await prisma.reel.findMany({
      select: {
        id: true,
        videoUrl: true,
        thumbnailUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`Found ${reels.length} reels:`)
    reels.forEach((reel, index) => {
      console.log(`${index + 1}. ID: ${reel.id}`)
      console.log(`   Video URL: ${reel.videoUrl}`)
      console.log(`   Thumbnail URL: ${reel.thumbnailUrl || 'NULL'}`)
      console.log(`   Created: ${reel.createdAt}`)
      console.log('')
    })

  } catch (error) {
    console.error('Error checking reels:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkReels()
