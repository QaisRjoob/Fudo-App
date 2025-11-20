import { Post, MediaItem } from '../models';
import DatabaseService from '../db/database';
import { AuthService } from '../services/AuthService';
import { v4 as uuidv4 } from 'uuid';

export interface IPostRepository {
  getFeed(userId: string, cursor?: string, limit?: number): Promise<Post[]>;
  getPostById(postId: string): Promise<Post | null>;
  getUserPosts(userId: string): Promise<Post[]>;
  createPost(post: Omit<Post, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>): Promise<Post>;
  updatePost(postId: string, updates: Partial<Post>): Promise<void>;
  deletePost(postId: string): Promise<void>;
  archivePost(postId: string): Promise<void>;
  unarchivePost(postId: string): Promise<void>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  savePost(userId: string, postId: string): Promise<void>;
  unsavePost(userId: string, postId: string): Promise<void>;
  getSavedPosts(userId: string): Promise<Post[]>;
  isPostLiked(userId: string, postId: string): Promise<boolean>;
  isPostSaved(userId: string, postId: string): Promise<boolean>;
}

export class PostRepository implements IPostRepository {
  private db = DatabaseService;

  async getFeed(userId: string, cursor?: string, limit: number = 20): Promise<Post[]> {
    const database = await this.db.getDatabase();
    
    console.log('[PostRepository] getFeed called for userId:', userId);
    
    // Get list of users the current user is following from SQLite
    const followingIds = await AuthService.getFollowing(userId);
    console.log('[PostRepository] User is following:', followingIds.length, 'users', followingIds);
    
    // Include the user's own posts
    const authorIds = [...followingIds, userId];
    console.log('[PostRepository] Will fetch posts from authors:', authorIds);
    
    if (authorIds.length === 0) {
      console.log('[PostRepository] No authors to fetch posts from');
      return [];
    }
    
    // Create placeholders for SQL IN clause
    const placeholders = authorIds.map(() => '?').join(',');
    
    let query = `
      SELECT p.* FROM posts p
      WHERE p.authorId IN (${placeholders}) AND p.isArchived = 0
    `;
    const params: any[] = [...authorIds];

    if (cursor) {
      query += ' AND p.createdAt < ?';
      params.push(cursor);
    }

    query += ' ORDER BY p.createdAt DESC LIMIT ?';
    params.push(limit);

    console.log('[PostRepository] Executing query:', query);
    console.log('[PostRepository] Query params:', params);
    const results = await database.getAllAsync<any>(query, params);
    console.log('[PostRepository] Found', results.length, 'posts in database');
    
    const posts = await Promise.all(
      results.map(async (row) => await this.mapToPost(row, userId))
    );

    return posts;
  }

  async getPostById(postId: string): Promise<Post | null> {
    const database = await this.db.getDatabase();
    const result = await database.getFirstAsync<any>(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );

    if (!result) return null;

    return this.mapToPost(result);
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const database = await this.db.getDatabase();
    const results = await database.getAllAsync<any>(
      'SELECT * FROM posts WHERE authorId = ? AND isArchived = 0 ORDER BY createdAt DESC',
      [userId]
    );

    return Promise.all(results.map(async (row) => await this.mapToPost(row, userId)));
  }

  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>): Promise<Post> {
    const database = await this.db.getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await database.runAsync(
      `INSERT INTO posts (id, authorId, caption, likesCount, commentsCount, createdAt, isArchived, uploadStatus)
       VALUES (?, ?, ?, 0, 0, ?, 0, ?)`,
      [id, post.authorId, post.caption || null, createdAt, post.uploadStatus || 'pending']
    );

    // Insert media items
    for (let i = 0; i < post.media.length; i++) {
      const media = post.media[i];
      await database.runAsync(
        `INSERT INTO media (id, postId, type, remoteUri, localUri, thumbnailUri, \`order\`, width, height)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [media.id || uuidv4(), id, media.type, media.remoteUri || null, media.localUri || null, 
         media.thumbnailUri || null, i, media.width || null, media.height || null]
      );
    }

    const createdPost = await this.getPostById(id);
    return createdPost!;
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<void> {
    const database = await this.db.getDatabase();
    
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.caption !== undefined) {
      fields.push('caption = ?');
      values.push(updates.caption);
    }
    if (updates.uploadStatus !== undefined) {
      fields.push('uploadStatus = ?');
      values.push(updates.uploadStatus);
    }
    if (updates.isArchived !== undefined) {
      fields.push('isArchived = ?');
      values.push(updates.isArchived ? 1 : 0);
    }

    if (fields.length === 0) return;

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(postId);

    await database.runAsync(
      `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deletePost(postId: string): Promise<void> {
    const database = await this.db.getDatabase();
    
    // Delete associated media
    await database.runAsync('DELETE FROM media WHERE postId = ?', [postId]);
    
    // Delete associated comments
    await database.runAsync('DELETE FROM comments WHERE postId = ?', [postId]);
    
    // Delete likes
    await database.runAsync('DELETE FROM likes WHERE postId = ?', [postId]);
    
    // Delete saved references
    await database.runAsync('DELETE FROM saved_posts WHERE postId = ?', [postId]);
    
    // Delete the post
    await database.runAsync('DELETE FROM posts WHERE id = ?', [postId]);
  }

  async archivePost(postId: string): Promise<void> {
    const database = await this.db.getDatabase();
    await database.runAsync(
      'UPDATE posts SET isArchived = 1 WHERE id = ?',
      [postId]
    );
  }

  async unarchivePost(postId: string): Promise<void> {
    const database = await this.db.getDatabase();
    await database.runAsync(
      'UPDATE posts SET isArchived = 0 WHERE id = ?',
      [postId]
    );
  }

  async likePost(userId: string, postId: string): Promise<void> {
    const database = await this.db.getDatabase();
    
    await database.runAsync(
      `INSERT OR IGNORE INTO likes (userId, postId, commentId, createdAt)
       VALUES (?, ?, NULL, ?)`,
      [userId, postId, new Date().toISOString()]
    );

    await database.runAsync(
      'UPDATE posts SET likesCount = likesCount + 1 WHERE id = ?',
      [postId]
    );
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    const database = await this.db.getDatabase();
    
    await database.runAsync(
      'DELETE FROM likes WHERE userId = ? AND postId = ?',
      [userId, postId]
    );

    await database.runAsync(
      'UPDATE posts SET likesCount = likesCount - 1 WHERE id = ? AND likesCount > 0',
      [postId]
    );
  }

  async savePost(userId: string, postId: string): Promise<void> {
    const database = await this.db.getDatabase();
    
    await database.runAsync(
      `INSERT OR IGNORE INTO saved_posts (userId, postId, createdAt)
       VALUES (?, ?, ?)`,
      [userId, postId, new Date().toISOString()]
    );
  }

  async unsavePost(userId: string, postId: string): Promise<void> {
    const database = await this.db.getDatabase();
    
    await database.runAsync(
      'DELETE FROM saved_posts WHERE userId = ? AND postId = ?',
      [userId, postId]
    );
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    const database = await this.db.getDatabase();
    const results = await database.getAllAsync<any>(
      `SELECT p.* FROM posts p
       INNER JOIN saved_posts sp ON p.id = sp.postId
       WHERE sp.userId = ?
       ORDER BY sp.createdAt DESC`,
      [userId]
    );

    return Promise.all(results.map(async (row) => await this.mapToPost(row, userId)));
  }

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    const database = await this.db.getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM likes WHERE userId = ? AND postId = ?',
      [userId, postId]
    );

    return (result?.count ?? 0) > 0;
  }

  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    const database = await this.db.getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM saved_posts WHERE userId = ? AND postId = ?',
      [userId, postId]
    );

    return (result?.count ?? 0) > 0;
  }

  private async mapToPost(row: any, userId?: string): Promise<Post> {
    const database = await this.db.getDatabase();
    
    // Get media items
    const mediaResults = await database.getAllAsync<any>(
      'SELECT * FROM media WHERE postId = ? ORDER BY `order` ASC',
      [row.id]
    );

    const media: MediaItem[] = mediaResults.map(m => ({
      id: m.id,
      type: m.type,
      remoteUri: m.remoteUri,
      localUri: m.localUri,
      thumbnailUri: m.thumbnailUri,
      order: m.order,
      width: m.width,
      height: m.height,
    }));

    const post: Post = {
      id: row.id,
      authorId: row.authorId,
      caption: row.caption,
      media,
      likesCount: row.likesCount ?? 0,
      commentsCount: row.commentsCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isArchived: row.isArchived === 1,
      uploadStatus: row.uploadStatus,
    };

    if (userId) {
      post.isLiked = await this.isPostLiked(userId, row.id);
      post.isSaved = await this.isPostSaved(userId, row.id);
    }

    return post;
  }
}
