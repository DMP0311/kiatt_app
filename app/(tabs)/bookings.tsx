import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react-native';
import LoadingAnimation from '../components/LoadingAnimation';

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
      `
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
      `
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
        return <CheckCircle size={16} color="#16a34a" />;
      case 'pending':
        return <Clock size={16} color="#f59e0b" />;
      case 'cancelled':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <AlertCircle size={16} color="#64748b" />;
    }
  };

  /** Render 1 booking */
  const renderBookingItem = ({ item }: { item: UnifiedBooking }) => {
    let title = '';
    let subTitle = '';
    let dateLabel = '';
    let dateValue = '';

    if (item.type === 'room') {
      title = item.room_type || 'Room';
      subTitle = item.room_number ? `Room ${item.room_number}` : 'Room Booking';
      dateLabel = 'Check-in';
      dateValue = item.check_in_date || '';
    } else {
      title = item.service_name || 'Service';
      subTitle = 'Service Booking';
      dateLabel = 'Booking Date';
      dateValue = item.booking_date || '';
    }

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subTitle}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}
          >
            {getStatusIcon(item.status)}
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Text style={styles.label}>{dateLabel}:</Text>
            <Text style={styles.value}>{formatDateOnly(dateValue)}</Text>
          </View>
          {item.type === 'room' && item.check_out_date && (
            <View style={styles.row}>
              <Text style={styles.label}>Check-out:</Text>
              <Text style={styles.value}>
                {formatDateOnly(item.check_out_date)}
              </Text>
            </View>
          )}

          {item.type === 'service' && item.time && (
            <View style={styles.row}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>{item.time}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Total:</Text>
            <Text style={[styles.value, styles.priceValue]}>
              ${item.total_price}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Booked At:</Text>
            <Text style={styles.value}>{formatDateOnly(item.created_at)}</Text>
          </View>
          {/* Special requests cho room hoặc service tuỳ cột */}
          {item.special_reque && item.type === 'room' && (
            <View
              style={[styles.row, { flexDirection: 'column', marginTop: 8 }]}
            >
              <Text style={styles.label}>Special Requests:</Text>
              <Text style={styles.value}>{item.special_reque}</Text>
            </View>
          )}
          {item.special_requests && item.type === 'service' && (
            <View
              style={[styles.row, { flexDirection: 'column', marginTop: 8 }]}
            >
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{item.special_requests}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
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
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {/* Tabs: all, room, service */}
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
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'room' && styles.activeTab]}
          onPress={() => setActiveTab('room')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'room' && styles.activeTabText,
            ]}
          >
            Room
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'service' && styles.activeTab]}
          onPress={() => setActiveTab('service')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'service' && styles.activeTabText,
            ]}
          >
            Service
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
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? "You don't have any bookings yet."
                : activeTab === 'room'
                ? "You don't have any room bookings."
                : "You don't have any service bookings."}
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
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#e2e8f0',
  },
  activeTab: {
    backgroundColor: '#0891b2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  cardBody: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 4,
  },
  value: {
    fontSize: 14,
    color: '#1e293b',
  },
  priceValue: {
    color: '#0891b2',
    fontWeight: 'bold',
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
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});
