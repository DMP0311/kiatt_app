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
  ImageBackground,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import {
  Search,
  Filter,
  Star,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Coffee,
  Palmtree,
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
  amenities?: string[];
  view_type?: string;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const ROOMS_PER_PAGE = 8;

export default function ExploreScreen() {
  // Data states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [roomCategories, setRoomCategories] = useState<string[]>([]);
  const [featuredExperiences, setFeaturedExperiences] = useState<Room[]>([]);

  // UI states
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Advanced filter modal states
  const [filterVisible, setFilterVisible] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [selectedView, setSelectedView] = useState('All');
  const viewTypes = ['All', 'Ocean', 'Garden', 'Pool', 'Mountain'];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);

  useEffect(() => {
    fetchRooms();
    fetchRoomCategories();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page whenever filters change
  }, [
    searchQuery,
    activeCategory,
    rooms,
    minPrice,
    maxPrice,
    minCapacity,
    selectedView,
  ]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_type', { ascending: true });
      if (error) throw error;

      // Add mock data cho view_type và amenities nếu chưa có
      const enhancedData = (data || []).map((room) => ({
        ...room,
        view_type:
          room.view_type ||
          ['Ocean', 'Garden', 'Pool', 'Mountain'][
            Math.floor(Math.random() * 4)
          ],
        amenities: room.amenities || [
          'Free WiFi',
          'Room Service',
          'Mini Bar',
          'Sea View',
        ],
      }));

      setRooms(enhancedData);
      setFilteredRooms(enhancedData);

      // Lấy ngẫu nhiên 3 phòng để làm Featured Experiences
      if (enhancedData.length > 0) {
        const randomRooms = enhancedData
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setFeaturedExperiences(randomRooms);
      }
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

    // Lọc theo search query
    if (query.trim() !== '') {
      filtered = filtered.filter(
        (room) =>
          room.room_number.toLowerCase().includes(query) ||
          (room.room_type && room.room_type.toLowerCase().includes(query)) ||
          room.description.toLowerCase().includes(query),
      );
    }

    // Lọc theo loại phòng (nếu không chọn "All")
    if (activeCategory !== 'All') {
      filtered = filtered.filter(
        (room) => (room.room_type || 'Standard') === activeCategory,
      );
    }

    // Lọc theo view (nếu không chọn "All")
    if (selectedView !== 'All') {
      filtered = filtered.filter((room) => room.view_type === selectedView);
    }

    // Lọc theo khoảng giá
    const minP = parseFloat(minPrice) || 0;
    const maxP = parseFloat(maxPrice) || Number.MAX_SAFE_INTEGER;
    filtered = filtered.filter(
      (room) => room.price_per_night >= minP && room.price_per_night <= maxP,
    );

    // Lọc theo sức chứa
    const minC = parseInt(minCapacity) || 0;
    if (minC > 0) {
      filtered = filtered.filter((room) => (room.capacity || 0) >= minC);
    }

    setFilteredRooms(filtered);
  };

  // Lấy danh sách phòng theo trang hiện tại
  const currentRooms = filteredRooms.slice(
    (currentPage - 1) * ROOMS_PER_PAGE,
    currentPage * ROOMS_PER_PAGE,
  );

  // Render tab Category
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

  // Render Featured Experience sử dụng dữ liệu phòng
  // const renderExperience = ({ item }: { item: Room }) => (
  //   <Link href={`/room/${item.id}`} asChild>
  //     <TouchableOpacity style={styles.experienceCard}>
  //       <Image
  //         source={{
  //           uri:
  //             item.images && item.images.length > 0
  //               ? item.images[0]
  //               : 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop',
  //         }}
  //         style={styles.experienceImage}
  //       />
  //       <View style={styles.experienceOverlay} />
  //       <View style={styles.experienceContent}>
  //         <Text style={styles.experienceTitle}>
  //           {item.room_type} Room {item.room_number}
  //         </Text>
  //         <Text style={styles.experiencePrice}>${item.price_per_night}</Text>
  //       </View>
  //     </TouchableOpacity>
  //   </Link>
  // );
  // Render Featured Experience với Link để booking phòng khi nhấn
  const renderExperience = ({ item }: { item: Room }) => (
    <Link href={`/room/${item.id}`} asChild>
      <TouchableOpacity style={styles.experienceCard}>
        <Image
          source={{
            uri:
              item.images && item.images.length > 0
                ? item.images[0]
                : 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop',
          }}
          style={styles.experienceImage}
        />
        <View style={styles.experienceOverlay} />
        <View style={styles.experienceContent}>
          <Text style={styles.experienceTitle}>
            {item.room_type} Room {item.room_number}
          </Text>
          <Text style={styles.experiencePrice}>${item.price_per_night}</Text>
          {/* Extra information: capacity and amenities */}
          <View style={styles.experienceExtraInfo}>
            <Text style={styles.experienceCapacity}>
              <Users size={12} color="#fff" /> {item.capacity || 2} Guests
            </Text>
            {item.amenities && item.amenities.length > 0 && (
              <Text style={styles.experienceAmenities}>
                {item.amenities.slice(0, 2).join(', ')}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  // Render room card
  const renderRoomCard = ({ item }: { item: Room }) => (
    <Link href={`/room/${item.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <ImageBackground
          source={{
            uri:
              item.images && item.images.length > 0
                ? item.images[0]
                : 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop',
          }}
          style={styles.cardImage}
          imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        >
          <View style={styles.viewBadge}>
            <MapPin size={12} color="#fff" />
            <Text style={styles.viewBadgeText}>{item.view_type} View</Text>
          </View>
        </ImageBackground>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.room_type} Room</Text>
          <Text style={styles.roomNumber}>Room {item.room_number}</Text>
          <View style={styles.amenitiesRow}>
            <View style={styles.amenityItem}>
              <Users size={14} color="#64748b" />
              <Text style={styles.amenityText}>{item.capacity || 2}</Text>
            </View>
            {item.amenities &&
              item.amenities.slice(0, 2).map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  {index === 0 ? (
                    <Coffee size={14} color="#64748b" />
                  ) : (
                    <Palmtree size={14} color="#64748b" />
                  )}
                  <Text style={styles.amenityText} numberOfLines={1}>
                    {amenity}
                  </Text>
                </View>
              ))}
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>${item.price_per_night}</Text>
            <Text style={styles.perNight}>/night</Text>
            <View style={styles.ratingContainer}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>
                {(4 + Math.random()).toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  // Render Pagination Controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.paginationButtonDisabled,
          ]}
          onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={20} color={currentPage === 1 ? '#ccc' : '#fff'} />
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          {currentPage} / {totalPages}
        </Text>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled,
          ]}
          onPress={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          <ChevronRight
            size={20}
            color={currentPage === totalPages ? '#ccc' : '#fff'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Header: Banner, Search Bar, Category Tabs, Experiences
  const renderHeader = () => (
    <View>
      {/* Banner */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop',
        }}
        style={styles.bannerContainer}
      >
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Paradise Resort</Text>
          <Text style={styles.bannerText}>Discover Luxury Accommodations</Text>
          <TouchableOpacity style={styles.specialOffersButton}>
            <Text style={styles.specialOffersButtonText}>Special Offers</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for your perfect stay..."
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

      {/* Featured Experiences Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Experiences</Text>
      </View>

      <FlatList
        data={featuredExperiences}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderExperience}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.experiencesContainer}
      />

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

      {/* Room list with pagination footer */}
      <FlatList
        data={currentRooms}
        renderItem={renderRoomCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContainer}
        keyboardShouldPersistTaps="always"
        ListFooterComponent={renderPagination}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rooms match your criteria</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSearchQuery('');
                setActiveCategory('All');
                setMinPrice('');
                setMaxPrice('');
                setMinCapacity('');
                setSelectedView('All');
              }}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        }
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
            <Text style={styles.modalTitle}>Refine Your Search</Text>
            <Text style={styles.modalLabel}>Price Range ($ per night)</Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.modalInput, styles.priceInput]}
                keyboardType="numeric"
                placeholder="Min"
                value={minPrice}
                onChangeText={setMinPrice}
              />
              <Text style={styles.priceSeparator}>to</Text>
              <TextInput
                style={[styles.modalInput, styles.priceInput]}
                keyboardType="numeric"
                placeholder="Max"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
            <Text style={styles.modalLabel}>Guests</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Number of guests"
              value={minCapacity}
              onChangeText={setMinCapacity}
            />
            <Text style={styles.modalLabel}>View</Text>
            <View style={styles.viewOptionsContainer}>
              {viewTypes.map((view) => (
                <TouchableOpacity
                  key={view}
                  style={[
                    styles.viewOption,
                    selectedView === view && styles.viewOptionSelected,
                  ]}
                  onPress={() => setSelectedView(view)}
                >
                  <Text
                    style={[
                      styles.viewOptionText,
                      selectedView === view && styles.viewOptionTextSelected,
                    ]}
                  >
                    {view}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    zIndex: 1,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    // Tăng chiều cao cho phần chính hiển thị danh sách phòng
    minHeight: Dimensions.get('window').height * 0.5,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginTop: 8,
  },

  // Banner styles
  bannerContainer: {
    height: 240,
    position: 'relative',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 4,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  specialOffersButton: {
    backgroundColor: '#0e7490',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  specialOffersButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginLeft: 16,
  },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0e7490',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section header styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Featured experiences styles
  experiencesContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 16,
  },
  experienceCard: {
    width: 200,
    height: 140,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  experienceExtraInfo: {
    marginTop: 4,
  },
  experienceCapacity: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 2,
  },
  experienceAmenities: {
    fontSize: 12,
    color: '#fff',
  },

  experienceImage: {
    width: '100%',
    height: '100%',
  },
  experienceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  experienceContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  experiencePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Tabs styles (Category)
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryTabActive: {
    backgroundColor: '#fff',
    borderColor: '#0e7490',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#0e7490',
    fontWeight: '600',
  },

  // Room Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 8,
    flex: 1,
    maxWidth: (SCREEN_WIDTH - 40) / 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  viewBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(14, 116, 144, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  roomNumber: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  amenitiesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0e7490',
  },
  perNight: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
  },

  // Empty state styles
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#0e7490',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0e7490',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  paginationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginHorizontal: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    color: '#1e293b',
    fontSize: 15,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceInput: {
    flex: 1,
    marginTop: 0,
  },
  priceSeparator: {
    marginHorizontal: 12,
    color: '#64748b',
  },
  viewOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  viewOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    marginBottom: 8,
  },
  viewOptionSelected: {
    backgroundColor: '#0e7490',
  },
  viewOptionText: {
    fontSize: 14,
    color: '#64748b',
  },
  viewOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#0e7490',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonCancel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalButtonCancelText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});
