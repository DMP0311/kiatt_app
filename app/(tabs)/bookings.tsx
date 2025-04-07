import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CalendarDays,
  MapPin,
  Users,
  DollarSign,
  HandPlatter,
  UtensilsCrossed,
  Bed,
  Info,
} from 'lucide-react-native';
import LoadingAnimation from '../components/LoadingAnimation';
import { LinearGradient } from 'expo-linear-gradient';

/** Kiểu room_bookings */
type RoomBooking = {
  id: string; // ID booking
  room_id: string; // ID của phòng
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  guest_name: string;
  total_price: number;
  status: string | null;
  special_reque?: string | null;
  created_at?: string | null;
  room?: {
    room_number?: string;
    room_type?: string;
  };
};

type ServiceBooking = {
  id: string; // ID booking
  user_id: string;
  service_id: string;
  booking_date: string;
  time?: string;
  guest_count: number;
  total_price: number;
  status: string | null;
  notes?: string | null;
  created_at?: string | null;
  service?: {
    name?: string;
    category?: string;
  };
};

/** Kiểu unified (hợp nhất room và service) */
type UnifiedBooking = {
  type: 'room' | 'service';
  id: string; // ID của booking
  user_id: string;
  status: string | null;
  total_price: number;
  created_at?: string | null;
  guest_count?: number;

  // Thuộc tính cho room
  room_id?: string;
  check_in_date?: string;
  check_out_date?: string;
  room_number?: string;
  room_type?: string;
  special_reque?: string | null;

  // Thuộc tính cho service
  service_id?: string;
  booking_date?: string;
  time?: string;
  service_name?: string;
  service_category?: string;
  special_requests?: string | null;
};

// Placeholder images according to booking types
const getPlaceholderImage = (
  type: string,
  roomType?: string,
  serviceCategory?: string,
) => {
  if (type === 'room') {
    if (roomType?.toLowerCase().includes('villa')) {
      return 'https://images.unsplash.com/photo-1582610116397-edb318620f90?q=80&w=300';
    } else if (roomType?.toLowerCase().includes('suite')) {
      return 'https://images.unsplash.com/photo-1631049035326-57414bd8b08d?q=80&w=300';
    } else {
      return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=300';
    }
  } else {
    if (serviceCategory?.toLowerCase().includes('HandPlatter ')) {
      return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=300';
    } else if (serviceCategory?.toLowerCase().includes('dining')) {
      return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=300';
    } else {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=300';
    }
  }
};

export default function BookingsScreen() {
  const [allBookings, setAllBookings] = useState<UnifiedBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'room' | 'service'>('all');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchBookingsByTab();
    }
  }, [userId, activeTab]);

  /** Lấy user hiện tại */
  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (err) {
      console.error('Error checking user:', err);
    }
  };

  /** Tuỳ theo tab, fetch bookings */
  const fetchBookingsByTab = async () => {
    setLoading(true);
    try {
      if (!userId) return;

      if (activeTab === 'all') {
        const combined = await fetchAllRoomAndService();
        setAllBookings(combined);
      } else if (activeTab === 'room') {
        const rooms = await fetchRoomBookingsOnly();
        setAllBookings(rooms);
      } else {
        const services = await fetchServiceBookingsOnly();
        setAllBookings(services);
      }
    } catch (err) {
      console.error('Error fetching by tab:', err);
    } finally {
      setLoading(false);
    }
  };

  /** Lấy room_bookings + service_bookings => unified */
  const fetchAllRoomAndService = async (): Promise<UnifiedBooking[]> => {
    const rooms = await fetchRoomBookingsOnly();
    const services = await fetchServiceBookingsOnly();
    const combined = [...rooms, ...services];
    // Sắp xếp (mới nhất trước)
    combined.sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tB - tA;
    });
    return combined;
  };

  /** Lấy room_bookings => unified */
  const fetchRoomBookingsOnly = async (): Promise<UnifiedBooking[]> => {
    const { data, error } = await supabase
      .from('room_bookings')
      .select(
        `
        *,
        room:room_id (
          room_number,
          room_type
        )
      `,
      )
      .eq('user_id', userId)
      .order('check_in_date', { ascending: true });

    if (error) throw error;

    const unified = (data || []).map((r: RoomBooking) => ({
      type: 'room',
      id: r.id, // booking ID
      room_id: r.room_id,
      user_id: r.user_id,
      status: r.status,
      total_price: r.total_price,
      created_at: r.created_at || '',
      check_in_date: r.check_in_date,
      check_out_date: r.check_out_date,
      room_number: r.room?.room_number,
      room_type: r.room?.room_type,
      special_reque: r.special_reque,
      guest_count: r.guest_count,
    })) as UnifiedBooking[];
    return unified;
  };

  /** Lấy service_bookings => unified */
  const fetchServiceBookingsOnly = async (): Promise<UnifiedBooking[]> => {
    const { data, error } = await supabase
      .from('service_bookings')
      .select(
        `
        *,
        service:service_id (
          name,
          category
        )
      `,
      )
      .eq('user_id', userId)
      .order('booking_date', { ascending: true });

    if (error) throw error;

    const unified = (data || []).map((s: ServiceBooking) => ({
      type: 'service',
      id: s.id,
      user_id: s.user_id,
      status: s.status,
      total_price: s.total_price,
      created_at: s.created_at || '',
      service_id: s.service_id,
      booking_date: s.booking_date,
      time: s.time,
      service_name: s.service?.name,
      service_category: s.service?.category,
      special_requests: s.notes,
      guest_count: s.guest_count,
    })) as UnifiedBooking[];
    return unified;
  };

  /** Cancel => update status='cancelled' */
  const handleCancel = async (booking: UnifiedBooking) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            // Dựa vào type => update room_bookings hoặc service_bookings
            const tableName =
              booking.type === 'room' ? 'room_bookings' : 'service_bookings';

            const { error } = await supabase
              .from(tableName)
              .update({ status: 'cancelled' })
              .eq('id', booking.id);

            if (error) {
              console.log('Update error:', error);
              Alert.alert('Error', error.message);
            }
            Alert.alert('Cancelled', 'Booking status updated to cancelled.');
            // Refetch
            fetchBookingsByTab();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const formatDateOnly = (dateString?: string | null) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate nights for room bookings
  const calculateNights = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /** Màu status */
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return '#16a34a';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  /** Icon status */
  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} color="#ffffff" />;
      case 'pending':
        return <Clock size={16} color="#ffffff" />;
      case 'cancelled':
        return <XCircle size={16} color="#ffffff" />;
      default:
        return <AlertCircle size={16} color="#ffffff" />;
    }
  };

  /** Render 1 booking */
  const renderBookingItem = ({ item }: { item: UnifiedBooking }) => {
    let title = '';
    let subTitle = '';

    if (item.type === 'room') {
      title = item.room_type || 'Room';
      subTitle = item.room_number ? `Room ${item.room_number}` : 'Room Booking';
    } else {
      title = item.service_name || 'Service';
      subTitle = item.service_category || 'Service Booking';
    }

    // Get placeholder image based on booking type
    const imageUrl = getPlaceholderImage(
      item.type,
      item.room_type,
      item.service_category,
    );

    // Calculate nights for room bookings
    const nights =
      item.type === 'room'
        ? calculateNights(item.check_in_date, item.check_out_date)
        : 0;

    return (
      <View style={styles.card}>
        {/* Card Image */}
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
            style={styles.imageDarkOverlay}
          >
            <View style={styles.cardImageContent}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(item.status)}DD` },
                ]}
              >
                {getStatusIcon(item.status)}
                <Text style={styles.statusText}>
                  {item.status || 'Unknown'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.cardSubtitleContainer}>
            {item.type === 'room' ? (
              <Bed size={16} color="#0891b2" />
            ) : (
              <HandPlatter size={16} color="#0891b2" />
            )}
            <Text style={styles.cardSubtitle}>{subTitle}</Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {/* Date details */}
            <View style={styles.detailRow}>
              <CalendarDays size={16} color="#64748b" />
              <View style={styles.detailContent}>
                {item.type === 'room' ? (
                  <>
                    <Text style={styles.detailLabel}>Stay Period</Text>
                    <Text style={styles.detailValue}>
                      {formatDateOnly(item.check_in_date)} -{' '}
                      {formatDateOnly(item.check_out_date)}
                      <Text style={styles.highlightText}>
                        {' '}
                        ({nights} nights)
                      </Text>
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.detailLabel}>Booking Date</Text>
                    <Text style={styles.detailValue}>
                      {formatDateOnly(item.booking_date)}
                      {item.time && <Text> at {item.time}</Text>}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Guests */}
            <View style={styles.detailRow}>
              <Users size={16} color="#64748b" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Guests</Text>
                <Text style={styles.detailValue}>
                  {item.guest_count || 1} person(s)
                </Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.detailRow}>
              <DollarSign size={16} color="#64748b" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Total Price</Text>
                <Text style={styles.priceValue}>${item.total_price}</Text>
              </View>
            </View>

            {/* Special Requests/Notes */}
            {((item.special_reque && item.type === 'room') ||
              (item.special_requests && item.type === 'service')) && (
              <View style={styles.detailRow}>
                <Info size={16} color="#64748b" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    {item.type === 'room' ? 'Special Requests' : 'Notes'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {item.type === 'room'
                      ? item.special_reque
                      : item.special_requests}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          {item.type === 'room' ? (
            <Link href={`/room/${item.room_id}`} asChild>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Room</Text>
              </TouchableOpacity>
            </Link>
          ) : (
            <Link href={`/service/${item.service_id}`} asChild>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Service</Text>
              </TouchableOpacity>
            </Link>
          )}
          {item.status !== 'cancelled' && item.status !== 'confirmed' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Backdrop Header */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1080',
        }}
        style={styles.headerBackground}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Trips</Text>
            <Text style={styles.subtitle}>
              Manage your bookings and reservations
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Tabs with icons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'all' && styles.activeTabText,
            ]}
          >
            All Trips
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'room' && styles.activeTab]}
          onPress={() => setActiveTab('room')}
        >
          <Bed size={14} color={activeTab === 'room' ? '#ffffff' : '#64748b'} />
          <Text
            style={[
              styles.tabText,
              activeTab === 'room' && styles.activeTabText,
            ]}
          >
            Stays
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'service' && styles.activeTab]}
          onPress={() => setActiveTab('service')}
        >
          <HandPlatter
            size={14}
            color={activeTab === 'service' ? '#ffffff' : '#64748b'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'service' && styles.activeTabText,
            ]}
          >
            Experiences
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={allBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: 'https://img.icons8.com/fluency/96/suitcase.png' }}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No trips found</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? "You don't have any bookings yet. Start planning your dream vacation!"
                : activeTab === 'room'
                  ? "You don't have any room bookings. Check out our amazing stays!"
                  : "You don't have any experiences booked. Discover exciting activities!"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/** Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBackground: {
    height: 160,
  },
  headerGradient: {
    height: '100%',
    justifyContent: 'flex-end',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#f1f5f9',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
  },
  activeTab: {
    backgroundColor: '#0891b2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    height: 150,
    width: '100%',
  },
  imageDarkOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImageContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#0891b2',
    marginLeft: 6,
    fontWeight: '500',
  },
  detailsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
  },
  highlightText: {
    color: '#0891b2',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  viewButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 16,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#ffffff',
    textTransform: 'capitalize',
  },
});
