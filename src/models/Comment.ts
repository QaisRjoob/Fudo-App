/**
 * Comment Model
 * Represents a comment on a post
 */

export interface Comment {
  id: string;
  postId?: string;
  storyId?: string;
  authorId: string;
  text: string;
  content?: string;            // Alias for text
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
  replyToCommentId?: string;
  isDeleted?: boolean;
}

/**
 * Extended Comment with author data for UI
 */
export interface CommentWithAuthor extends Comment {
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUri?: string;
    profilePicture?: string;
  };
  isLikedByCurrentUser?: boolean;
}

