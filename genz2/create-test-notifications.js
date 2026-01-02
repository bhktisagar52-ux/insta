const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestNotifications() {
  try {
    // Get the test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      console.log('Test user not found. Run seed-test-user.js first.');
      return;
    }

    // Create comprehensive test notifications for all types
    const notifications = [
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'like',
        postId: 'cmjpkioxr0002u9woa8cz9usa',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'reel_like',
        reelId: 'cmjp4p5t2000au92sg6o67viv',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'story_like',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'comment',
        postId: 'cmjpkioxr0002u9woa8cz9usa',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'reel_comment',
        reelId: 'cmjp4p5t2000au92sg6o67viv',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'reply',
        postId: 'cmjpkioxr0002u9woa8cz9usa',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'reel_reply',
        reelId: 'cmjp4p5t2000au92sg6o67viv',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'story_reply',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'follow',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'unfollow',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'mention',
        postId: 'cmjpkioxr0002u9woa8cz9usa',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'tag',
        postId: 'cmjpkioxr0002u9woa8cz9usa',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'share',
        postId: 'cmjpkioxr0002u9woa8cz9usa',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'save',
        postId: 'cmjpkioxr0002u9woa8cz9usa',
        read: false
      },
      {
        userId: testUser.id,
        actorId: testUser.id,
        type: 'story_view',
        read: false
      }
    ];

    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification
      });
    }

    console.log('Test notifications created successfully!');
    console.log(`Created ${notifications.length} notifications for user: ${testUser.username}`);
    console.log('Notification types created:', notifications.map(n => n.type).join(', '));

  } catch (error) {
    console.error('Error creating test notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotifications();
