import DatabaseService from './database';
import { v4 as uuidv4 } from 'uuid';

export class SeedData {
  private db = DatabaseService;

  async seed(): Promise<void> {
    const database = await this.db.getDatabase();

    // Create sample users
    const users = [
      {
        id: 'user-1',
        username: 'foodie_emma',
        displayName: 'Emma Rodriguez',
        bio: '👩‍🍳 Home chef | Recipe creator | Food lover',
        avatarUri: 'https://i.pravatar.cc/150?img=1',
        followersCount: 12500,
        followingCount: 450,
        createdAt: new Date('2024-01-15').toISOString(),
      },
      {
        id: 'user-2',
        username: 'chef_marco',
        displayName: 'Marco Bianchi',
        bio: '🍝 Italian cuisine specialist | Sharing family recipes',
        avatarUri: 'https://i.pravatar.cc/150?img=12',
        followersCount: 25000,
        followingCount: 320,
        createdAt: new Date('2023-11-20').toISOString(),
      },
      {
        id: 'user-3',
        username: 'healthy_sarah',
        displayName: 'Sarah Williams',
        bio: '🥗 Nutritionist | Healthy eating advocate | Plant-based recipes',
        avatarUri: 'https://i.pravatar.cc/150?img=5',
        followersCount: 8900,
        followingCount: 210,
        createdAt: new Date('2024-03-10').toISOString(),
      },
      {
        id: 'user-4',
        username: 'dessert_lover_anna',
        displayName: 'Anna Kim',
        bio: '🍰 Pastry chef | Sweet creations | Baking tutorials',
        avatarUri: 'https://i.pravatar.cc/150?img=9',
        followersCount: 18000,
        followingCount: 540,
        createdAt: new Date('2023-09-05').toISOString(),
      },
      {
        id: 'current-user',
        username: 'you',
        displayName: 'Your Name',
        bio: '🍳 Food enthusiast | Learning to cook',
        avatarUri: 'https://i.pravatar.cc/150?img=25',
        followersCount: 156,
        followingCount: 89,
        createdAt: new Date('2024-10-01').toISOString(),
      },
    ];

    for (const user of users) {
      await database.runAsync(
        `INSERT OR REPLACE INTO users (id, username, displayName, bio, avatarUri, followersCount, followingCount, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.displayName, user.bio, user.avatarUri, user.followersCount, user.followingCount, user.createdAt]
      );
    }

    // Create follows relationships
    const follows = [
      { followerId: 'current-user', followingId: 'user-1' },
      { followerId: 'current-user', followingId: 'user-2' },
      { followerId: 'current-user', followingId: 'user-3' },
      { followerId: 'user-1', followingId: 'current-user' },
      { followerId: 'user-2', followingId: 'current-user' },
    ];

    for (const follow of follows) {
      await database.runAsync(
        `INSERT OR REPLACE INTO follows (followerId, followingId, createdAt)
         VALUES (?, ?, ?)`,
        [follow.followerId, follow.followingId, new Date().toISOString()]
      );
    }

    // Create sample posts
    const posts = [
      {
        id: 'post-1',
        authorId: 'user-1',
        caption: '🍝 Homemade Carbonara! The secret is in the timing and using fresh eggs. This Roman classic never disappoints! #pasta #italianfood #carbonara',
        likesCount: 342,
        commentsCount: 28,
        createdAt: new Date('2024-11-03T10:30:00').toISOString(),
      },
      {
        id: 'post-2',
        authorId: 'user-2',
        caption: '🍕 Traditional Neapolitan Pizza from scratch! Made with love and a 72-hour fermented dough. Recipe coming soon! #pizza #foodporn #homemade',
        likesCount: 891,
        commentsCount: 67,
        createdAt: new Date('2024-11-02T15:20:00').toISOString(),
      },
      {
        id: 'post-3',
        authorId: 'user-3',
        caption: '🥗 Buddha Bowl packed with nutrients! Quinoa, roasted chickpeas, avocado, and tahini dressing. Perfect for meal prep! #healthyfood #vegan #buddhabowl',
        likesCount: 234,
        commentsCount: 19,
        createdAt: new Date('2024-11-01T09:15:00').toISOString(),
      },
      {
        id: 'post-4',
        authorId: 'user-4',
        caption: '🍰 Chocolate lava cake with a molten center! This dessert is always a crowd-pleaser. Swipe to see the flow! #dessert #chocolate #baking',
        likesCount: 567,
        commentsCount: 45,
        createdAt: new Date('2024-10-31T18:45:00').toISOString(),
      },
      {
        id: 'post-5',
        authorId: 'user-1',
        caption: '☕ Morning rituals: Fresh croissants and espresso. Sometimes simple is best! #breakfast #croissant #coffeetime',
        likesCount: 423,
        commentsCount: 31,
        createdAt: new Date('2024-10-30T08:00:00').toISOString(),
      },
      {
        id: 'post-6',
        authorId: 'user-3',
        caption: '🍜 Vegan Ramen with miso broth, tofu, and fresh vegetables. Comfort food that loves you back! #ramen #vegan #comfortfood',
        likesCount: 389,
        commentsCount: 24,
        createdAt: new Date('2024-10-29T19:30:00').toISOString(),
      },
    ];

    for (const post of posts) {
      await database.runAsync(
        `INSERT OR REPLACE INTO posts (id, authorId, caption, likesCount, commentsCount, createdAt, isArchived, uploadStatus)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'uploaded')`,
        [post.id, post.authorId, post.caption, post.likesCount, post.commentsCount, post.createdAt]
      );
    }

    // Create media for posts
    const mediaItems = [
      { id: uuidv4(), postId: 'post-1', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800', order: 0 },
      { id: uuidv4(), postId: 'post-2', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', order: 0 },
      { id: uuidv4(), postId: 'post-2', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', order: 1 },
      { id: uuidv4(), postId: 'post-3', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', order: 0 },
      { id: uuidv4(), postId: 'post-4', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800', order: 0 },
      { id: uuidv4(), postId: 'post-4', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800', order: 1 },
      { id: uuidv4(), postId: 'post-5', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800', order: 0 },
      { id: uuidv4(), postId: 'post-6', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', order: 0 },
    ];

    for (const media of mediaItems) {
      await database.runAsync(
        `INSERT OR REPLACE INTO media (id, postId, storyId, messageId, type, remoteUri, localUri, thumbnailUri, \`order\`)
         VALUES (?, ?, NULL, NULL, ?, ?, NULL, NULL, ?)`,
        [media.id, media.postId, media.type, media.remoteUri, media.order]
      );
    }

    // Create sample comments
    const comments = [
      { id: uuidv4(), postId: 'post-1', authorId: 'user-2', text: 'Looks delicious! 😍', likesCount: 12, createdAt: new Date('2024-11-03T11:00:00').toISOString() },
      { id: uuidv4(), postId: 'post-1', authorId: 'user-3', text: 'Can you share the recipe?', likesCount: 8, createdAt: new Date('2024-11-03T11:15:00').toISOString() },
      { id: uuidv4(), postId: 'post-2', authorId: 'user-1', text: 'That crust looks perfect! 🍕', likesCount: 23, createdAt: new Date('2024-11-02T16:00:00').toISOString() },
      { id: uuidv4(), postId: 'post-3', authorId: 'current-user', text: 'Made this today, so good!', likesCount: 5, createdAt: new Date('2024-11-01T12:00:00').toISOString() },
      { id: uuidv4(), postId: 'post-4', authorId: 'user-1', text: 'I need this in my life right now!', likesCount: 15, createdAt: new Date('2024-10-31T19:00:00').toISOString() },
    ];

    for (const comment of comments) {
      await database.runAsync(
        `INSERT OR REPLACE INTO comments (id, postId, storyId, authorId, text, likesCount, createdAt, replyToCommentId)
         VALUES (?, ?, NULL, ?, ?, ?, ?, NULL)`,
        [comment.id, comment.postId, comment.authorId, comment.text, comment.likesCount, comment.createdAt]
      );
    }

    // Create likes (current user likes some posts)
    const likes = [
      { userId: 'current-user', postId: 'post-1', commentId: null },
      { userId: 'current-user', postId: 'post-2', commentId: null },
      { userId: 'current-user', postId: 'post-3', commentId: null },
    ];

    for (const like of likes) {
      await database.runAsync(
        `INSERT OR REPLACE INTO likes (userId, postId, commentId, createdAt)
         VALUES (?, ?, ?, ?)`,
        [like.userId, like.postId, like.commentId, new Date().toISOString()]
      );
    }

    // Create saved posts
    await database.runAsync(
      `INSERT OR REPLACE INTO saved_posts (userId, postId, createdAt)
       VALUES (?, ?, ?)`,
      ['current-user', 'post-2', new Date().toISOString()]
    );

    // Create sample stories
    const stories = [
      { id: 'story-1', authorId: 'user-1', mediaId: uuidv4(), createdAt: new Date(Date.now() - 3600000).toISOString(), views: 234 },
      { id: 'story-2', authorId: 'user-2', mediaId: uuidv4(), createdAt: new Date(Date.now() - 7200000).toISOString(), views: 456 },
      { id: 'story-3', authorId: 'user-4', mediaId: uuidv4(), createdAt: new Date(Date.now() - 1800000).toISOString(), views: 189 },
    ];

    for (const story of stories) {
      const expiresAt = new Date(new Date(story.createdAt).getTime() + 24 * 3600000).toISOString();
      await database.runAsync(
        `INSERT OR REPLACE INTO stories (id, authorId, mediaId, createdAt, expiresAt, views, repliesCount, isHighlighted, uploadStatus)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'uploaded')`,
        [story.id, story.authorId, story.mediaId, story.createdAt, expiresAt, story.views]
      );

      // Add media for story
      await database.runAsync(
        `INSERT OR REPLACE INTO media (id, postId, storyId, messageId, type, remoteUri, \`order\`)
         VALUES (?, NULL, ?, NULL, 'image', ?, 0)`,
        [story.mediaId, story.id, `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=800`]
      );
    }

    // Create sample conversations
    const conversations = [
      { id: 'conv-1', participantIds: 'current-user,user-1', unreadCount: 2, updatedAt: new Date().toISOString() },
      { id: 'conv-2', participantIds: 'current-user,user-2', unreadCount: 0, updatedAt: new Date(Date.now() - 3600000).toISOString() },
    ];

    for (const conv of conversations) {
      await database.runAsync(
        `INSERT OR REPLACE INTO conversations (id, participantIds, unreadCount, updatedAt, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [conv.id, conv.participantIds, conv.unreadCount, conv.updatedAt, new Date('2024-10-20').toISOString()]
      );
    }

    // Create sample messages
    const messages = [
      { id: uuidv4(), conversationId: 'conv-1', senderId: 'user-1', text: 'Hey! Loved your latest recipe post!', status: 'read', createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: uuidv4(), conversationId: 'conv-1', senderId: 'current-user', text: 'Thanks so much! 😊', status: 'read', createdAt: new Date(Date.now() - 7000000).toISOString() },
      { id: uuidv4(), conversationId: 'conv-1', senderId: 'user-1', text: 'Can you share the measurements?', status: 'delivered', createdAt: new Date(Date.now() - 1800000).toISOString() },
      { id: uuidv4(), conversationId: 'conv-2', senderId: 'current-user', text: 'Your pizza dough recipe is amazing!', status: 'read', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: uuidv4(), conversationId: 'conv-2', senderId: 'user-2', text: 'Thank you! Glad you liked it 🍕', status: 'read', createdAt: new Date(Date.now() - 82800000).toISOString() },
    ];

    for (const message of messages) {
      await database.runAsync(
        `INSERT OR REPLACE INTO messages (id, conversationId, senderId, text, status, createdAt, replyToMessageId)
         VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        [message.id, message.conversationId, message.senderId, message.text, message.status, message.createdAt]
      );
    }

    // Create analytics events
    const analyticsEvents = [
      { id: uuidv4(), entityType: 'post', entityId: 'post-1', eventType: 'view', createdAt: new Date().toISOString() },
      { id: uuidv4(), entityType: 'post', entityId: 'post-1', eventType: 'like', createdAt: new Date().toISOString() },
      { id: uuidv4(), entityType: 'post', entityId: 'post-2', eventType: 'view', createdAt: new Date().toISOString() },
      { id: uuidv4(), entityType: 'post', entityId: 'post-2', eventType: 'save', createdAt: new Date().toISOString() },
    ];

    for (const event of analyticsEvents) {
      await database.runAsync(
        `INSERT OR REPLACE INTO analytics_events (id, entityType, entityId, eventType, userId, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [event.id, event.entityType, event.entityId, event.eventType, 'current-user', event.createdAt]
      );
    }

    console.log('✅ Database seeded successfully!');
  }

  async clearAndSeed(): Promise<void> {
    await this.db.clearDatabase();
    await this.seed();
  }
}

export default new SeedData();
