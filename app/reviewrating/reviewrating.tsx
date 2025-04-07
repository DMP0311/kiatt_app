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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  Star,
  Heart,
  Edit3 as EditIcon,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import LoadingAnimation from '../components/LoadingAnimation';

type Review = {
  id: string;
  user_id: string;
  booking_type: string;
  booking_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
  liked_by: string[];
};

type Profile = {
  id: string;
  full_name: string;
};

export default function ReviewRatingPage() {
  const router = useRouter();
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

  // STATE PHÂN TRANG - Hiện 6 review mỗi trang
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 6;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

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

  // FETCH REVIEWS & RELOAD DỮ LIỆU
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
        setCurrentPage(1); // Reset lại trang về 1 sau khi load lại dữ liệu
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

  useEffect(() => {
    reviews.forEach((review) => {
      if (review.user_id) {
        fetchProfileName(review.user_id);
      }
    });
  }, [reviews]);

  // REALTIME SUBSCRIPTION
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
          'You must have a valid booking to submit a review.',
        );
        return;
      }

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
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'An error occurred while submitting your review.');
    }
  };

  // HANDLE TOGGLE LIKE
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

  // HANDLE EDIT REVIEW
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

  // CALCULATE STAR DISTRIBUTION
  const starDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((item) => {
      const starIndex = 5 - item.rating;
      distribution[starIndex] += 1;
    });
    return distribution;
  }, [reviews]);

  const totalReviews = reviews.length;
  // Tính toán reviews cho trang hiện tại
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

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

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={styles.paginationButton}
        onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={20} color={currentPage === 1 ? '#ccc' : '#0891b2'} />
      </TouchableOpacity>
      <Text style={styles.paginationText}>
        {currentPage} / {totalPages}
      </Text>
      <TouchableOpacity
        style={styles.paginationButton}
        onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight
          size={20}
          color={currentPage === totalPages ? '#ccc' : '#0891b2'}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <SafeAreaView style={styles.pageContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Reviews</Text>
        <View style={styles.headerSpacer}></View>
      </View>

      <FlatList
        data={currentReviews}
        ListHeaderComponent={() => (
          <>
            <View style={styles.container}>
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
                  <Text style={styles.totalReviewText}>
                    {totalReviews} reviews
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
              <View style={styles.listHeaderRow}>
                <Text style={styles.sectionTitle}>All Reviews</Text>
              </View>
            </View>
          </>
        )}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.reviewsList}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        )}
        ListFooterComponent={() => (
          <>
            {renderPagination()}
            {isEligible && (
              <View style={[styles.container, styles.reviewForm]}>
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
                            color={
                              starValue <= newRating ? '#fbbf24' : '#e2e8f0'
                            }
                            fill={
                              starValue <= newRating ? '#fbbf24' : 'transparent'
                            }
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
          </>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 28,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 20,
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
    fontSize: 52,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  starRowInline: {
    flexDirection: 'row',
    marginVertical: 6,
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
    marginBottom: 6,
  },
  starRowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  starRowLabel: {
    fontSize: 14,
    color: '#1e293b',
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
    color: '#1e293b',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  reviewsList: {
    paddingVertical: 10,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  userText: {
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
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
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 12,
    lineHeight: 22,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    marginRight: 6,
  },
  likeCount: {
    fontSize: 16,
    color: '#1e293b',
  },
  editButton: {
    marginLeft: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
  reviewForm: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    marginTop: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
  },
  ratingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#1e293b',
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
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  yourReviewTextInput: {
    minHeight: 100,
    padding: 14,
  },
  submitButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
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
  // Style cho phân trang
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 18,
  },
  // pageButton: {
  //   paddingVertical: 10,
  //   paddingHorizontal: 18,
  //   backgroundColor: '#0891b2',
  //   borderRadius: 10,
  //   marginHorizontal: 10,
  // },
  paginationButton: { paddingHorizontal: 12, paddingVertical: 6 },
  paginationText: { fontSize: 16, fontWeight: '500', color: '#1e293b' },

  // disabledButton: {
  //   backgroundColor: '#cbd5e1',
  // },
  // pageButtonText: {
  //   color: '#fff',
  //   fontWeight: '700',
  //   fontSize: 16,
  // },
  // pageInfo: {
  //   fontSize: 18,
  //   color: '#1e293b',
  // },
});
