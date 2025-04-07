// components/ReviewCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Star, Heart, Edit3 as EditIcon } from 'lucide-react-native';

export type Review = {
  id: string;
  user_id: string;
  booking_type: string;
  booking_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
  liked_by: string[];
};

type ReviewCardProps = {
  review: Review;
  reviewerName: string;
  currentUserId: string | null;
  isEditing: boolean;
  editingReviewText: string;
  editingReviewRating: number;
  onToggleLike: (review: Review) => void;
  onStartEditing: (review: Review) => void;
  onChangeEditingText: (text: string) => void;
  onChangeEditingRating: (rating: number) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
};

export default function ReviewCard({
  review,
  reviewerName,
  currentUserId,
  isEditing,
  editingReviewText,
  editingReviewRating,
  onToggleLike,
  onStartEditing,
  onChangeEditingText,
  onChangeEditingRating,
  onSaveEditing,
  onCancelEditing,
}: ReviewCardProps) {
  const userLiked = currentUserId
    ? review.liked_by.includes(currentUserId)
    : false;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?u=' + review.user_id }}
            style={styles.avatar}
          />
          <View style={styles.userText}>
            <Text style={styles.username}>{reviewerName}</Text>
            <Text style={styles.reviewDate}>
              {new Date(review.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.starsContainer}>
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;
            return (
              <Star
                key={index}
                color={starValue <= review.rating ? '#fbbf24' : '#e2e8f0'}
                fill={starValue <= review.rating ? '#fbbf24' : 'transparent'}
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
                  onPress={() => onChangeEditingRating(starValue)}
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
            onChangeText={onChangeEditingText}
            multiline
          />
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[styles.submitButton, styles.editSubmitButton]}
              onPress={onSaveEditing}
            >
              <Text style={styles.submitButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, styles.editCancelButton]}
              onPress={onCancelEditing}
            >
              <Text style={styles.submitButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.reviewComment}>{review.comment}</Text>
          <View style={styles.likeContainer}>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => onToggleLike(review)}
            >
              <Heart
                color={userLiked ? '#e11d48' : '#94a3b8'}
                fill={userLiked ? '#e11d48' : 'transparent'}
                size={20}
              />
            </TouchableOpacity>
            <Text style={styles.likeCount}>{review.liked_by.length}</Text>
            {currentUserId === review.user_id && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onStartEditing(review)}
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
}

const styles = StyleSheet.create({
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
  /* Edit Mode Styles */
  editContainer: {
    marginVertical: 8,
  },
  editStars: {
    flexDirection: 'row',
    marginBottom: 8,
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
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
