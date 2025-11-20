import { makeAutoObservable, runInAction } from 'mobx';
import { Post, PostWithAuthor, User } from '../models';
import { PostRepository, UserRepository, AnalyticsRepository } from '../repositories';

export class FeedViewModel {
  posts: PostWithAuthor[] = [];
  suggestedUsers: User[] = [];
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
    await this.loadSuggestedUsers();
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
    if (!this.currentUser) {
      console.log('[FeedViewModel] No current user, cannot load feed');
      return;
    }

    console.log('[FeedViewModel] Loading feed for user:', this.currentUser.id, 'isRefresh:', isRefresh);

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
      console.log('[FeedViewModel] Loaded', newPosts.length, 'posts from repository');

      // Enrich posts with author data and compatibility fields
      const enrichedPosts: PostWithAuthor[] = await Promise.all(
        newPosts.map(async (post) => {
          const author = await this.userRepo.getUserById(post.authorId);
          
          // Check if we're following this author
          let isFollowing = false;
          if (author && this.currentUser) {
            isFollowing = await this.userRepo.isFollowing(this.currentUser.id, author.id);
          }
          
          return {
            ...post,
            author: author ? {
              ...author,
              profilePicture: author.avatarUri || author.profilePicture,
              isFollowing,
            } : undefined,
            isLikedByCurrentUser: post.isLiked,
            isSavedByCurrentUser: post.isSaved,
            media: post.media.map(m => ({
              ...m,
              url: m.remoteUri || m.url || m.localUri,
            })),
          };
        })
      );

      runInAction(() => {
        if (isRefresh) {
          this.posts = enrichedPosts;
        } else {
          this.posts = [...this.posts, ...enrichedPosts];
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
    await this.loadSuggestedUsers();
  }

  async loadMore(): Promise<void> {
    if (!this.isLoading && this.hasMore) {
      await this.loadFeed(false);
    }
  }

  private async loadSuggestedUsers(): Promise<void> {
    if (!this.currentUser) {
      console.log('No current user, skipping suggested users');
      return;
    }

    try {
      console.log('Loading suggested users for:', this.currentUser.id);
      const allUsers = await this.userRepo.searchUsers('');
      console.log('All users found:', allUsers.length);
      
      // Get list of users we're already following
      const followingUsers = await this.userRepo.getFollowing(this.currentUser.id);
      const followingIds = new Set(followingUsers.map(u => u.id));
      console.log('Following users:', followingIds.size);
      
      // Filter out current user and users we're already following
      // Show ALL users that aren't followed (no limit)
      const filtered = allUsers
        .filter(u => u.id !== this.currentUser?.id && !followingIds.has(u.id));
      
      console.log('Suggested users after filtering:', filtered.length);
      
      runInAction(() => {
        this.suggestedUsers = filtered;
      });
    } catch (error) {
      console.error('Error loading suggested users:', error);
      // Even on error, try to show something
      runInAction(() => {
        this.suggestedUsers = [];
      });
    }
  }

  async followUser(userId: string): Promise<void> {
    if (!this.currentUser) return;

    // Mark user as followed immediately in the UI
    runInAction(() => {
      const user = this.suggestedUsers.find(u => u.id === userId);
      if (user) {
        user.isFollowing = true;
      }
      
      // Update isFollowing for this user in posts
      this.posts.forEach(post => {
        if (post.author?.id === userId) {
          post.author.isFollowing = true;
        }
      });
    });

    try {
      await this.userRepo.followUser(this.currentUser.id, userId);
      
      // Remove from suggested users list after successful follow
      runInAction(() => {
        this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== userId);
      });

      // Reload suggested users if list is getting short
      if (this.suggestedUsers.length < 3) {
        await this.loadSuggestedUsers();
      }
    } catch (error) {
      console.error('Error following user:', error);
      // Revert the UI change on error
      runInAction(() => {
        const user = this.suggestedUsers.find(u => u.id === userId);
        if (user) {
          user.isFollowing = false;
        }
        
        // Revert in posts too
        this.posts.forEach(post => {
          if (post.author?.id === userId) {
            post.author.isFollowing = false;
          }
        });
      });
    }
  }

  async unfollowUser(userId: string): Promise<void> {
    if (!this.currentUser) return;

    // Update isFollowing in posts immediately
    runInAction(() => {
      this.posts.forEach(post => {
        if (post.author?.id === userId) {
          post.author.isFollowing = false;
        }
      });
    });

    try {
      await this.userRepo.unfollowUser(this.currentUser.id, userId);
      
      // Reload suggested users to include the unfollowed user
      await this.loadSuggestedUsers();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      
      // Revert on error
      runInAction(() => {
        this.posts.forEach(post => {
          if (post.author?.id === userId) {
            post.author.isFollowing = true;
          }
        });
      });
    }
  }
}
