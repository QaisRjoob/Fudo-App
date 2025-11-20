import { makeAutoObservable, runInAction } from 'mobx';
import { User, Post, UserAnalytics } from '../models';
import { UserRepository, PostRepository, AnalyticsRepository } from '../repositories';

export class ProfileViewModel {
  user: User | null = null;
  posts: Post[] = [];
  analytics: UserAnalytics | null = null;
  isLoading: boolean = false;
  isFollowing: boolean = false;
  error: string | null = null;
  selectedPeriod: '7d' | '30d' | '90d' = '30d';

  private userRepo: UserRepository;
  private postRepo: PostRepository;
  private analyticsRepo: AnalyticsRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.postRepo = new PostRepository();
    this.analyticsRepo = new AnalyticsRepository();
    
    makeAutoObservable(this);
  }

  async initialize(userId?: string): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
    });

    try {
      const user = userId 
        ? await this.userRepo.getUserById(userId)
        : await this.userRepo.getCurrentUser();

      if (user) {
        runInAction(() => {
          this.user = user;
        });

        await Promise.all([
          this.loadPosts(),
          this.loadAnalytics(),
          this.checkFollowStatus(),
        ]);
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Failed to load profile';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  private async loadPosts(): Promise<void> {
    if (!this.user) return;

    try {
      const posts = await this.postRepo.getUserPosts(this.user.id);
      runInAction(() => {
        this.posts = posts;
      });
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }

  async loadAnalytics(period?: '7d' | '30d' | '90d'): Promise<void> {
    if (!this.user) return;

    if (period) {
      runInAction(() => {
        this.selectedPeriod = period;
      });
    }

    try {
      const analytics = await this.analyticsRepo.getUserAnalytics(
        this.user.id,
        this.selectedPeriod
      );
      
      runInAction(() => {
        this.analytics = analytics;
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  private async checkFollowStatus(): Promise<void> {
    if (!this.user) return;

    const currentUser = await this.userRepo.getCurrentUser();
    if (!currentUser || currentUser.id === this.user.id) return;

    try {
      const following = await this.userRepo.isFollowing(currentUser.id, this.user.id);
      runInAction(() => {
        this.isFollowing = following;
      });
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }

  async toggleFollow(): Promise<void> {
    if (!this.user) return;

    const currentUser = await this.userRepo.getCurrentUser();
    if (!currentUser) return;

    // Optimistic update
    const wasFollowing = this.isFollowing;
    runInAction(() => {
      this.isFollowing = !wasFollowing;
      if (this.user) {
        this.user.followersCount += wasFollowing ? -1 : 1;
      }
    });

    try {
      if (wasFollowing) {
        await this.userRepo.unfollowUser(currentUser.id, this.user.id);
      } else {
        await this.userRepo.followUser(currentUser.id, this.user.id);
      }
    } catch (error) {
      // Revert on error
      runInAction(() => {
        this.isFollowing = wasFollowing;
        if (this.user) {
          this.user.followersCount += wasFollowing ? 1 : -1;
        }
      });
      console.error('Error toggling follow:', error);
    }
  }

  async refresh(): Promise<void> {
    await this.initialize(this.user?.id);
  }
}
