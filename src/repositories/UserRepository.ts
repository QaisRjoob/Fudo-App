import { User } from '../models';
import DatabaseService from '../db/database';
import { AuthService } from '../services/AuthService';

export interface IUserRepository {
  getCurrentUser(): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  searchUsers(query: string): Promise<User[]>;
  followUser(userId: string, targetUserId: string): Promise<void>;
  unfollowUser(userId: string, targetUserId: string): Promise<void>;
  isFollowing(userId: string, targetUserId: string): Promise<boolean>;
  updateUser(user: Partial<User> & { id: string }): Promise<void>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
}

export class UserRepository implements IUserRepository {
  private db = DatabaseService;

  async getCurrentUser(): Promise<User | null> {
    // Get current authenticated user from AuthService
    const currentUser = await AuthService.getCurrentUser();
    return currentUser;
  }

  async getUserById(id: string): Promise<User | null> {
    // Get from database
    const user = await AuthService.getUserById(id);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const database = await this.db.getDatabase();
    const result = await database.getFirstAsync<any>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!result) return null;

    return this.mapToUser(result);
  }

  async searchUsers(query: string): Promise<User[]> {
    // Get all users from SQLite via AuthService
    const allUsers = await AuthService.getAllUsers();
    console.log(`[UserRepository] searchUsers: Found ${allUsers.length} total users in storage`);
    
    if (!query) {
      console.log(`[UserRepository] Returning all ${allUsers.length} users (no query filter)`);
      return allUsers;
    }
    
    // Filter by username or displayName
    const lowerQuery = query.toLowerCase();
    const filtered = allUsers.filter(user => 
      user.username?.toLowerCase().includes(lowerQuery) ||
      user.displayName?.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
    
    console.log(`[UserRepository] Filtered to ${filtered.length} users for query: "${query}"`);
    return filtered;
  }

  async followUser(userId: string, targetUserId: string): Promise<void> {
    // Use AuthService for SQLite-based follow tracking
    await AuthService.followUser(userId, targetUserId);
  }

  async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    // Use AuthService for SQLite-based follow tracking
    await AuthService.unfollowUser(userId, targetUserId);
  }

  async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
    // Use AuthService for SQLite-based follow tracking
    return await AuthService.isFollowing(userId, targetUserId);
  }

  async updateUser(user: Partial<User> & { id: string }): Promise<void> {
    const database = await this.db.getDatabase();
    
    const fields: string[] = [];
    const values: any[] = [];

    if (user.username !== undefined) {
      fields.push('username = ?');
      values.push(user.username);
    }
    if (user.displayName !== undefined) {
      fields.push('displayName = ?');
      values.push(user.displayName);
    }
    if (user.bio !== undefined) {
      fields.push('bio = ?');
      values.push(user.bio);
    }
    if (user.avatarUri !== undefined) {
      fields.push('avatarUri = ?');
      values.push(user.avatarUri);
    }

    if (fields.length === 0) return;

    values.push(user.id);

    await database.runAsync(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async getFollowers(userId: string): Promise<User[]> {
    // Get followers from database
    try {
      const database = await this.db.getDatabase();
      const results = await database.getAllAsync<{ followerId: string }>(
        'SELECT followerId FROM follows WHERE followingId = ?',
        [userId]
      );
      
      const users: User[] = [];
      for (const result of results) {
        const user = await AuthService.getUserById(result.followerId);
        if (user) {
          users.push(user);
        }
      }
      
      return users;
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  async getFollowing(userId: string): Promise<User[]> {
    try {
      const followingIds = await AuthService.getFollowing(userId);
      const users: User[] = [];
      
      for (const followingId of followingIds) {
        const user = await AuthService.getUserById(followingId);
        if (user) {
          users.push(user);
        }
      }
      
      return users;
    } catch (error) {
      console.error('Error getting following users:', error);
      return [];
    }
  }

  private mapToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      bio: row.bio,
      avatarUri: row.avatarUri,
      followersCount: row.followersCount ?? 0,
      followingCount: row.followingCount ?? 0,
      createdAt: row.createdAt,
    };
  }
}
