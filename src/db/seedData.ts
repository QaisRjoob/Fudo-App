import DatabaseService from './database';
import { v4 as uuidv4 } from 'uuid';

export class SeedData {
  private db = DatabaseService;
  private seeded = false;

  async seed(): Promise<void> {
    // Only seed once
    if (this.seeded) {
      console.log('[SeedData] Already seeded in this session');
      return;
    }

    const database = await this.db.getDatabase();

    // Check if posts already exist
    const postCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM posts'
    );
    
    if (postCount && postCount.count > 0) {
      console.log('[SeedData] Posts already exist, skipping seed');
      this.seeded = true;
      return;
    }

    console.log('[SeedData] Starting database seed...');

    // Create sample users (matching users from AuthService)
    const users = [
      {
        id: 'user_1',
        username: 'chef_alex',
        email: 'alex@example.com',
        password: 'password123',
        displayName: 'Chef Alex',
        bio: 'Passionate home chef 👨‍🍳 | Sharing family recipes',
        avatarUri: 'https://i.pravatar.cc/150?u=alex',
        followersCount: 1250,
        followingCount: 380,
        createdAt: new Date('2024-01-15').toISOString(),
      },
      {
        id: 'user_2',
        username: 'foodie_maria',
        email: 'maria@example.com',
        password: 'password123',
        displayName: 'Maria Garcia',
        bio: 'Food blogger 🍕 | Mediterranean cuisine lover',
        avatarUri: 'https://i.pravatar.cc/150?u=maria',
        followersCount: 890,
        followingCount: 520,
        createdAt: new Date('2024-02-20').toISOString(),
      },
      {
        id: 'user_3',
        username: 'baker_john',
        email: 'john@example.com',
        password: 'password123',
        displayName: 'John Baker',
        bio: 'Professional pastry chef 🧁 | Sweet creations daily',
        avatarUri: 'https://i.pravatar.cc/150?u=john',
        followersCount: 2100,
        followingCount: 145,
        createdAt: new Date('2023-11-10').toISOString(),
      },
      {
        id: 'user_4',
        username: 'healthy_sarah',
        email: 'sarah@example.com',
        password: 'password123',
        displayName: 'Sarah Johnson',
        bio: 'Healthy eating advocate 🥗 | Plant-based recipes',
        avatarUri: 'https://i.pravatar.cc/150?u=sarah',
        followersCount: 1580,
        followingCount: 290,
        createdAt: new Date('2024-03-10').toISOString(),
      },
      {
        id: 'user_5',
        username: 'spicy_chef',
        email: 'mike@example.com',
        password: 'password123',
        displayName: 'Mike Chen',
        bio: 'Asian fusion expert 🌶️ | Spicy food enthusiast',
        avatarUri: 'https://i.pravatar.cc/150?u=mike',
        followersCount: 3200,
        followingCount: 180,
        createdAt: new Date('2024-04-05').toISOString(),
      },
      {
        id: 'user_6',
        username: 'italian_mama',
        email: 'giulia@example.com',
        password: 'password123',
        displayName: 'Giulia Rossi',
        bio: 'Traditional Italian cooking 🍝 | Nonna\'s recipes',
        avatarUri: 'https://i.pravatar.cc/150?u=giulia',
        followersCount: 2750,
        followingCount: 320,
        createdAt: new Date('2024-01-28').toISOString(),
      },
      {
        id: 'user_7',
        username: 'dessert_queen',
        email: 'emily@example.com',
        password: 'password123',
        displayName: 'Emily Brown',
        bio: 'Dessert lover 🍰 | Sweet tooth adventures',
        avatarUri: 'https://i.pravatar.cc/150?u=emily',
        followersCount: 1920,
        followingCount: 450,
        createdAt: new Date('2024-02-14').toISOString(),
      },
      {
        id: 'user_8',
        username: 'grill_master',
        email: 'david@example.com',
        password: 'password123',
        displayName: 'David Martinez',
        bio: 'BBQ enthusiast 🔥 | Grill master tips & tricks',
        avatarUri: 'https://i.pravatar.cc/150?u=david',
        followersCount: 2890,
        followingCount: 210,
        createdAt: new Date('2024-03-22').toISOString(),
      },
    ];

    for (const user of users) {
      await database.runAsync(
        `INSERT OR REPLACE INTO users (id, username, email, password, displayName, bio, avatarUri, followersCount, followingCount, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.email, user.password, user.displayName, user.bio, user.avatarUri, user.followersCount, user.followingCount, user.createdAt]
      );
    }
    
    console.log('[SeedData] Inserted users into database');

    console.log('[SeedData] Inserted users into database');

    // No need to get current user from AsyncStorage anymore
    // Sample follows relationships between existing users
    const follows = [
      // Users following each other
      { followerId: 'user_1', followingId: 'user_2' },
      { followerId: 'user_2', followingId: 'user_1' },
      { followerId: 'user_3', followingId: 'user_4' },
      { followerId: 'user_4', followingId: 'user_3' },
      { followerId: 'user_5', followingId: 'user_6' },
      { followerId: 'user_6', followingId: 'user_5' },
      { followerId: 'user_1', followingId: 'user_3' },
      { followerId: 'user_2', followingId: 'user_4' },
    ];

    for (const follow of follows) {
      await database.runAsync(
        `INSERT OR REPLACE INTO follows (followerId, followingId, createdAt)
         VALUES (?, ?, ?)`,
        [follow.followerId, follow.followingId, new Date().toISOString()]
      );
    }
    
    console.log('[SeedData] Inserted follow relationships');

    // Create sample posts
    const posts = [
      {
        id: 'post_1',
        authorId: 'user_1',
        caption: '🍝 Homemade Carbonara! The secret is in the timing and using fresh eggs. This Roman classic never disappoints! #pasta #italianfood #carbonara',
        likesCount: 342,
        commentsCount: 28,
        createdAt: new Date('2024-11-03T10:30:00').toISOString(),
      },
      {
        id: 'post_2',
        authorId: 'user_2',
        caption: '🍕 Traditional Neapolitan Pizza from scratch! Made with love and a 72-hour fermented dough. Recipe coming soon! #pizza #foodporn #homemade',
        likesCount: 891,
        commentsCount: 67,
        createdAt: new Date('2024-11-02T15:20:00').toISOString(),
      },
      {
        id: 'post_3',
        authorId: 'user_3',
        caption: '🥗 Buddha Bowl packed with nutrients! Quinoa, roasted chickpeas, avocado, and tahini dressing. Perfect for meal prep! #healthyfood #vegan #buddhabowl',
        likesCount: 234,
        commentsCount: 19,
        createdAt: new Date('2024-11-01T09:15:00').toISOString(),
      },
      {
        id: 'post_4',
        authorId: 'user_4',
        caption: '🍰 Chocolate lava cake with a molten center! This dessert is always a crowd-pleaser. Swipe to see the flow! #dessert #chocolate #baking',
        likesCount: 567,
        commentsCount: 45,
        createdAt: new Date('2024-10-31T18:45:00').toISOString(),
      },
      {
        id: 'post_5',
        authorId: 'user_5',
        caption: '🌶️ Spicy Thai Curry that will blow your mind! Perfect balance of heat and flavor. #thaifood #curry #spicy',
        likesCount: 423,
        commentsCount: 31,
        createdAt: new Date('2024-10-30T08:00:00').toISOString(),
      },
      {
        id: 'post_6',
        authorId: 'user_6',
        caption: '🍝 Nonna\'s authentic Bolognese sauce. Slow-cooked for 4 hours with love! #italian #pasta #bolognese',
        likesCount: 389,
        commentsCount: 24,
        createdAt: new Date('2024-10-29T19:30:00').toISOString(),
      },
      {
        id: 'post_7',
        authorId: 'user_7',
        caption: '🍰 Fresh strawberry cheesecake! No-bake and absolutely divine. Perfect for summer! #dessert #cheesecake #nobake',
        likesCount: 512,
        commentsCount: 38,
        createdAt: new Date('2024-10-28T14:20:00').toISOString(),
      },
      {
        id: 'post_8',
        authorId: 'user_8',
        caption: '🔥 BBQ ribs with homemade dry rub. Fall-off-the-bone tender! #bbq #ribs #grilling',
        likesCount: 678,
        commentsCount: 52,
        createdAt: new Date('2024-10-27T17:45:00').toISOString(),
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
      { id: uuidv4(), postId: 'post_1', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800', order: 0 },
      { id: uuidv4(), postId: 'post_2', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', order: 0 },
      { id: uuidv4(), postId: 'post_2', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', order: 1 },
      { id: uuidv4(), postId: 'post_3', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', order: 0 },
      { id: uuidv4(), postId: 'post_4', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800', order: 0 },
      { id: uuidv4(), postId: 'post_4', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800', order: 1 },
      { id: uuidv4(), postId: 'post_5', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800', order: 0 },
      { id: uuidv4(), postId: 'post_6', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800', order: 0 },
      { id: uuidv4(), postId: 'post_7', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=800', order: 0 },
      { id: uuidv4(), postId: 'post_8', type: 'image', remoteUri: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', order: 0 },
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
      { id: uuidv4(), postId: 'post_1', authorId: 'user_2', text: 'Looks delicious! 😍', likesCount: 12, createdAt: new Date('2024-11-03T11:00:00').toISOString() },
      { id: uuidv4(), postId: 'post_1', authorId: 'user_3', text: 'Can you share the recipe?', likesCount: 8, createdAt: new Date('2024-11-03T11:15:00').toISOString() },
      { id: uuidv4(), postId: 'post_2', authorId: 'user_1', text: 'That crust looks perfect! 🍕', likesCount: 23, createdAt: new Date('2024-11-02T16:00:00').toISOString() },
      { id: uuidv4(), postId: 'post_3', authorId: 'user_4', text: 'Made this today, so good!', likesCount: 5, createdAt: new Date('2024-11-01T12:00:00').toISOString() },
      { id: uuidv4(), postId: 'post_4', authorId: 'user_1', text: 'I need this in my life right now!', likesCount: 15, createdAt: new Date('2024-10-31T19:00:00').toISOString() },
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

    // Create sample stories (for users with hasStory: true)
    const stories = [
      { id: 'story_1', authorId: 'user_1', mediaId: uuidv4(), createdAt: new Date(Date.now() - 3600000).toISOString(), views: 234 },
      { id: 'story_2', authorId: 'user_3', mediaId: uuidv4(), createdAt: new Date(Date.now() - 7200000).toISOString(), views: 456 },
      { id: 'story_3', authorId: 'user_4', mediaId: uuidv4(), createdAt: new Date(Date.now() - 1800000).toISOString(), views: 189 },
      { id: 'story_4', authorId: 'user_6', mediaId: uuidv4(), createdAt: new Date(Date.now() - 5400000).toISOString(), views: 312 },
      { id: 'story_5', authorId: 'user_8', mediaId: uuidv4(), createdAt: new Date(Date.now() - 2700000).toISOString(), views: 267 },
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
        [event.id, event.entityType, event.entityId, event.eventType, 'user_1', event.createdAt]
      );
    }

    this.seeded = true;
    console.log('✅ [SeedData] Database seeded successfully!');
  }

  async clearAndSeed(): Promise<void> {
    await this.db.clearDatabase();
    await this.seed();
  }
}

export default new SeedData();
