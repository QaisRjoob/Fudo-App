import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  SafeAreaView,
  useColorScheme,
  Modal,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { FeedViewModel } from '../viewmodels/FeedViewModel';
import RecipeDetailScreen from './RecipeDetailScreen';
import { PostWithAuthor, User } from '../models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_SIZE = 90; // Increased from 70 to 85

// Story Item Component
const StoryItem = ({ user, isFirst }: { user: User; isFirst: boolean }) => {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#FFF' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#000' : '#FFF';
  
  return (
    <TouchableOpacity style={styles.storyItem}>
      {!isFirst ? (
        <LinearGradient
          colors={['#f17107ff', '#ffae00ff', '#ff0000ff']} // Yellow -> Pink/Red -> Purple gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.storyGradient}
        >
          <View style={styles.storyInnerRing}>
            <Image 
              source={{ uri: user.profilePicture || user.avatarUri }} 
              style={styles.storyImage}
            />
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.addStoryRing}>
          <Image 
            source={{ uri: user.profilePicture || user.avatarUri }} 
            style={styles.storyImage}
          />
          <View style={styles.addButton}>
            <Ionicons name="add" size={16} color="#FFF" />
          </View>
        </View>
      )}
      <Text style={[styles.storyUsername, { color: textColor }]} numberOfLines={1}>
        {isFirst ? 'Your Story' : user.username}
      </Text>
    </TouchableOpacity>
  );
};

// Post Card Component - Creative Recipe Teaser
const PostCard = observer(({ 
  post, 
  onLike, 
  onComment,
  onShare,
  onSave,
  onPress,
  onProfilePress,
  currentUser 
}: { 
  post: PostWithAuthor; 
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onPress: () => void;
  onProfilePress: () => void;
  currentUser: User | null;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const tapTimeoutRef = useRef<any>(null);
  const colorScheme = useColorScheme();
  
  // These will automatically update when post changes (MobX observable)
  const isLiked = post.isLiked !== undefined ? post.isLiked : (post.isLikedByCurrentUser || false);
  const isSaved = post.isSaved !== undefined ? post.isSaved : (post.isSavedByCurrentUser || false);
  
  const textColor = colorScheme === 'dark' ? '#FFF' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#000' : '#FFF';
  const cardBg = colorScheme === 'dark' ? '#1A1A1A' : '#F8F8F8';
  const accentColor = '#FF6B35';

  // Handle double tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // milliseconds

    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - only like, don't open recipe
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      
      if (!isLiked) {
        onLike();
      }
      // Show heart animation
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
      setLastTap(0); // Reset
    } else {
      // First tap - schedule opening recipe if no second tap
      setLastTap(now);
      tapTimeoutRef.current = setTimeout(() => {
        onPress();
        setLastTap(0);
      }, DOUBLE_TAP_DELAY);
    }
  };

  return (
    <View style={[styles.postCard, { backgroundColor }]}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postHeaderLeft} onPress={onProfilePress}>
          <Image 
            source={{ uri: post.author?.profilePicture }} 
            style={styles.postAvatar}
          />
          <View>
            <Text style={[styles.postUsername, { color: textColor }]}>{post.author?.username}</Text>
            <Text style={styles.recipeLabel}>shared a recipe</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Clickable Recipe Teaser Card */}
      <TouchableOpacity 
        style={[styles.recipeTeaser, { backgroundColor: cardBg }]}
        onPress={handleDoubleTap}
        activeOpacity={0.9}
      >
        {/* Media Preview with Gradient Overlay */}
        <View style={styles.mediaTeaserContainer}>
          {post.media && post.media.length > 0 && (
            <>
              <Image 
                source={{ uri: post.media[currentImageIndex]?.url }} 
                style={styles.teaserImage}
                resizeMode="cover"
              />
              
              {/* Double Tap Heart Animation */}
              {showHeartAnimation && (
                <View style={styles.likeAnimationContainer}>
                  <Ionicons name="heart" size={100} color="#FF3B47" style={styles.likeAnimationHeart} />
                </View>
              )}
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.teaserGradient}
              >
                {/* Media Counter Badge */}
                {post.media.length > 1 && (
                  <View style={styles.mediaBadge}>
                    <Ionicons name="images" size={16} color="#FFF" />
                    <Text style={styles.mediaBadgeText}>{post.media.length}</Text>
                  </View>
                )}
                
                {/* Recipe Title */}
                <Text style={styles.recipeTitleLarge} numberOfLines={2}>
                  {post.caption || 'Delicious Recipe'}
                </Text>
              </LinearGradient>
            </>
          )}
        </View>

        {/* Recipe Quick Info */}
        <View style={styles.recipeQuickInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={18} color={accentColor} />
            <Text style={[styles.infoText, { color: textColor }]}>30 min</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flame-outline" size={18} color={accentColor} />
            <Text style={[styles.infoText, { color: textColor }]}>350 cal</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="restaurant-outline" size={18} color={accentColor} />
            <Text style={[styles.infoText, { color: textColor }]}>4 servings</Text>
          </View>
        </View>

        {/* Tap to View Prompt */}
        <View style={[styles.tapPrompt, { borderTopColor: colorScheme === 'dark' ? '#333' : '#E0E0E0' }]}>
          <Text style={[styles.tapPromptText, { color: accentColor }]}>
            Tap to view full recipe
          </Text>
          <Ionicons name="chevron-forward" size={20} color={accentColor} />
        </View>
      </TouchableOpacity>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={onLike} style={styles.actionButton}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={28} 
              color={isLiked ? "#FF3B47" : textColor} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={26} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare} style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={26} color={textColor} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={26} 
            color={textColor} 
          />
        </TouchableOpacity>
      </View>

      {/* Likes and Comments Count */}
      <View style={styles.engagementRow}>
        {post.likesCount > 0 && (
          <Text style={[styles.likesText, { color: textColor }]}>
            <Text style={styles.boldText}>{post.likesCount.toLocaleString()}</Text> likes
          </Text>
        )}
        {post.commentsCount > 0 && (
          <TouchableOpacity onPress={onComment}>
            <Text style={[styles.commentsText, { color: textColor }]}>
              <Text style={styles.boldText}>{post.commentsCount}</Text> comments
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Time */}
      <Text style={styles.timeText}>2 hours ago</Text>
    </View>
  );
});

// Main Feed Screen
const FeedScreen = observer(() => {
  const [viewModel] = useState(() => new FeedViewModel());
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);
  const [isRecipeDetailVisible, setIsRecipeDetailVisible] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    viewModel.initialize();
  }, []);

  // Refresh suggested users when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      // Reload suggested users when returning to this screen
      const refreshSuggestions = async () => {
        if (viewModel.currentUser) {
          await viewModel.refresh();
        }
      };
      refreshSuggestions();
    }, [])
  );

  const backgroundColor = colorScheme === 'dark' ? '#000' : '#FFF';
  const textColor = colorScheme === 'dark' ? '#FFF' : '#000';
  const borderColor = colorScheme === 'dark' ? '#262626' : '#DBDBDB';
  const statusBarStyle = colorScheme === 'dark' ? 'light-content' : 'dark-content';

  const handleLike = (postId: string) => {
    viewModel.toggleLike(postId);
  };

  const handleSave = (postId: string) => {
    viewModel.toggleSave(postId);
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    console.log('Share post:', postId);
  };

  const handlePostPress = (postId: string) => {
    const post = viewModel.posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setIsRecipeDetailVisible(true);
    }
  };

  const handleCloseRecipeDetail = () => {
    setIsRecipeDetailVisible(false);
    setTimeout(() => setSelectedPost(null), 300);
  };

  const handleProfilePress = (userId: string) => {
    if (!userId) return;
    router.push(`/profile/${userId}` as any);
  };

  const handleFollowUser = async (userId: string) => {
    await viewModel.followUser(userId);
  };

  const renderStories = () => {
    if (!viewModel.currentUser) return null;

    // Get unique authors from posts
    const uniqueAuthors = Array.from(
      new Map(
        viewModel.posts
          .slice(0, 7)
          .filter(p => p.author)
          .map(p => [p.author!.id, p.author!])
      ).values()
    );

    const storyUsers = [viewModel.currentUser, ...uniqueAuthors];

    return (
      <View style={[styles.storiesContainer, { borderBottomColor: borderColor }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          {storyUsers.map((user, index) => (
            <StoryItem key={`${user.id}-${index}`} user={user} isFirst={index === 0} />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSuggestedUsers = () => {
    console.log('[FeedScreen] renderSuggestedUsers called');
    console.log('[FeedScreen] suggestedUsers:', viewModel.suggestedUsers?.length || 0);
    
    if (!viewModel.suggestedUsers || viewModel.suggestedUsers.length === 0) {
      console.log('[FeedScreen] No suggested users to display');
      return null;
    }

    console.log('[FeedScreen] Rendering', viewModel.suggestedUsers.length, 'suggested users');
    return (
      <View style={[styles.suggestedContainer, { backgroundColor, borderColor }]}>
        <View style={styles.suggestedHeader}>
          <Text style={[styles.suggestedTitle, { color: textColor }]}>Discover more users</Text>
          <Text style={styles.suggestedSubtitle}>Search coming soon</Text>
        </View>
        {viewModel.suggestedUsers.map(user => (
          <View key={user.id} style={styles.suggestedUserItem}>
            <TouchableOpacity 
              onPress={() => handleProfilePress(user.id)}
              style={styles.suggestedUserInfo}
            >
              <Image 
                source={{ uri: user.profilePicture || user.avatarUri || `https://i.pravatar.cc/150?u=${user.id}` }}
                style={styles.suggestedUserAvatar}
              />
              <View style={styles.suggestedUserText}>
                <Text style={[styles.suggestedUserName, { color: textColor }]} numberOfLines={1}>
                  {user.username}
                </Text>
                <Text style={styles.suggestedUserBio} numberOfLines={1}>
                  {user.bio || 'New on Fudo'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.followButton,
                user.isFollowing && styles.followingButton
              ]}
              onPress={() => handleFollowUser(user.id)}
              disabled={user.isFollowing}
            >
              <Text style={[
                styles.followButtonText,
                user.isFollowing && styles.followingButtonText
              ]}>
                {user.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderPost = ({ item }: { item: PostWithAuthor }) => (
    <PostCard 
      post={item} 
      onLike={() => handleLike(item.id)}
      onComment={() => handleComment(item.id)}
      onShare={() => handleShare(item.id)}
      onSave={() => handleSave(item.id)}
      onPress={() => handlePostPress(item.id)}
      onProfilePress={() => handleProfilePress(item.authorId)}
      currentUser={viewModel.currentUser}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { borderBottomColor: borderColor }]}>
        <Text style={[styles.logoText, { color: textColor }]}>Fudo</Text>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.topBarIcon}>
            <Ionicons name="heart-outline" size={28} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}>
            <Ionicons name="paper-plane-outline" size={28} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories + Feed */}
      <FlatList
        data={viewModel.posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {renderStories()}
            {renderSuggestedUsers()}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={viewModel.isRefreshing}
            onRefresh={() => viewModel.refresh()}
            tintColor={textColor}
          />
        }
        onEndReached={() => {
          if (viewModel.hasMore && !viewModel.isLoading) {
            viewModel.loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          viewModel.isLoading ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={textColor} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !viewModel.isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#A0A0A0" style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyText, { color: textColor }]}>Welcome to Fudo!</Text>
              <Text style={styles.emptySubtext}>Follow people to see their delicious posts</Text>
              <Text style={[styles.emptySubtext, { marginTop: 4, fontStyle: 'italic' }]}>
                (Search coming in future updates)
              </Text>
              
              {/* Show suggested users in empty state */}
              {viewModel.suggestedUsers && viewModel.suggestedUsers.length > 0 && (
                <View style={[styles.suggestedContainerEmpty, { backgroundColor, borderColor }]}>
                  <Text style={[styles.suggestedTitleEmpty, { color: textColor }]}>
                    Suggested users to follow
                  </Text>
                  {viewModel.suggestedUsers.map(user => (
                    <View key={user.id} style={styles.suggestedUserItem}>
                      <TouchableOpacity 
                        onPress={() => handleProfilePress(user.id)}
                        style={styles.suggestedUserInfo}
                      >
                        <Image 
                          source={{ uri: user.profilePicture || user.avatarUri || `https://i.pravatar.cc/150?u=${user.id}` }}
                          style={styles.suggestedUserAvatar}
                        />
                        <View style={styles.suggestedUserText}>
                          <Text style={[styles.suggestedUserName, { color: textColor }]} numberOfLines={1}>
                            {user.username}
                          </Text>
                          <Text style={styles.suggestedUserBio} numberOfLines={1}>
                            {user.bio || 'New on Fudo'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.followButton,
                          user.isFollowing && styles.followingButton
                        ]}
                        onPress={() => handleFollowUser(user.id)}
                        disabled={user.isFollowing}
                      >
                        <Text style={[
                          styles.followButtonText,
                          user.isFollowing && styles.followingButtonText
                        ]}>
                          {user.isFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null
        }
      />

      {/* Recipe Detail Modal */}
      <Modal
        visible={isRecipeDetailVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseRecipeDetail}
      >
        {selectedPost && (
          <RecipeDetailScreen
            post={viewModel.posts.find(p => p.id === selectedPost.id) || selectedPost}
            currentUser={viewModel.currentUser}
            onBack={handleCloseRecipeDetail}
            onLike={() => handleLike(selectedPost.id)}
            onSave={() => handleSave(selectedPost.id)}
            onComment={() => handleComment(selectedPost.id)}
            onShare={() => handleShare(selectedPost.id)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarIcon: {
    marginLeft: 20,
  },
  storiesContainer: {
    borderBottomWidth: 0.5,
    paddingVertical: 12,
  },
  storiesContent: {
    paddingHorizontal: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: STORY_SIZE,
  },
  storyGradient: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInnerRing: {
    width: STORY_SIZE - 8,
    height: STORY_SIZE - 7,
    borderRadius: (STORY_SIZE - 6) / 2,
    backgroundColor: '#000',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 1.5,
    borderWidth: 3,
    borderColor: '#FF5E3A',
  },
  addStoryRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderColor: '#A0A0A0',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: STORY_SIZE / 2,
    borderWidth: 2, // Reduced inner border
    borderColor: '#000',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095F6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  storyUsername: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: STORY_SIZE,
  },
  postCard: {
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  postUsername: {
    fontWeight: '600',
    fontSize: 14,
  },
  recipeLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 2,
  },
  recipeTeaser: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mediaTeaserContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  teaserImage: {
    width: '100%',
    height: '100%',
  },
  likeAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  likeAnimationHeart: {
    opacity: 0.9,
  },
  teaserGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  mediaBadge: {
    position: 'absolute',
    top: -100,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  recipeTitleLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  recipeQuickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  tapPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 6,
  },
  tapPromptText: {
    fontSize: 15,
    fontWeight: '600',
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 16,
  },
  commentsText: {
    fontSize: 14,
  },
  postImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#1A1A1A',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#FFF',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  likesText: {
    fontSize: 14,
  },
  boldText: {
    fontWeight: '600',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 18,
  },
  viewCommentsText: {
    color: '#A0A0A0',
    paddingHorizontal: 12,
    paddingTop: 6,
    fontSize: 14,
  },
  timeText: {
    color: '#A0A0A0',
    paddingHorizontal: 12,
    paddingTop: 6,
    fontSize: 11,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 32,
  },
  suggestedContainerEmpty: {
    width: '90%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  suggestedTitleEmpty: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestedContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    marginBottom: 8,
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestedTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  suggestedSubtitle: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  suggestedSeeAll: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },
  suggestedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  suggestedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  suggestedUserText: {
    flex: 1,
  },
  suggestedUserName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestedUserBio: {
    fontSize: 12,
    color: '#999',
  },
  followButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#999',
  },
});

export default FeedScreen;
