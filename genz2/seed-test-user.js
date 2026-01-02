const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123', // In a real app, this would be hashed
        name: 'Test User',
        bio: 'This is a test user for development',
      },
    });

    console.log('Test user created:', testUser);

    // Create a test reel for commenting
    const testReel = await prisma.reel.upsert({
      where: { id: 'cmjp4p5t2000au92sg6o67viv' }, // Use the ID from the error
      update: {},
      create: {
        id: 'cmjp4p5t2000au92sg6o67viv',
        userId: testUser.id,
        videoUrl: 'https://example.com/test-video.mp4',
        thumbnailUrl: 'https://example.com/test-thumbnail.jpg',
        caption: 'Test reel for commenting',
        duration: 30,
        width: 1080,
        height: 1920,
        allowComments: true,
      },
    });

    console.log('Test reel created:', testReel);

    // Create a test post
    const testPost = await prisma.post.create({
      data: {
        userId: testUser.id,
        imageUrl: 'https://example.com/test-image.jpg',
        caption: 'Test post for commenting',
      },
    });

    console.log('Test post created:', testPost);

    // Create a comment on the post
    const testComment = await prisma.comment.create({
      data: {
        userId: testUser.id,
        postId: testPost.id,
        content: 'This is a test comment on the post!',
      },
    });

    console.log('Test comment created:', testComment);

    // Create a comment on the reel
    const reelComment = await prisma.videoComment.create({
      data: {
        userId: testUser.id,
        reelId: testReel.id,
        content: 'This is a test comment on the reel!',
      },
    });

    console.log('Test reel comment created:', reelComment);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
