import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Image,
  ImageBackground,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  Star,
  Heart,
  TreePalm,
  Edit3,
  Umbrella,
  Sun,
  MapPin,
} from 'lucide-react-native';
import {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from '@supabase/supabase-js';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type Review = {
  id: string;
  user_id: string;
  booking_type: string;
  booking_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
  liked_by: string[]; // array of user IDs who liked the review
};

type Profile = {
  id: string;
  full_name: string;
};

export default function ReviewRating() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [isEligible, setIsEligible] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState('');
  const [editingReviewRating, setEditingReviewRating] = useState(5);

  // FETCH CURRENT USER & ELIGIBILITY
  const fetchEligibility = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: bookings, error } = await supabase
        .from('user_confirmed_bookings')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      if (error) throw error;
      if (bookings && bookings.length > 0) {
        setIsEligible(true);
      }
    } catch (error) {
      console.error('Error checking booking eligibility:', error);
    }
  };

  // FETCH REVIEWS
  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching reviews:', error.message);
      } else {
        setReviews(data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // FETCH PROFILE NAME (FULL NAME) FOR USER
  const fetchProfileName = async (userId: string) => {
    if (profileNames[userId]) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      if (error) throw error;
      const fullName = data.full_name;
      setProfileNames((prev) => ({ ...prev, [userId]: fullName }));
    } catch (error) {
      console.error('Error fetching profile for user', userId, error);
    }
  };

  useEffect(() => {
    fetchEligibility();
    fetchReviews().finally(() => setLoading(false));
  }, []);

  // Whenever reviews change, fetch missing profile names.
  useEffect(() => {
    reviews.forEach((review) => {
      if (review.user_id) {
        fetchProfileName(review.user_id);
      }
    });
  }, [reviews]);

  // REALTIME SUBSCRIPTION: INSERT, UPDATE, DELETE
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        (payload: RealtimePostgresInsertPayload<Review>) => {
          fetchReviews();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reviews' },
        (payload: RealtimePostgresUpdatePayload<Review>) => {
          fetchReviews();
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reviews' },
        (payload: RealtimePostgresDeletePayload<Review>) => {
          fetchReviews();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // HANDLE SUBMIT NEW REVIEW
  const handleSubmitReview = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (!isEligible) {
        Alert.alert(
          'Review Error',
          'You must have completed a stay with us to share your experience.',
        );
        return;
      }

      // If editing, save the edited review
      if (editingReviewId) {
        await saveEditedReview();
        return;
      }

      const { error } = await supabase.from('reviews').insert([
        {
          user_id: user.id,
          booking_type: 'resort/stay',
          booking_id: null,
          rating: newRating,
          comment: newComment,
          liked_by: [],
        },
      ]);
      if (error) throw error;

      Alert.alert(
        'Thank You!',
        'Your review has been shared with the community!',
      );
      setNewComment('');
      setNewRating(5);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'An error occurred while submitting your review.');
    }
  };

  // HANDLE TOGGLE LIKE FOR A REVIEW
  const handleToggleLike = async (review: Review) => {
    if (!currentUserId) return;
    try {
      const alreadyLiked = review.liked_by.includes(currentUserId);
      const newLikedBy = alreadyLiked
        ? review.liked_by.filter((id) => id !== currentUserId)
        : [...review.liked_by, currentUserId];

      const { error } = await supabase
        .from('reviews')
        .update({ liked_by: newLikedBy })
        .eq('id', review.id);
      if (error) throw error;

      fetchReviews();
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'An error occurred while updating like status.');
    }
  };

  // HANDLE EDIT REVIEW (START, CANCEL, SAVE)
  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.comment);
    setEditingReviewRating(review.rating);
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditingReviewText('');
    setEditingReviewRating(5);
  };

  const saveEditedReview = async () => {
    if (!editingReviewId) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ comment: editingReviewText, rating: editingReviewRating })
        .eq('id', editingReviewId);
      if (error) throw error;
      Alert.alert('Review Updated', 'Your vacation memory has been updated!');
      cancelEditing();
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      Alert.alert('Error', 'An error occurred while updating your review.');
    }
  };

  // CALCULATE AVERAGE RATING
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // CALCULATE STAR DISTRIBUTION (5 -> 1)
  const starDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((item) => {
      const starIndex = 5 - item.rating;
      distribution[starIndex] += 1;
    });
    return distribution;
  }, [reviews]);

  // GET TOP 3 MOST LIKED REVIEWS
  const topLikedReviews = useMemo(() => {
    return [...reviews]
      .sort((a, b) => b.liked_by.length - a.liked_by.length)
      .slice(0, 3);
  }, [reviews]);

  const totalReviews = reviews.length;

  // RENDER STAR DISTRIBUTION ROW
  const renderStarRow = (star: number, count: number) => {
    const percentage = totalReviews === 0 ? 0 : (count / totalReviews) * 100;
    return (
      <View style={styles.starRow} key={star}>
        <View style={styles.starRowLabelContainer}>
          <Text style={styles.starRowLabel}>{star}</Text>
          <Star color="#FFD700" fill="#FFD700" size={14} />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.starCount}>{count}</Text>
      </View>
    );
  };

  // RENDER EACH REVIEW ITEM
  const renderReviewItem = ({ item }: { item: Review }) => {
    const userLiked =
      currentUserId && item.liked_by.includes(currentUserId) ? true : false;
    const reviewerName =
      profileNames[item.user_id] || `Traveler ${item.user_id.slice(0, 4)}`;
    const isEditing = editingReviewId === item.id;

    return (
      <View style={styles.reviewCard}>
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940&auto=format&fit=crop',
          }}
          style={styles.reviewCardBackground}
          imageStyle={{ opacity: 0.05, borderRadius: 16 }}
        >
          <View style={styles.reviewHeader}>
            <View style={styles.userInfo}>
              <Image
                source={{
                  uri: 'https://i.pravatar.cc/150?u=' + item.user_id,
                }}
                style={styles.avatar}
              />
              <View style={styles.userText}>
                <Text style={styles.username}>{reviewerName}</Text>
                <View style={styles.dateLocationRow}>
                  <MapPin size={12} color="#0891b2" />
                  <Text style={styles.reviewDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.starsContainer}>
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                return (
                  <Star
                    key={index}
                    color={starValue <= item.rating ? '#FFD700' : '#e2e8f0'}
                    fill={starValue <= item.rating ? '#FFD700' : 'transparent'}
                    size={16}
                  />
                );
              })}
            </View>
          </View>
          {isEditing ? (
            // EDIT MODE
            <View style={styles.editContainer}>
              <View style={styles.editStars}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setEditingReviewRating(starValue)}
                    >
                      <Star
                        color={
                          starValue <= editingReviewRating
                            ? '#FFD700'
                            : '#e2e8f0'
                        }
                        fill={
                          starValue <= editingReviewRating
                            ? '#FFD700'
                            : 'transparent'
                        }
                        size={20}
                        style={styles.starIcon}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.textInput}
                value={editingReviewText}
                onChangeText={setEditingReviewText}
                multiline
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, styles.editSubmitButton]}
                  onPress={saveEditedReview}
                >
                  <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, styles.editCancelButton]}
                  onPress={cancelEditing}
                >
                  <Text style={styles.submitButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.reviewComment}>{item.comment}</Text>
              <View style={styles.likeContainer}>
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={() => handleToggleLike(item)}
                >
                  <Heart
                    color={userLiked ? '#e11d48' : '#94a3b8'}
                    fill={userLiked ? '#e11d48' : 'transparent'}
                    size={20}
                  />
                </TouchableOpacity>
                <Text style={styles.likeCount}>{item.liked_by.length}</Text>
                {currentUserId === item.user_id && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => startEditing(item)}
                  >
                    <Edit3 size={16} color="#0891b2" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ImageBackground>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Sun size={24} color="#FFD700" />
        <Text style={styles.loadingText}>Loading paradise reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Palm Tree icon */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['rgba(8, 145, 178, 0.7)', 'rgba(8, 145, 178, 0.3)']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <TreePalm size={24} color="#ffffff" />
            <Text style={styles.headerText}>Review and Rating</Text>
            <Umbrella size={24} color="#ffffff" />
          </View>
        </LinearGradient>
      </View>

      {/* Top Section: Overall Rating & Star Distribution */}
      <View style={styles.topSection}>
        <View style={styles.overallRatingContainer}>
          <Text style={styles.overallRating}>{averageRating}</Text>
          <View style={styles.starRowInline}>
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1;
              return (
                <Star
                  key={index}
                  color={
                    starValue <= Math.round(Number(averageRating))
                      ? '#FFD700'
                      : '#e2e8f0'
                  }
                  fill={
                    starValue <= Math.round(Number(averageRating))
                      ? '#FFD700'
                      : 'transparent'
                  }
                  size={16}
                  style={{ marginRight: 2 }}
                />
              );
            })}
          </View>
          <Text style={styles.totalReviewText}>
            {totalReviews} memories shared
          </Text>
        </View>
        <View style={styles.starDistribution}>
          {renderStarRow(5, starDistribution[0])}
          {renderStarRow(4, starDistribution[1])}
          {renderStarRow(3, starDistribution[2])}
          {renderStarRow(2, starDistribution[3])}
          {renderStarRow(1, starDistribution[4])}
        </View>
      </View>

      {/* Reviews List - Top Liked Reviews */}
      <View style={styles.listHeaderRow}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Top Guest Experiences</Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/reviewrating/reviewrating')}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {reviews.length > 0 ? (
        <FlatList
          data={topLikedReviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.reviewsList}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No vacation memories shared yet.</Text>
          <Text style={styles.emptySubtext}>
            Be the first to share your experience!
          </Text>
        </View>
      )}

      {/* Your Review Form */}
      {isEligible && (
        <View style={styles.reviewForm}>
          <View style={styles.formTitleContainer}>
            <TreePalm size={18} color="#0891b2" />
            <Text style={styles.formTitle}>Share Your Resort Experience</Text>
          </View>
          <View style={styles.ratingInputContainer}>
            <Text style={styles.inputLabel}>Your Rating:</Text>
            <View style={styles.starsInput}>
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setNewRating(starValue)}
                  >
                    <Star
                      color={starValue <= newRating ? '#FFD700' : '#e2e8f0'}
                      fill={starValue <= newRating ? '#FFD700' : 'transparent'}
                      size={24}
                      style={styles.starIcon}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <TextInput
            style={[styles.textInput, styles.yourReviewTextInput]}
            placeholder="Tell us about your stay at our resort..."
            placeholderTextColor="#94a3b8"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitReview}
          >
            <Text style={styles.submitButtonText}>Share Your Experience</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerGradient: {
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
  },
  loadingText: {
    color: '#0891b2',
    marginTop: 10,
    fontSize: 16,
  },
  /* Top Section: Overall Rating & Distribution */
  topSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f0f9ff',
  },
  overallRatingContainer: {
    width: '40%',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    marginRight: 12,
    paddingRight: 12,
  },
  overallRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  starRowInline: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  totalReviewText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },
  starDistribution: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  starRowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  starRowLabel: {
    fontSize: 14,
    color: '#0f172a',
    marginRight: 2,
    fontWeight: '500',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  progressFill: {
    backgroundColor: '#0891b2',
    height: '100%',
    borderRadius: 4,
  },
  starCount: {
    width: 30,
    textAlign: 'right',
    color: '#0f172a',
    fontWeight: '500',
  },
  /* Reviews List */
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0891b2',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0f2fe',
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0891b2',
  },
  reviewsList: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  reviewCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reviewCardBackground: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#0891b2',
  },
  userText: {
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  dateLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewComment: {
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 12,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  likeButton: {
    marginRight: 6,
  },
  likeCount: {
    fontSize: 14,
    color: '#64748b',
  },
  editButton: {
    marginLeft: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    color: '#0891b2',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#64748b',
    textAlign: 'center',
    fontSize: 16,
  },
  emptySubtext: {
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  /* Review Form (Your Review) */
  reviewForm: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  formTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#0891b2',
  },
  ratingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 15,
    marginRight: 8,
    color: '#1e293b',
    fontWeight: '500',
  },
  starsInput: {
    flexDirection: 'row',
  },
  starIcon: {
    marginHorizontal: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  yourReviewTextInput: {
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  /* Edit review section */
  editContainer: {
    marginVertical: 10,
  },
  editStars: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editSubmitButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#0891b2',
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: '#94a3b8',
  },
});
