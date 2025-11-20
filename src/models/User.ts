export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string; // Only stored locally, never sent to server in real app
  displayName?: string;
  bio?: string;
  avatarUri?: string; // local cache path or remote
  profilePicture?: string; // alias for avatarUri for UI compatibility
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isPrivate?: boolean;        // Privacy setting
  isBlocked?: boolean;        // Blocked by current user
  hasStory?: boolean;         // Has unseen story
  createdAt: Date | string;
}

export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  privateAccount: boolean;
  showActivityStatus: boolean;
}

/**
 * Extended User with follow relationship info
 */
export interface UserWithRelation extends User {
  followStatus?: 'not_following' | 'following' | 'pending' | 'blocked';
  isCurrentUser?: boolean;
}

