export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  type: MediaType;
  remoteUri?: string;
  url?: string; // alias for remoteUri for UI compatibility
  localUri?: string; // cached file path or upload temp path
  thumbnailUri?: string;
  order: number;
  width?: number;
  height?: number;
}
