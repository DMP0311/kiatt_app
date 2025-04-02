import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star } from 'lucide-react-native';

export default function AddReviewScreen() {
  const { id, type } = useLocalSearchParams();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemDetails, setItemDetails] = useState<any>(null);

  useEffect(() => {
    fetchItemDetails();
  }, [id, type]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);

      if (type === 'room') {
        const { data, error } = await supabase
          .from('rooms')
          .select('room_type, room_number')
          .eq('id', id)
          .single();

        if (error) throw error;
        setItemDetails(data);
      } else if (type === 'service') {
        const { data, error } = await supabase
          .from('services')
          .select('name, category')
          .eq('id', id)
          .single();
        if (error) throw error;
        setItemDetails(data);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
      Alert.alert('Error', 'Failed to load details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment for your review');
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit a review');
        return;
      }

      // In a real app, you would have a reviews table
      // For now, we'll just show a success message
      setTimeout(() => {
        setSubmitting(false);
        Alert.alert('Review Submitted', 'Thank you for your feedback!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }, 1000);
    } catch (err) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {type === 'room'
              ? `${itemDetails?.room_type} (Room ${itemDetails?.room_number})`
              : itemDetails?.name}
          </Text>
          {type === 'service' && (
            <Text style={styles.itemCategory}>{itemDetails?.category}</Text>
          )}
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.sectionTitle}>Your Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Star
                  size={36}
                  color="#f59e0b"
                  fill={rating >= star ? '#f59e0b' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 1
              ? 'Poor'
              : rating === 2
              ? 'Fair'
              : rating === 3
              ? 'Good'
              : rating === 4
              ? 'Very Good'
              : 'Excellent'}
          </Text>
        </View>

        <View style={styles.commentContainer}>
          <Text style={styles.sectionTitle}>Your Review</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabledButton]}
          onPress={handleSubmitReview}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.loadingButtonContent}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
// ...
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  itemInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#64748b',
  },
  ratingContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f59e0b',
    marginTop: 8,
  },
  commentContainer: {
    marginBottom: 24,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    minHeight: 120,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
