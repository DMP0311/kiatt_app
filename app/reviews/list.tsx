import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star, ThumbsUp } from 'lucide-react-native';

const MOCK_REVIEWS = [
  {
    id: '1',
    user_id: '123',
    item_id: '456',
    item_type: 'room',
    rating: 5,
    comment:
      'Absolutely amazing stay! The room was spotless, the bed was incredibly comfortable, and the staff was attentive to every need. Will definitely be coming back!',
    created_at: '2023-05-15T10:30:00Z',
    user: {
      full_name: 'John Smith',
      avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    item: {
      name: 'Deluxe Room',
      type: 'room',
    },
  },
  {
    id: '2',
    user_id: '124',
    item_id: '457',
    item_type: 'service',
    rating: 4,
    comment:
      'The massage service was very relaxing and professional. The therapist was skilled and attentive. Only giving 4 stars because the room was a bit too cold.',
    created_at: '2023-05-10T14:20:00Z',
    user: {
      full_name: 'Emily Johnson',
      avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    item: {
      name: 'Deep Tissue Massage',
      type: 'service',
    },
  },
  {
    id: '3',
    user_id: '125',
    item_id: '458',
    item_type: 'room',
    rating: 5,
    comment:
      'Perfect view from the balcony! The sunrise was breathtaking, and the room had all the amenities we needed. The bathroom was luxurious with high-end toiletries.',
    created_at: '2023-05-05T09:15:00Z',
    user: {
      full_name: 'Michael Brown',
      avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg',
    },
    item: {
      name: 'Ocean View Suite',
      type: 'room',
    },
  },
  {
    id: '4',
    user_id: '126',
    item_id: '459',
    item_type: 'service',
    rating: 3,
    comment:
      'The spa service was good but not exceptional. The facilities were clean but the treatment room was a bit small. The staff was friendly though.',
    created_at: '2023-04-28T16:45:00Z',
    user: {
      full_name: 'Sarah Wilson',
      avatar_url: 'https://randomuser.me/api/portraits/women/67.jpg',
    },
    item: {
      name: 'Aromatherapy Facial',
      type: 'service',
    },
  },
];

export default function ReviewsListScreen() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'rooms' | 'services'>('all');

  const filteredReviews =
    filter === 'all'
      ? reviews
      : filter === 'rooms'
      ? reviews.filter((review) => review.item_type === 'room')
      : reviews.filter((review) => review.item_type === 'service');

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilterButton,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'rooms' && styles.activeFilterButton,
          ]}
          onPress={() => setFilter('rooms')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'rooms' && styles.activeFilterText,
            ]}
          >
            Rooms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'services' && styles.activeFilterButton,
          ]}
          onPress={() => setFilter('services')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'services' && styles.activeFilterText,
            ]}
          >
            Services
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.userInfo}>
                    <Image
                      source={{ uri: review.user.avatar_url }}
                      style={styles.avatar}
                    />
                    <View>
                      <Text style={styles.userName}>
                        {review.user.full_name}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatDate(review.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        color="#f59e0b"
                        fill={i < review.rating ? '#f59e0b' : 'transparent'}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemType}>
                    {review.item_type === 'room' ? 'Room' : 'Service'}:
                  </Text>
                  <Text style={styles.itemName}>{review.item.name}</Text>
                </View>

                <Text style={styles.reviewComment}>{review.comment}</Text>

                <View style={styles.reviewFooter}>
                  <TouchableOpacity style={styles.helpfulButton}>
                    <ThumbsUp size={16} color="#64748b" />
                    <Text style={styles.helpfulText}>Helpful</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No reviews found</Text>
              <Text style={styles.emptyStateText}>
                {filter === 'all'
                  ? 'There are no reviews yet'
                  : `There are no reviews for ${filter} yet`}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#0891b2',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
  },
  activeFilterText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  reviewDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  itemInfo: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  itemType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginRight: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#1e293b',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1e293b',
    marginBottom: 16,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  helpfulText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
  },
});
