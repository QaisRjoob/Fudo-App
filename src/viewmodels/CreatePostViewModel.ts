import { makeAutoObservable, runInAction } from 'mobx';
import { Post, MediaItem } from '../models';
import { PostRepository } from '../repositories';
import MediaService from '../services/MediaService';
import { v4 as uuidv4 } from 'uuid';

export class CreatePostViewModel {
  media: MediaItem[] = [];
  caption: string = '';
  isUploading: boolean = false;
  uploadProgress: number = 0;
  error: string | null = null;

  private postRepo: PostRepository;
  private mediaService = MediaService;

  constructor() {
    this.postRepo = new PostRepository();
    
    makeAutoObservable(this);
  }

  async pickImages(): Promise<void> {
    try {
      const hasPermission = await this.mediaService.requestPermissions();
      if (!hasPermission) {
        runInAction(() => {
          this.error = 'Permission denied';
        });
        return;
      }

      const picked = await this.mediaService.pickImages({
        allowsMultipleSelection: true,
        maxSelection: 10,
      });

      runInAction(() => {
        this.media = [...this.media, ...picked].slice(0, 10);
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Failed to pick images';
      });
    }
  }

  async takePhoto(): Promise<void> {
    try {
      const hasPermission = await this.mediaService.requestPermissions();
      if (!hasPermission) {
        runInAction(() => {
          this.error = 'Permission denied';
        });
        return;
      }

      const photo = await this.mediaService.takePhoto();
      if (photo) {
        runInAction(() => {
          this.media = [...this.media, photo].slice(0, 10);
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Failed to take photo';
      });
    }
  }

  removeMedia(index: number): void {
    this.media = this.media.filter((_, i) => i !== index);
  }

  reorderMedia(fromIndex: number, toIndex: number): void {
    const newMedia = [...this.media];
    const [removed] = newMedia.splice(fromIndex, 1);
    newMedia.splice(toIndex, 0, removed);
    
    // Update order property
    newMedia.forEach((item, index) => {
      item.order = index;
    });

    this.media = newMedia;
  }

  setCaption(text: string): void {
    this.caption = text;
  }

  async createPost(authorId: string): Promise<Post | null> {
    if (this.media.length === 0) {
      runInAction(() => {
        this.error = 'Please select at least one image';
      });
      return null;
    }

    runInAction(() => {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.error = null;
    });

    try {
      // Create post with pending upload status
      const post = await this.postRepo.createPost({
        authorId,
        caption: this.caption || undefined,
        media: this.media,
        uploadStatus: 'pending',
      });

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        runInAction(() => {
          this.uploadProgress = i;
        });
      }

      // Update post status to uploaded
      await this.postRepo.updatePost(post.id, { uploadStatus: 'uploaded' });

      runInAction(() => {
        this.isUploading = false;
        this.uploadProgress = 100;
      });

      // Reset form
      this.reset();

      return post;
    } catch (error: any) {
      runInAction(() => {
        this.isUploading = false;
        this.error = error.message || 'Failed to create post';
      });
      return null;
    }
  }

  reset(): void {
    this.media = [];
    this.caption = '';
    this.uploadProgress = 0;
    this.error = null;
  }
}
