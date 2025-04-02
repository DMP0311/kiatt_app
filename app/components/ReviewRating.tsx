// components/ReviewRating.tsx
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
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Star, Heart, Edit3 as EditIcon } from 'lucide-react-native';
import {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from '@supabase/supabase-js';

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

  // --------------------------
  // FETCH CURRENT USER & ELIGIBILITY
  // --------------------------
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

  // --------------------------
  // FETCH REVIEWS & RELOAD DỮ LIỆU
  // --------------------------
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

  // --------------------------
  // FETCH PROFILE NAME (FULL NAME) FOR USER
  // --------------------------
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

  // --------------------------
  // REALTIME SUBSCRIPTION: INSERT, UPDATE, DELETE
  // --------------------------
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        (payload: RealtimePostgresInsertPayload<Review>) => {
          // Reload reviews when a new review is inserted
          fetchReviews();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reviews' },
        (payload: RealtimePostgresUpdatePayload<Review>) => {
          // Reload reviews when a review is updated
          fetchReviews();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reviews' },
        (payload: RealtimePostgresDeletePayload<Review>) => {
          // Reload reviews when a review is deleted
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --------------------------
  // HANDLE SUBMIT NEW REVIEW
  // --------------------------
  const handleSubmitReview = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (!isEligible) {
        Alert.alert(
          'Review Error',
          'You must have a valid booking to submit a review.'
        );
        return;
      }

      // Nếu đang ở chế độ chỉnh sửa, gọi saveEditedReview() thay vì insert mới
      if (editingReviewId) {
        await saveEditedReview();
        return;
      }

      const { error } = await supabase.from('reviews').insert([
        {
          user_id: user.id,
          booking_type: 'room/service',
          booking_id: null,
          rating: newRating,
          comment: newComment,
          liked_by: [],
        },
      ]);
      if (error) throw error;

      Alert.alert('Review Submitted', 'Thank you for your review!');
      setNewComment('');
      setNewRating(5);
      // Reload data after insert
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'An error occurred while submitting your review.');
    }
  };

  // --------------------------
  // HANDLE TOGGLE LIKE FOR A REVIEW
  // --------------------------
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

      // Reload data after update
      fetchReviews();
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'An error occurred while updating like status.');
    }
  };

  // --------------------------
  // HANDLE EDIT REVIEW (START, CANCEL, SAVE)
  // --------------------------
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
      Alert.alert('Review Updated', 'Your review has been updated.');
      cancelEditing();
      // Reload data after update
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      Alert.alert('Error', 'An error occurred while updating your review.');
    }
  };

  // --------------------------
  // CALCULATE AVERAGE RATING
  // --------------------------
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // --------------------------
  // CALCULATE STAR DISTRIBUTION (5 -> 1)
  // --------------------------
  const starDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0]; // index 0: 5 stars, index 4: 1 star
    reviews.forEach((item) => {
      const starIndex = 5 - item.rating;
      distribution[starIndex] += 1;
    });
    return distribution;
  }, [reviews]);

  const totalReviews = reviews.length;

  // --------------------------
  // RENDER STAR DISTRIBUTION ROW
  // --------------------------
  const renderStarRow = (star: number, count: number) => {
    const percentage = totalReviews === 0 ? 0 : (count / totalReviews) * 100;
    return (
      <View style={styles.starRow} key={star}>
        <View style={styles.starRowLabelContainer}>
          <Text style={styles.starRowLabel}>{star}</Text>
          <Star color="#fbbf24" fill={'#fbbf24'} size={14} />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.starCount}>{count}</Text>
      </View>
    );
  };

  // --------------------------
  // RENDER EACH REVIEW ITEM
  // --------------------------
  const renderReviewItem = ({ item }: { item: Review }) => {
    const userLiked =
      currentUserId && item.liked_by.includes(currentUserId) ? true : false;
    const reviewerName =
      profileNames[item.user_id] || `User ${item.user_id.slice(0, 6)}`;
    const isEditing = editingReviewId === item.id;

    return (
      <View style={styles.reviewCard}>
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
              <Text style={styles.reviewDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.starsContainer}>
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1;
              return (
                <Star
                  key={index}
                  color={starValue <= item.rating ? '#fbbf24' : '#e2e8f0'}
                  fill={starValue <= item.rating ? '#fbbf24' : 'transparent'}
                  size={16}
                />
              );
            })}
          </View>
        </View>
        {isEditing ? (
          // EDIT MODE (chỉ cho chủ sở hữu review)
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
                        starValue <= editingReviewRating ? '#fbbf24' : '#e2e8f0'
                      }
                      fill={
                        starValue <= editingReviewRating
                          ? '#fbbf24'
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
                  <EditIcon size={20} color="#0891b2" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
                      ? '#fbbf24'
                      : '#e2e8f0'
                  }
                  fill={
                    starValue <= Math.round(Number(averageRating))
                      ? '#fbbf24'
                      : 'transparent'
                  }
                  size={16}
                  style={{ marginRight: 2 }}
                />
              );
            })}
          </View>
          <Text style={styles.totalReviewText}>{totalReviews} reviews</Text>
        </View>
        <View style={styles.starDistribution}>
          {renderStarRow(5, starDistribution[0])}
          {renderStarRow(4, starDistribution[1])}
          {renderStarRow(3, starDistribution[2])}
          {renderStarRow(2, starDistribution[3])}
          {renderStarRow(1, starDistribution[4])}
        </View>
      </View>

      {/* Reviews List - chỉ hiển thị 3 review mới nhất */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {reviews.length > 0 ? (
        <FlatList
          data={reviews.slice(0, 3)}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.reviewsList}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.emptyText}>No reviews yet.</Text>
      )}

      {/* Your Review Form (giao diện nhỏ gọn, hiện đại) */}
      {isEligible && (
        <View style={styles.reviewForm}>
          <Text style={styles.formTitle}>Your Review</Text>
          <View style={styles.ratingInputContainer}>
            <Text style={styles.inputLabel}>Rating:</Text>
            <View style={styles.starsInput}>
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setNewRating(starValue)}
                  >
                    <Star
                      color={starValue <= newRating ? '#fbbf24' : '#e2e8f0'}
                      fill={starValue <= newRating ? '#fbbf24' : 'transparent'}
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
            placeholder="Enter your review..."
            placeholderTextColor="#94a3b8"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitReview}
          >
            <Text style={styles.submitButtonText}>Submit Review</Text>
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
    padding: 16,
    marginVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  /* Top Section: Overall Rating & Distribution */
  topSection: {
    flexDirection: 'row',
    marginBottom: 16,
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
    color: '#0f172a',
  },
  starRowInline: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  totalReviewText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  starDistribution: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  progressFill: {
    backgroundColor: '#fbbf24',
    height: '100%',
    borderRadius: 4,
  },
  starCount: {
    width: 30,
    textAlign: 'right',
    color: '#0f172a',
  },
  /* Reviews List */
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0891b2',
  },
  reviewsList: {
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  userText: {
    justifyContent: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748b',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewComment: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 8,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    marginRight: 4,
  },
  likeCount: {
    fontSize: 14,
    color: '#0f172a',
  },
  editButton: {
    marginLeft: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    color: '#0f172a',
    marginLeft: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  /* Review Form (Your Review) */
  reviewForm: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    paddingHorizontal: 8,
    marginTop: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1e293b',
  },
  ratingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#1e293b',
  },
  starsInput: {
    flexDirection: 'row',
  },
  starIcon: {
    marginHorizontal: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  yourReviewTextInput: {
    // Điều chỉnh kích thước nhỏ gọn hơn cho "Your Review"
    minHeight: 50,
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  /* Edit review section */
  editContainer: {
    marginVertical: 8,
  },
  editStars: {
    flexDirection: 'row',
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
