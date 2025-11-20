import { makeAutoObservable, runInAction } from 'mobx';
import { Post, User } from '../models';
import { PostRepository, UserRepository, AnalyticsRepository } from '../repositories';

export class FeedViewModel {
  posts: Post[] = [];
  isLoading: boolean = false;
  isRefreshing: boolean = false;
  hasMore: boolean = true;
  error: string | null = null;
  currentUser: User | null = null;

  private postRepo: PostRepository;
  private userRepo: UserRepository;
  private analyticsRepo: AnalyticsRepository;
  private cursor?: string;

  constructor() {
    this.postRepo = new PostRepository();
    this.userRepo = new UserRepository();
    this.analyticsRepo = new AnalyticsRepository();
    
    makeAutoObservable(this);
  }

  async initialize(): Promise<void> {
    await this.loadCurrentUser();
    await this.loadFeed();
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      const user = await this.userRepo.getCurrentUser();
      runInAction(() => {
        this.currentUser = user;
      });
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  async loadFeed(isRefresh: boolean = false): Promise<void> {
    if (!this.currentUser) return;

    if (isRefresh) {
      runInAction(() => {
        this.isRefreshing = true;
        this.cursor = undefined;
      });
    } else {
      runInAction(() => {
        this.isLoading = true;
      });
    }

    try {
      const newPosts = await this.postRepo.getFeed(
        this.currentUser.id,
        isRefresh ? undefined : this.cursor,
        20
      );

      runInAction(() => {
        if (isRefresh) {
          this.posts = newPosts;
        } else {
          this.posts = [...this.posts, ...newPosts];
        }
        
        this.hasMore = newPosts.length >= 20;
        this.cursor = newPosts.length > 0 ? newPosts[newPosts.length - 1].createdAt : undefined;
        this.error = null;
      });

      // Track impressions for analytics
      for (const post of newPosts) {
        await this.analyticsRepo.trackEvent({
          entityType: 'post',
          entityId: post.id,
          eventType: 'impression',
          userId: this.currentUser.id,
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Failed to load feed';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
        this.isRefreshing = false;
      });
    }
  }

  async toggleLike(postId: string): Promise<void> {
    if (!this.currentUser) return;

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    const wasLiked = post.isLiked;
    runInAction(() => {
      post.isLiked = !wasLiked;
      post.likesCount += wasLiked ? -1 : 1;
    });

    try {
      if (wasLiked) {
        await this.postRepo.unlikePost(this.currentUser.id, postId);
      } else {
        await this.postRepo.likePost(this.currentUser.id, postId);
        await this.analyticsRepo.trackEvent({
          entityType: 'post',
          entityId: postId,
          eventType: 'like',
          userId: this.currentUser.id,
        });
      }
    } catch (error) {
      // Revert on error
      runInAction(() => {
        post.isLiked = wasLiked;
        post.likesCount += wasLiked ? 1 : -1;
      });
      console.error('Error toggling like:', error);
    }
  }

  async toggleSave(postId: string): Promise<void> {
    if (!this.currentUser) return;

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    const wasSaved = post.isSaved;
    runInAction(() => {
      post.isSaved = !wasSaved;
    });

    try {
      if (wasSaved) {
        await this.postRepo.unsavePost(this.currentUser.id, postId);
      } else {
        await this.postRepo.savePost(this.currentUser.id, postId);
        await this.analyticsRepo.trackEvent({
          entityType: 'post',
          entityId: postId,
          eventType: 'save',
          userId: this.currentUser.id,
        });
      }
    } catch (error) {
      // Revert on error
      runInAction(() => {
        post.isSaved = wasSaved;
      });
      console.error('Error toggling save:', error);
    }
  }

  async refresh(): Promise<void> {
    await this.loadFeed(true);
  }

  async loadMore(): Promise<void> {
    if (!this.isLoading && this.hasMore) {
      await this.loadFeed(false);
    }
  }
}
