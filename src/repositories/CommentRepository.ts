import { Comment } from '../models';
import DatabaseService from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export interface ICommentRepository {
  getPostComments(postId: string): Promise<Comment[]>;
  getStoryComments(storyId: string): Promise<Comment[]>;
  createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'likesCount'>): Promise<Comment>;
  updateComment(commentId: string, text: string): Promise<void>;
  deleteComment(commentId: string): Promise<void>;
  likeComment(userId: string, commentId: string): Promise<void>;
  unlikeComment(userId: string, commentId: string): Promise<void>;
}

export class CommentRepository implements ICommentRepository {
  private db = DatabaseService;

  async getPostComments(postId: string): Promise<Comment[]> {
    const database = await this.db.getDatabase();
    const results = await database.getAllAsync<any>(
      'SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC',
      [postId]
    );

    return results.map(this.mapToComment);
  }

  async getStoryComments(storyId: string): Promise<Comment[]> {
    const database = await this.db.getDatabase();
    const results = await database.getAllAsync<any>(
      'SELECT * FROM comments WHERE storyId = ? ORDER BY createdAt ASC',
      [storyId]
    );

    return results.map(this.mapToComment);
  }

  async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'likesCount'>): Promise<Comment> {
    const database = await this.db.getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await database.runAsync(
      `INSERT INTO comments (id, postId, storyId, authorId, text, likesCount, createdAt, replyToCommentId)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, comment.postId || null, comment.storyId || null, comment.authorId, comment.text, 
       createdAt, comment.replyToCommentId || null]
    );

    // Update comment count on post or story
    if (comment.postId) {
      await database.runAsync(
        'UPDATE posts SET commentsCount = commentsCount + 1 WHERE id = ?',
        [comment.postId]
      );
    } else if (comment.storyId) {
      await database.runAsync(
        'UPDATE stories SET repliesCount = repliesCount + 1 WHERE id = ?',
        [comment.storyId]
      );
    }

    return {
      id,
      ...comment,
      likesCount: 0,
      createdAt,
    };
  }

  async updateComment(commentId: string, text: string): Promise<void> {
    const database = await this.db.getDatabase();
    await database.runAsync(
      'UPDATE comments SET text = ?, updatedAt = ? WHERE id = ?',
      [text, new Date().toISOString(), commentId]
    );
  }

  async deleteComment(commentId: string): Promise<void> {
    const database = await this.db.getDatabase();
    
    // Get the comment to update counts
    const comment = await database.getFirstAsync<any>(
      'SELECT * FROM comments WHERE id = ?',
      [commentId]
    );

    if (comment) {
      // Update count on post or story
      if (comment.postId) {
        await database.runAsync(
          'UPDATE posts SET commentsCount = commentsCount - 1 WHERE id = ? AND commentsCount > 0',
          [comment.postId]
        );
      } else if (comment.storyId) {
        await database.runAsync(
          'UPDATE stories SET repliesCount = repliesCount - 1 WHERE id = ? AND repliesCount > 0',
          [comment.storyId]
        );
      }
    }

    // Delete likes on this comment
    await database.runAsync('DELETE FROM likes WHERE commentId = ?', [commentId]);
    
    // Delete the comment
    await database.runAsync('DELETE FROM comments WHERE id = ?', [commentId]);
  }

  async likeComment(userId: string, commentId: string): Promise<void> {
    const database = await this.db.getDatabase();
    
    await database.runAsync(
      `INSERT OR IGNORE INTO likes (userId, postId, commentId, createdAt)
       VALUES (?, NULL, ?, ?)`,
      [userId, commentId, new Date().toISOString()]
    );

    await database.runAsync(
      'UPDATE comments SET likesCount = likesCount + 1 WHERE id = ?',
      [commentId]
    );
  }

  async unlikeComment(userId: string, commentId: string): Promise<void> {
    const database = await this.db.getDatabase();
    
    await database.runAsync(
      'DELETE FROM likes WHERE userId = ? AND commentId = ?',
      [userId, commentId]
    );

    await database.runAsync(
      'UPDATE comments SET likesCount = likesCount - 1 WHERE id = ? AND likesCount > 0',
      [commentId]
    );
  }

  private mapToComment(row: any): Comment {
    return {
      id: row.id,
      postId: row.postId,
      storyId: row.storyId,
      authorId: row.authorId,
      text: row.text,
      likesCount: row.likesCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      replyToCommentId: row.replyToCommentId,
    };
  }
}
