export interface User {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUri?: string; // local cache path or remote
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  privateAccount: boolean;
  showActivityStatus: boolean;
}
