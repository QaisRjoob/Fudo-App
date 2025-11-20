import * as SQLite from 'expo-sqlite';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initializeDatabase(): Promise<void> {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('fudo.db');
    await this.createTables();
  }

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initializeDatabase();
    }
    return this.db!;
  }

  private async createTables(): Promise<void> {
    const db = await this.getDatabase();

    // Users table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        displayName TEXT,
        bio TEXT,
        avatarUri TEXT,
        followersCount INTEGER DEFAULT 0,
        followingCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );
    `);

    // Posts table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        authorId TEXT NOT NULL,
        caption TEXT,
        likesCount INTEGER DEFAULT 0,
        commentsCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        isArchived INTEGER DEFAULT 0,
        uploadStatus TEXT DEFAULT 'uploaded',
        FOREIGN KEY (authorId) REFERENCES users(id)
      );
    `);

    // Media table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        postId TEXT,
        storyId TEXT,
        messageId TEXT,
        type TEXT NOT NULL,
        remoteUri TEXT,
        localUri TEXT,
        thumbnailUri TEXT,
        \`order\` INTEGER DEFAULT 0,
        width INTEGER,
        height INTEGER,
        FOREIGN KEY (postId) REFERENCES posts(id),
        FOREIGN KEY (storyId) REFERENCES stories(id),
        FOREIGN KEY (messageId) REFERENCES messages(id)
      );
    `);

    // Comments table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        postId TEXT,
        storyId TEXT,
        authorId TEXT NOT NULL,
        text TEXT NOT NULL,
        likesCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        replyToCommentId TEXT,
        FOREIGN KEY (postId) REFERENCES posts(id),
        FOREIGN KEY (storyId) REFERENCES stories(id),
        FOREIGN KEY (authorId) REFERENCES users(id),
        FOREIGN KEY (replyToCommentId) REFERENCES comments(id)
      );
    `);

    // Stories table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        authorId TEXT NOT NULL,
        mediaId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        expiresAt TEXT,
        views INTEGER DEFAULT 0,
        repliesCount INTEGER DEFAULT 0,
        isHighlighted INTEGER DEFAULT 0,
        highlightId TEXT,
        uploadStatus TEXT DEFAULT 'uploaded',
        FOREIGN KEY (authorId) REFERENCES users(id)
      );
    `);

    // Story Highlights table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS story_highlights (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        coverUri TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    // Conversations table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        participantIds TEXT NOT NULL,
        unreadCount INTEGER DEFAULT 0,
        updatedAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // Messages table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        text TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        editedAt TEXT,
        replyToMessageId TEXT,
        FOREIGN KEY (conversationId) REFERENCES conversations(id),
        FOREIGN KEY (senderId) REFERENCES users(id),
        FOREIGN KEY (replyToMessageId) REFERENCES messages(id)
      );
    `);

    // Follows table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS follows (
        followerId TEXT NOT NULL,
        followingId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (followerId, followingId),
        FOREIGN KEY (followerId) REFERENCES users(id),
        FOREIGN KEY (followingId) REFERENCES users(id)
      );
    `);

    // Likes table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS likes (
        userId TEXT NOT NULL,
        postId TEXT,
        commentId TEXT,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (userId, postId, commentId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (postId) REFERENCES posts(id),
        FOREIGN KEY (commentId) REFERENCES comments(id)
      );
    `);

    // Saved posts table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS saved_posts (
        userId TEXT NOT NULL,
        postId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (userId, postId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (postId) REFERENCES posts(id)
      );
    `);

    // Analytics events table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id TEXT PRIMARY KEY,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        eventType TEXT NOT NULL,
        userId TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    // User settings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        userId TEXT PRIMARY KEY,
        notificationsEnabled INTEGER DEFAULT 1,
        privateAccount INTEGER DEFAULT 0,
        showActivityStatus INTEGER DEFAULT 1,
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    // Create indexes for better query performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_posts_authorId ON posts(authorId);
      CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_media_postId ON media(postId);
      CREATE INDEX IF NOT EXISTS idx_media_storyId ON media(storyId);
      CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);
      CREATE INDEX IF NOT EXISTS idx_comments_storyId ON comments(storyId);
      CREATE INDEX IF NOT EXISTS idx_stories_authorId ON stories(authorId);
      CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId);
      CREATE INDEX IF NOT EXISTS idx_follows_followerId ON follows(followerId);
      CREATE INDEX IF NOT EXISTS idx_follows_followingId ON follows(followingId);
      CREATE INDEX IF NOT EXISTS idx_analytics_entityId ON analytics_events(entityId);
    `);
  }

  async clearDatabase(): Promise<void> {
    const db = await this.getDatabase();
    
    await db.execAsync(`
      DROP TABLE IF EXISTS user_settings;
      DROP TABLE IF EXISTS analytics_events;
      DROP TABLE IF EXISTS saved_posts;
      DROP TABLE IF EXISTS likes;
      DROP TABLE IF EXISTS follows;
      DROP TABLE IF EXISTS messages;
      DROP TABLE IF EXISTS conversations;
      DROP TABLE IF EXISTS story_highlights;
      DROP TABLE IF EXISTS stories;
      DROP TABLE IF EXISTS comments;
      DROP TABLE IF EXISTS media;
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;
    `);

    await this.createTables();
  }
}

export default DatabaseService.getInstance();
