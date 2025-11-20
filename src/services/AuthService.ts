import DatabaseService from '../db/database';
import { User } from '../models/User';

// In-memory session storage (persists only during app runtime)
let currentAuthToken: string | null = null;
let currentUserId: string | null = null;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export class AuthService {
  private static db = DatabaseService;

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    return currentAuthToken !== null && currentUserId !== null;
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    if (!currentUserId) return null;
    
    try {
      const database = await this.db.getDatabase();
      const result = await database.getFirstAsync<any>(
        'SELECT * FROM users WHERE id = ?',
        [currentUserId]
      );

      if (!result) return null;

      return this.mapToUser(result);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Login
  static async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const database = await this.db.getDatabase();
      
      // Find user by email
      const result = await database.getFirstAsync<any>(
        'SELECT * FROM users WHERE email = ?',
        [credentials.email]
      );

      if (!result) {
        return { success: false, error: 'User not found' };
      }

      // Check password (in real app, this would be hashed)
      if (result.password !== credentials.password) {
        return { success: false, error: 'Invalid password' };
      }

      // Generate token and set session
      currentAuthToken = `token_${result.id}_${Date.now()}`;
      currentUserId = result.id;

      const user = this.mapToUser(result);
      console.log('[AuthService] User logged in:', user.username);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Signup
  static async signup(data: SignupData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const database = await this.db.getDatabase();

      // Check if email or username already exists
      const emailCheck = await database.getFirstAsync<any>(
        'SELECT id FROM users WHERE email = ?',
        [data.email]
      );
      
      if (emailCheck) {
        return { success: false, error: 'Email already exists' };
      }

      const usernameCheck = await database.getFirstAsync<any>(
        'SELECT id FROM users WHERE username = ?',
        [data.username]
      );

      if (usernameCheck) {
        return { success: false, error: 'Username already taken' };
      }

      // Create new user
      const userId = `user_${Date.now()}`;
      const avatarUri = `https://i.pravatar.cc/150?u=${data.username}`;
      const createdAt = new Date().toISOString();

      await database.runAsync(
        `INSERT INTO users (id, username, email, password, displayName, bio, avatarUri, followersCount, followingCount, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
        [userId, data.username, data.email, data.password, data.displayName, '', avatarUri, createdAt]
      );

      // Auto login
      currentAuthToken = `token_${userId}_${Date.now()}`;
      currentUserId = userId;

      const newUser: User = {
        id: userId,
        username: data.username,
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        bio: '',
        avatarUri,
        profilePicture: avatarUri,
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
        isPrivate: false,
        isBlocked: false,
        hasStory: false,
        createdAt: new Date(createdAt),
      };

      console.log('[AuthService] New user signed up:', newUser.username);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed' };
    }
  }

  // Logout
  static async logout(): Promise<void> {
    currentAuthToken = null;
    currentUserId = null;
    console.log('[AuthService] User logged out');
  }

  // Update user profile
  static async updateProfile(user: User): Promise<boolean> {
    try {
      const database = await this.db.getDatabase();
      
      await database.runAsync(
        `UPDATE users SET username = ?, displayName = ?, bio = ?, avatarUri = ?
         WHERE id = ?`,
        [user.username || '', user.displayName || '', user.bio || '', user.avatarUri || '', user.id]
      );

      console.log('[AuthService] Profile updated for user:', user.username);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  }

  // Get all users (for browsing profiles)
  static async getAllUsers(): Promise<User[]> {
    try {
      const database = await this.db.getDatabase();
      const results = await database.getAllAsync<any>('SELECT * FROM users');
      
      console.log(`[AuthService] getAllUsers: Found ${results.length} users in SQLite`);
      
      if (results.length === 0) {
        console.log('[AuthService] WARNING: No users in database!');
        return [];
      }

      return results.map(row => this.mapToUser(row));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const database = await this.db.getDatabase();
      const result = await database.getFirstAsync<any>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (!result) return null;

      return this.mapToUser(result);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Initialize with sample data (call once on first app launch)
  static async initializeSampleData(): Promise<void> {
    try {
      const database = await this.db.getDatabase();
      
      // Check if users already exist
      const count = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM users'
      );

      if (count && count.count > 0) {
        console.log(`[AuthService] Sample data already exists: ${count.count} users`);
        return;
      }

      console.log('[AuthService] No sample data found, initializing 8 sample users...');
      
      const sampleUsers = [
        {
          id: 'user_1',
          username: 'chef_alex',
          email: 'alex@example.com',
          password: 'password123',
          displayName: 'Chef Alex',
          bio: 'Passionate home chef 👨‍🍳 | Sharing family recipes',
          avatarUri: 'https://i.pravatar.cc/150?u=alex',
        },
        {
          id: 'user_2',
          username: 'foodie_maria',
          email: 'maria@example.com',
          password: 'password123',
          displayName: 'Maria Garcia',
          bio: 'Food blogger 🍕 | Mediterranean cuisine lover',
          avatarUri: 'https://i.pravatar.cc/150?u=maria',
        },
        {
          id: 'user_3',
          username: 'baker_john',
          email: 'john@example.com',
          password: 'password123',
          displayName: 'John Baker',
          bio: 'Professional pastry chef 🧁 | Sweet creations daily',
          avatarUri: 'https://i.pravatar.cc/150?u=john',
        },
        {
          id: 'user_4',
          username: 'healthy_sarah',
          email: 'sarah@example.com',
          password: 'password123',
          displayName: 'Sarah Johnson',
          bio: 'Healthy eating advocate 🥗 | Plant-based recipes',
          avatarUri: 'https://i.pravatar.cc/150?u=sarah',
        },
        {
          id: 'user_5',
          username: 'spicy_chef',
          email: 'mike@example.com',
          password: 'password123',
          displayName: 'Mike Chen',
          bio: 'Asian fusion expert 🌶️ | Spicy food enthusiast',
          avatarUri: 'https://i.pravatar.cc/150?u=mike',
        },
        {
          id: 'user_6',
          username: 'italian_mama',
          email: 'giulia@example.com',
          password: 'password123',
          displayName: 'Giulia Rossi',
          bio: 'Traditional Italian cooking 🍝 | Nonna\'s recipes',
          avatarUri: 'https://i.pravatar.cc/150?u=giulia',
        },
        {
          id: 'user_7',
          username: 'dessert_queen',
          email: 'emily@example.com',
          password: 'password123',
          displayName: 'Emily Brown',
          bio: 'Dessert lover 🍰 | Sweet tooth adventures',
          avatarUri: 'https://i.pravatar.cc/150?u=emily',
        },
        {
          id: 'user_8',
          username: 'grill_master',
          email: 'david@example.com',
          password: 'password123',
          displayName: 'David Martinez',
          bio: 'BBQ enthusiast 🔥 | Grill master tips & tricks',
          avatarUri: 'https://i.pravatar.cc/150?u=david',
        },
      ];

      for (const user of sampleUsers) {
        await database.runAsync(
          `INSERT INTO users (id, username, email, password, displayName, bio, avatarUri, followersCount, followingCount, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
          [user.id, user.username, user.email, user.password, user.displayName, user.bio, user.avatarUri, new Date().toISOString()]
        );
      }

      console.log(`[AuthService] Successfully initialized ${sampleUsers.length} sample users`);
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  // Follow user
  static async followUser(userId: string, targetUserId: string): Promise<void> {
    try {
      const database = await this.db.getDatabase();

      // Check if already following
      const existing = await database.getFirstAsync<any>(
        'SELECT * FROM follows WHERE followerId = ? AND followingId = ?',
        [userId, targetUserId]
      );

      if (existing) {
        console.log('[AuthService] Already following this user');
        return;
      }

      // Add follow relationship
      await database.runAsync(
        'INSERT INTO follows (followerId, followingId, createdAt) VALUES (?, ?, ?)',
        [userId, targetUserId, new Date().toISOString()]
      );

      // Update follower/following counts
      await database.runAsync(
        'UPDATE users SET followingCount = followingCount + 1 WHERE id = ?',
        [userId]
      );

      await database.runAsync(
        'UPDATE users SET followersCount = followersCount + 1 WHERE id = ?',
        [targetUserId]
      );

      console.log('[AuthService] User', userId, 'now following', targetUserId);
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  // Unfollow user
  static async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    try {
      const database = await this.db.getDatabase();

      // Remove follow relationship
      await database.runAsync(
        'DELETE FROM follows WHERE followerId = ? AND followingId = ?',
        [userId, targetUserId]
      );

      // Update follower/following counts
      await database.runAsync(
        'UPDATE users SET followingCount = CASE WHEN followingCount > 0 THEN followingCount - 1 ELSE 0 END WHERE id = ?',
        [userId]
      );

      await database.runAsync(
        'UPDATE users SET followersCount = CASE WHEN followersCount > 0 THEN followersCount - 1 ELSE 0 END WHERE id = ?',
        [targetUserId]
      );

      console.log('[AuthService] User', userId, 'unfollowed', targetUserId);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  // Check if user is following another user
  static async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
    try {
      const database = await this.db.getDatabase();
      const result = await database.getFirstAsync<any>(
        'SELECT * FROM follows WHERE followerId = ? AND followingId = ?',
        [userId, targetUserId]
      );
      return result !== null;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Get list of user IDs that a user is following
  static async getFollowing(userId: string): Promise<string[]> {
    try {
      const database = await this.db.getDatabase();
      const results = await database.getAllAsync<{ followingId: string }>(
        'SELECT followingId FROM follows WHERE followerId = ?',
        [userId]
      );
      return results.map(r => r.followingId);
    } catch (error) {
      console.error('Error getting following list:', error);
      return [];
    }
  }

  // Helper method to map database row to User object
  private static mapToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      displayName: row.displayName,
      bio: row.bio || '',
      avatarUri: row.avatarUri,
      profilePicture: row.avatarUri,
      followersCount: row.followersCount || 0,
      followingCount: row.followingCount || 0,
      isFollowing: false,
      isPrivate: false,
      isBlocked: false,
      hasStory: false,
      createdAt: new Date(row.createdAt),
    };
  }
}
