import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Dimensions,
  Keyboard,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import {
  Search,
  Filter,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import LoadingAnimation from '../components/LoadingAnimation';

type Room = {
  id: string;
  room_number: string;
  room_type: string;
  description: string;
  price_per_night: number;
  images: string[] | null;
  capacity?: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const ROOMS_PER_PAGE = 10;

export default function ExploreScreen() {
  // Data states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [roomCategories, setRoomCategories] = useState<string[]>([]);

  // UI states
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Advanced filter modal states
  const [filterVisible, setFilterVisible] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minCapacity, setMinCapacity] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);

  useEffect(() => {
    fetchRooms();
    fetchRoomCategories();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset về trang đầu mỗi khi filter thay đổi
  }, [searchQuery, activeCategory, rooms, minPrice, maxPrice, minCapacity]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_type', { ascending: true });
      if (error) throw error;
      setRooms(data || []);
      setFilteredRooms(data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomCategories = async () => {
    try {
      const { data, error } = await supabase.from('rooms').select('room_type');
      if (error) throw error;
      const types =
        data?.map((room: { room_type: string }) => room.room_type) || [];
      const uniqueTypes = Array.from(new Set(types));
      setRoomCategories(['All', ...uniqueTypes]);
    } catch (err) {
      console.error('Error fetching room categories:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...rooms];
    const query = searchQuery.toLowerCase();

    // Lọc theo từ khóa
    if (query.trim() !== '') {
      filtered = filtered.filter(
        (room) =>
          room.room_number.toLowerCase().includes(query) ||
          (room.room_type && room.room_type.toLowerCase().includes(query)) ||
          room.description.toLowerCase().includes(query)
      );
    }

    // Lọc theo loại phòng (nếu không phải "All")
    if (activeCategory !== 'All') {
      filtered = filtered.filter(
        (room) => (room.room_type || 'Standard') === activeCategory
      );
    }

    // Lọc theo giá
    const minP = parseFloat(minPrice) || 0;
    const maxP = parseFloat(maxPrice) || Number.MAX_SAFE_INTEGER;
    filtered = filtered.filter(
      (room) => room.price_per_night >= minP && room.price_per_night <= maxP
    );

    // Lọc theo sức chứa (nếu có)
    const minC = parseInt(minCapacity) || 0;
    if (minC > 0) {
      filtered = filtered.filter((room) => (room.capacity || 0) >= minC);
    }

    setFilteredRooms(filtered);
  };

  // Phân trang: Lấy danh sách phòng của trang hiện tại
  const currentRooms = filteredRooms.slice(
    (currentPage - 1) * ROOMS_PER_PAGE,
    currentPage * ROOMS_PER_PAGE
  );

  // Render tab loại phòng
  const renderCategoryTab = ({ item }: { item: string }) => {
    const isActive = item === activeCategory;
    return (
      <TouchableOpacity
        style={[styles.categoryTab, isActive && styles.categoryTabActive]}
        onPress={() => setActiveCategory(item)}
      >
        <Text
          style={[
            styles.categoryTabText,
            isActive && styles.categoryTabTextActive,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render card phòng trong grid 2 cột
  const renderRoomCard = ({ item }: { item: Room }) => (
    <Link href={`/room/${item.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <Image
          source={{
            uri:
              item.images && item.images.length > 0
                ? item.images[0]
                : 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2940&auto=format&fit=crop',
          }}
          style={styles.cardImage}
        />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>Room {item.room_number}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>${item.price_per_night}/night</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  // Render Pagination Controls (sẽ được đặt làm ListFooterComponent)
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={styles.paginationButton}
          onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft
            size={20}
            color={currentPage === 1 ? '#ccc' : '#0891b2'}
          />
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          {currentPage} / {totalPages}
        </Text>
        <TouchableOpacity
          style={styles.paginationButton}
          onPress={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          <ChevronRight
            size={20}
            color={currentPage === totalPages ? '#ccc' : '#0891b2'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Header: Banner, Search Bar, Category Tabs
  const renderHeader = () => (
    <View>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940&auto=format&fit=crop',
          }}
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay} />
        <Text style={styles.bannerText}>Find Your Perfect Room</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by room number, type, or description..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          blurOnSubmit={false}
          onSubmitEditing={() => Keyboard.dismiss()}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Filter size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <FlatList
        data={roomCategories}
        horizontal
        keyExtractor={(item) => item}
        renderItem={renderCategoryTab}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      />
    </View>
  );

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>{renderHeader()}</View>

      {/* Danh sách phòng dạng grid kèm Pagination Footer */}
      <FlatList
        data={currentRooms}
        renderItem={renderRoomCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContainer}
        keyboardShouldPersistTaps="always"
        ListFooterComponent={renderPagination}
      />

      {/* Advanced Filter Modal */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Advanced Filters</Text>

            <Text style={styles.modalLabel}>Min Price ($)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="e.g., 50"
              value={minPrice}
              onChangeText={setMinPrice}
            />

            <Text style={styles.modalLabel}>Max Price ($)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="e.g., 300"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />

            <Text style={styles.modalLabel}>Min Capacity</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="e.g., 2"
              value={minCapacity}
              onChangeText={setMinCapacity}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonReset]}
                onPress={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setMinCapacity('');
                  setFilterVisible(false);
                }}
              >
                <Text
                  style={[styles.modalButtonText, styles.modalButtonResetText]}
                >
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { zIndex: 1 },
  gridContainer: { paddingHorizontal: 8, paddingBottom: 24 },
  columnWrapper: { justifyContent: 'space-between' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },

  // Banner styles
  bannerContainer: { height: 180, position: 'relative', marginBottom: 16 },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bannerText: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  searchIcon: { marginLeft: 12 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 60,
    fontSize: 16,
    color: '#1e293b',
  },
  filterButton: {
    position: 'absolute',
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs styles
  tabsContainer: { paddingHorizontal: 16, marginBottom: 12 },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabActive: { backgroundColor: '#0891b2' },
  categoryTabText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  categoryTabTextActive: { color: '#fff' },

  // Room Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 8,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  cardImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardBody: { padding: 12 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#0891b2' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },

  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  paginationButton: { paddingHorizontal: 12, paddingVertical: 6 },
  paginationText: { fontSize: 16, fontWeight: '500', color: '#1e293b' },

  // Modal styles
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
  modalButtonReset: { backgroundColor: '#ef4444' },
  modalButtonResetText: { color: '#fff' },
});
