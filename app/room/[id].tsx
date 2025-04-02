import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
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
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Star,
  Users,
  Calendar as CalendarIcon,
  XCircle,
} from 'lucide-react-native';
import { Calendar, DateData } from 'react-native-calendars';
import PhoneInput from 'react-native-phone-number-input';
import LoadingAnimation from '../components/LoadingAnimation';
import { BlurView } from 'expo-blur';
import SuggestedItems from '../components/SuggestedItems';

type Room = {
  id: string;
  room_number: string;
  room_type: string;
  description: string;
  capacity: number;
  price_per_night: number;
  amenities: any;
  images: string[] | null;
  is_available: boolean | null;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOTTOM_SHEET_HEIGHT = 250;

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Image gallery states
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Booking states
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const phoneInputRef = useRef<PhoneInput>(null);
  const [guestCount, setGuestCount] = useState('1');
  const [specialReq, setSpecialReq] = useState('');
  const [bookedDates, setBookedDates] = useState<{ [date: string]: any }>({});
  const [rooms, setRooms] = useState<Room[]>([]);

  // Calendar states for date range selection
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});

  // Animated Bottom Sheet states
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current; // khi đóng, trượt xuống ngoài

  useEffect(() => {
    fetchRoomDetails();
  }, [id]);

  // Fetch room details
  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setRoom(data);
      const bookingData = await loadRoomBookings(data.id);
      const booked = buildMarkedDatesFromBookings(bookingData);
      setBookedDates(booked);
    } catch (err: any) {
      console.error('Error fetching room details:', err);
      setError(err.message || 'Failed to load room details');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    async function fetchRooms() {
      const { data, error } = await supabase.from('rooms').select('*');

      if (error) {
        console.error('Error fetching rooms:', error);
      } else {
        setRooms(data);
      }
    }

    fetchRooms();
  }, []);
  // Load bookings
  const loadRoomBookings = async (roomId: string) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('room_bookings')
      .select('check_in_date, check_out_date, status')
      .eq('room_id', roomId)
      .neq('status', 'cancelled')
      .lte('check_in_date', futureStr)
      .gte('check_out_date', todayStr);

    if (error) {
      console.error('Error fetching room bookings:', error);
      return [];
    }
    return data || [];
  };

  // Build marked dates for calendar from bookings
  const buildMarkedDatesFromBookings = (
    bookingData: Array<{
      check_in_date: string;
      check_out_date: string;
      status: string | null;
    }>
  ) => {
    let result: { [date: string]: any } = {};
    bookingData.forEach((bk) => {
      if (bk.status === 'cancelled') return;
      const start = new Date(bk.check_in_date);
      const end = new Date(bk.check_out_date);
      let current = new Date(start);
      while (current <= end) {
        const cString = current.toISOString().split('T')[0];
        result[cString] = {
          disabled: true,
          disableTouchEvent: true,
          customStyles: {
            container: { backgroundColor: '#ef4444' },
            text: { color: '#fff' },
          },
        };
        current.setDate(current.getDate() + 1);
      }
    });
    return result;
  };

  // Handle day press on calendar
  const handleDayPress = (day: any) => {
    const selected = day.dateString;
    if (!checkInDate) {
      setCheckInDate(selected);
      setCheckOutDate(null);
      updateMarkedDates(selected, null);
      return;
    }
    if (checkInDate && !checkOutDate) {
      if (selected <= checkInDate) {
        Alert.alert(
          'Invalid Date',
          'Check-out date must be after check-in date.'
        );
      } else {
        setCheckOutDate(selected);
        updateMarkedDates(checkInDate, selected);
      }
      return;
    }
    setCheckInDate(selected);
    setCheckOutDate(null);
    updateMarkedDates(selected, null);
  };

  // Update calendar marked dates
  const updateMarkedDates = (start: string | null, end: string | null) => {
    if (!start) {
      setMarkedDates({});
      return;
    }
    if (!end) {
      setMarkedDates({
        [start]: {
          startingDay: true,
          endingDay: true,
          color: '#0891b2',
          textColor: '#fff',
        },
      });
      return;
    }
    let temp: { [key: string]: any } = {};
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      const cString = current.toISOString().slice(0, 10);
      temp[cString] = { color: '#0ea5e9', textColor: '#fff' };
      current.setDate(current.getDate() + 1);
    }
    temp[start] = { startingDay: true, color: '#0891b2', textColor: '#fff' };
    temp[end] = { endingDay: true, color: '#0891b2', textColor: '#fff' };
    setMarkedDates(temp);
  };

  // Open booking modal (for full form)
  const handleBookNow = () => {
    if (!room) return;
    if (!room.is_available) {
      Alert.alert('Not Available', 'This room is not available for booking.');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      Alert.alert(
        'Select Dates',
        'Please select check-in and check-out dates first.'
      );
      return;
    }
    if (checkInDate >= checkOutDate) {
      Alert.alert(
        'Invalid Dates',
        'Check-out date must be after check-in date.'
      );
      return;
    }
    // Close bottom sheet (if open) before opening full booking modal
    closeSheet();
    setBookingModalVisible(true);
  };

  // Calculate nights
  const calculateNights = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    return diff > 0 ? Math.round(diff / (1000 * 3600 * 24)) : 0;
  };

  // Confirm booking (insert booking record)
  const handleConfirmBooking = async () => {
    if (!room) return;
    if (!guestName.trim() || !phoneValue.trim() || !guestCount.trim()) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }
    const numGuests = parseInt(guestCount, 10);
    if (numGuests > room.capacity) {
      Alert.alert(
        'Invalid Guest Count',
        `Number of guests cannot exceed ${room.capacity}.`
      );
      return;
    }
    const nights = calculateNights(checkInDate!, checkOutDate!);
    if (nights <= 0) {
      Alert.alert(
        'Invalid Date Range',
        'Check-out date must be after check-in date.'
      );
      return;
    }
    const totalPrice = nights * (room.price_per_night || 0);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      Alert.alert('Booking Error', 'User not authenticated.');
      return;
    }
    const userId = authData.user.id;
    try {
      const { error: bookingError } = await supabase
        .from('room_bookings')
        .insert([
          {
            room_id: room.id,
            user_id: userId,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            guest_count: parseInt(guestCount, 10),
            guest_name: guestName,
            total_price: totalPrice,
            status: 'pending',
            special_reque: specialReq || null,
            phone_number: phoneValue,
          },
        ]);
      if (bookingError) throw bookingError;
      setBookingModalVisible(false);
      setGuestName('');
      setPhoneValue('');
      setGuestCount('1');
      setSpecialReq('');
      setCheckInDate(null);
      setCheckOutDate(null);
      setMarkedDates({});
      Alert.alert('Booking Successful', 'Your booking has been created.');
      router.replace('/(tabs)/bookings');
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message);
    }
  };

  // Animated Bottom Sheet functions
  const openSheet = () => {
    setIsSheetVisible(true);
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: BOTTOM_SHEET_HEIGHT,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsSheetVisible(false);
    });
  };

  if (loading) {
    return <LoadingAnimation />;
  }
  const roomsData = room ? [room] : []; // Ví dụ: hiện tại bạn có room hiện tại
  if (error || !room) {
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
          <Text style={styles.errorMessage}>{error || 'Room not found'}</Text>
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
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2940&auto=format&fit=crop';
  const images =
    room.images && room.images.length > 0 ? room.images : [defaultImage];
  const nights =
    checkInDate && checkOutDate
      ? calculateNights(checkInDate, checkOutDate)
      : 0;
  const totalPrice = nights * (room.price_per_night || 0);

  return (
    <TouchableWithoutFeedback
      onPress={() => Keyboard.dismiss()}
      accessible={false}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {/* Image Gallery */}
          <View style={styles.imageGallery}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
            >
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailContainer}
                contentContainerStyle={styles.thumbnailContent}
              >
                {images.map((img, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      scrollRef.current?.scrollTo({
                        x: index * SCREEN_WIDTH,
                        animated: true,
                      });
                      setActiveImageIndex(index);
                    }}
                    style={[
                      styles.thumbnailButton,
                      activeImageIndex === index && styles.activeThumbnail,
                    ]}
                  >
                    <Image
                      source={{ uri: img }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Room Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.roomHeader}>
              <View>
                <Text style={styles.roomType}>{room.room_type}</Text>
                <Text style={styles.roomNumber}>Room {room.room_number}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${room.price_per_night}</Text>
                <Text style={styles.priceSubtext}>per night</Text>
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
              </View>
              <Text style={styles.ratingText}>5.0 (24 reviews)</Text>
            </View>
            <View style={styles.capacityContainer}>
              <Users size={20} color="#64748b" />
              <Text style={styles.capacityText}>
                {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'} max
              </Text>
            </View>
            <View style={styles.section}>
              <TouchableOpacity style={styles.availabilityButton}>
                <CalendarIcon size={20} color="#0891b2" />
                <Text style={styles.availabilityText}>Select Your Dates</Text>
              </TouchableOpacity>
              <Calendar
                markingType="period"
                markedDates={{ ...markedDates, ...bookedDates }}
                onDayPress={(day: DateData) => {
                  if (bookedDates[day.dateString]?.disabled) {
                    Alert.alert(
                      'Booked',
                      'This day is already booked. Please choose another day.'
                    );
                    return;
                  }
                  if (checkInDate === day.dateString) {
                    setCheckInDate(null);
                    setCheckOutDate(null);
                    setMarkedDates({});
                    return;
                  }
                  handleDayPress(day);
                }}
                minDate={new Date().toISOString().split('T')[0]}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#f1f5f9',
                  textSectionTitleColor: '#0891b2',
                  selectedDayBackgroundColor: '#0891b2',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#0891b2',
                  dayTextColor: '#1e293b',
                  textDisabledColor: '#9ca3af',
                  dotColor: '#0891b2',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#0891b2',
                  monthTextColor: '#0891b2',
                  textDayFontWeight: '600',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                }}
              />
              <View style={styles.calendarLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: '#0891b2' }]}
                  />
                  <Text style={styles.legendText}>Your Selection</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      {
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#0891b2',
                      },
                    ]}
                  />
                  <Text style={styles.legendText}>Booked</Text>
                </View>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{room.description}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesContainer}>
                {room.amenities && Array.isArray(room.amenities) ? (
                  room.amenities.map((amenity: string, index: number) => (
                    <View key={index} style={styles.amenityItem}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noAmenitiesText}>
                    No amenities listed
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.section}>
              <SuggestedItems rooms={rooms} />
            </View>
          </View>
        </ScrollView>

        {/* Minimal Sticky Summary Card */}
        {checkInDate && checkOutDate && !isSheetVisible && (
          <TouchableOpacity style={styles.stickyTrigger} onPress={openSheet}>
            <Text style={styles.stickyTriggerText}>
              {calculateNights(checkInDate, checkOutDate)} nights | Total: $
              {totalPrice} - View Summary
            </Text>
          </TouchableOpacity>
        )}

        {/* Animated Bottom Sheet with Blur Effect */}
        {isSheetVisible && (
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: sheetAnim }] },
            ]}
          >
            <BlurView
              intensity={50}
              tint="light"
              style={StyleSheet.absoluteFill}
            >
              {/* Empty view for blur background */}
            </BlurView>
            <View style={styles.sheetContent}>
              <TouchableOpacity
                style={styles.sheetCloseButton}
                onPress={closeSheet}
              >
                <XCircle size={24} color="#0891b2" />
              </TouchableOpacity>
              <View style={styles.summaryCard}>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryLabel}>Stay Duration</Text>
                  {/* <Text style={styles.summaryValue}>
                    {calculateNights(checkInDate, checkOutDate)} nights
                  </Text> */}
                  {checkInDate && checkOutDate ? (
                    <Text style={styles.summaryValue}>
                      {calculateNights(checkInDate, checkOutDate)} nights
                    </Text>
                  ) : (
                    <Text style={styles.summaryValue}>Select dates</Text>
                  )}
                </View>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryLabel}>Total Price</Text>
                  <Text style={styles.summaryValue}>${totalPrice}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.stickyButton,
                  !room.is_available && styles.disabledButton,
                ]}
                onPress={handleBookNow}
                disabled={!room.is_available}
              >
                <Text style={styles.stickyButtonText}>
                  {room.is_available ? 'Proceed to Book' : 'Not Available'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

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
                <Text style={styles.modalTitle}>Booking Form</Text>
                <Text style={styles.modalLabel}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., John Doe"
                  value={guestName}
                  onChangeText={setGuestName}
                />
                <Text style={styles.modalLabel}>Phone Number</Text>
                <PhoneInput
                  ref={phoneInputRef}
                  defaultValue={phoneValue}
                  defaultCode="US"
                  layout="first"
                  onChangeFormattedText={(formattedText) => {
                    const callingCode = phoneInputRef.current?.getCallingCode();
                    let text = formattedText;
                    if (callingCode === '84') {
                      if (text.startsWith('+84 0')) {
                        text = text.replace('+84 0', '+84 ');
                      } else if (text.startsWith('+840')) {
                        text = text.replace('+840', '+84 ');
                      }
                    }
                    setPhoneValue(text);
                  }}
                  containerStyle={styles.modalInput}
                  textContainerStyle={styles.phoneTextContainer}
                />
                <Text style={styles.modalLabel}>Number of Guests</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={`Max ${room.capacity}`}
                  keyboardType="numeric"
                  value={guestCount}
                  onChangeText={setGuestCount}
                />
                <Text style={styles.modalLabel}>Special Request</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60 }]}
                  placeholder="Any special requests?"
                  multiline
                  value={specialReq}
                  onChangeText={setSpecialReq}
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
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 160 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGallery: { backgroundColor: '#f1f5f9' },
  mainImage: { width: SCREEN_WIDTH, height: 500 },
  thumbnailContainer: { paddingHorizontal: 4, backgroundColor: '#e0f2fe' },
  thumbnailContent: { paddingHorizontal: 8 },
  thumbnailButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeThumbnail: { borderColor: '#0891b2', borderRadius: 50 },
  thumbnail: { width: '100%', height: '100%', borderRadius: 50 },
  detailsContainer: { padding: 16 },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roomType: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  roomNumber: { fontSize: 16, color: '#64748b' },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontSize: 24, fontWeight: 'bold', color: '#0891b2' },
  priceSubtext: { fontSize: 14, color: '#64748b' },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stars: { flexDirection: 'row', marginRight: 8 },
  ratingText: { fontSize: 14, color: '#64748b' },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  capacityText: { marginLeft: 8, fontSize: 14, color: '#1e293b' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: { fontSize: 16, lineHeight: 24, color: '#64748b' },
  amenitiesContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: { marginLeft: 8, fontSize: 14, color: '#1e293b' },
  noAmenitiesText: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2fe',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  availabilityText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#0891b2',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 14, color: '#475569' },
  // Minimal sticky trigger card
  stickyTrigger: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  stickyTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  // Animated Bottom Sheet styles
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_SHEET_HEIGHT,
  },
  sheetContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  sheetCloseButton: {
    alignSelf: 'flex-end',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryDetails: {
    flexDirection: 'column',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  stickyButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  stickyButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  // Booking Modal styles
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalLabel: { fontSize: 14, color: '#64748b', marginTop: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    color: '#1e293b',
    width: '100%',
  },
  phoneTextContainer: {
    paddingVertical: 0,
    borderRadius: 8,
    backgroundColor: '#f8fac',
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
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
  backButtonAltText: { color: '#ffffff', fontSize: 16, fontWeight: '500' },
});
