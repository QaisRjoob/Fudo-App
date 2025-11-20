import { MediaItem } from './MediaItem';

export interface Story {
  id: string;
  authorId: string;
  media: MediaItem;
  createdAt: string;
  expiresAt?: string;
  views: number;
  repliesCount: number;
  isHighlighted?: boolean;
  highlightId?: string;
  uploadStatus?: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

export interface StoryHighlight {
  id: string;
  userId: string;
  title: string;
  coverUri?: string;
  storyIds: string[];
  createdAt: string;
}
