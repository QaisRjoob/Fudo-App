import { MediaItem } from './MediaItem';

export interface PostAnalytics {
  impressions: number;
  views: number;
  saves: number;
  shares: number;
  reach: number;
}

export interface Post {
  id: string;
  authorId: string;
  caption?: string;
  media: MediaItem[]; // sequence (images/videos)
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
  isArchived?: boolean;
  isSaved?: boolean;
  isLiked?: boolean;
  uploadStatus?: 'pending' | 'uploading' | 'uploaded' | 'failed';
  analytics?: PostAnalytics;
}
