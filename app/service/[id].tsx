import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star, Clock } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import LoadingAnimation from '../components/LoadingAnimation';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string | null;
  images: string[] | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [time, setTime] = useState('09:00');
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [guestCount, setGuestCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
    fetchServiceDetails();
  }, [id]);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (err) {
      console.error('Error getting current user:', err);
    }
  };

  const fetchServiceDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setService(data as Service);
    } catch (err: any) {
      console.error('Error fetching service details:', err);
      setError(err.message || 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookingModal = () => {
    if (!service) return;
    setBookingModalVisible(true);
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const showTimePicker = () => {
    setTimePickerVisible(true);
  };
  const handleConfirmTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    setTimePickerVisible(false);
  };
  const handleCancelTimePicker = () => {
    setTimePickerVisible(false);
  };

  const handleConfirmBooking = async () => {
    if (!userId || !service) {
      Alert.alert('Error', 'No user or service found.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date first.');
      return;
    }
    try {
      const totalPrice = service.price;
      const { error } = await supabase.from('service_bookings').insert([
        {
          service_id: service.id,
          user_id: userId,
          booking_date: selectedDate,
          time,
          guest_count: parseInt(guestCount, 10),
          total_price: totalPrice,
          status: 'pending',
          notes: notes || null,
        },
      ]);
      if (error) throw error;

      Alert.alert(
        'Booking Successful',
        'Your service booking has been created.',
        [
          {
            text: 'OK',
            onPress: () => {
              setBookingModalVisible(false);
              setSelectedDate(null);
              setTime('09:00');
              setGuestCount('1');
              setNotes('');
              router.replace('/(tabs)/bookings');
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message);
    }
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>
            {error || 'Service not found'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonAlt}
          >
            <Text style={styles.backButtonAltText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const defaultImage =
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop';

  // Xử lý duration "HH:MM:SS"
  let durationText = '';
  if (service.duration) {
    const parts = service.duration.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const totalMinutes = h * 60 + m;
      durationText = `${totalMinutes} minutes`;
    }
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {/* Hiển thị nhiều ảnh (nếu có) */}
          <View style={styles.imageContainer}>
            {service.images && service.images.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width: SCREEN_WIDTH }}
              >
                {service.images.map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img }}
                    style={styles.serviceImage}
                  />
                ))}
              </ScrollView>
            ) : (
              <Image
                source={{ uri: defaultImage }}
                style={styles.serviceImage}
              />
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{service.category}</Text>
            </View>

            <Text style={styles.serviceName}>{service.name}</Text>

            {/* Hard-coded rating */}
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
              </View>
              <Text style={styles.ratingText}>5.0 (20 reviews)</Text>
            </View>

            {/* Duration */}
            <View style={styles.infoContainer}>
              {durationText.length > 0 && (
                <View style={styles.infoItem}>
                  <Clock size={20} color="#64748b" />
                  <Text style={styles.infoText}>{durationText}</Text>
                </View>
              )}
              {!service.is_available && (
                <Text
                  style={[styles.infoText, { color: '#dc2626', marginTop: 4 }]}
                >
                  Currently unavailable
                </Text>
              )}
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${service.price}</Text>
              <Text style={styles.priceSubtext}>per session</Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.bookButton,
              !service.is_available && { backgroundColor: '#9ca3af' },
            ]}
            onPress={handleOpenBookingModal}
            disabled={!service.is_available}
          >
            <Text style={styles.bookButtonText}>
              {service.is_available ? 'Book Service' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Booking Modal */}
        <Modal
          visible={bookingModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setBookingModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Book This Service</Text>

                <Text style={styles.modalLabel}>Select Date</Text>
                <View style={styles.calendarWrapper}>
                  <Calendar
                    onDayPress={handleDayPress}
                    markingType="single"
                    markedDates={
                      selectedDate
                        ? {
                            [selectedDate]: {
                              selected: true,
                              selectedColor: '#0891b2',
                            },
                          }
                        : {}
                    }
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </View>

                <Text style={styles.modalLabel}>Select Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setTimePickerVisible(true)}
                >
                  <Text style={styles.timePickerText}>{time}</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={isTimePickerVisible}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onConfirm={handleConfirmTime}
                  onCancel={handleCancelTimePicker}
                />

                <Text style={styles.modalLabel}>Number of Guests</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 2"
                  keyboardType="numeric"
                  value={guestCount}
                  onChangeText={setGuestCount}
                />

                <Text style={styles.modalLabel}>Notes</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60 }]}
                  placeholder="Any special requests?"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                    onPress={() => setBookingModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleConfirmBooking}
                  >
                    <Text style={styles.modalButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { paddingBottom: 80 },
  header: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 10,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#f8fafc', // Màu nền nhạt
    marginBottom: 16,
  },
  serviceImage: {
    width: SCREEN_WIDTH,
    height: 300,
    resizeMode: 'cover',
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1e293b',
  },
  priceContainer: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  priceSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
  },
  bookButton: {
    backgroundColor: '#0891b2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonAlt: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0891b2',
    borderRadius: 8,
  },
  backButtonAltText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    color: '#1e293b',
  },
  calendarWrapper: {
    marginVertical: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  timePickerText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
});
