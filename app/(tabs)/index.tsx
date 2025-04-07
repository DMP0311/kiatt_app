import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Video, ResizeMode } from 'expo-av';
import { ChevronsDown } from 'lucide-react-native';
import ProfileCard from '../components/ProfileCard';
import FAQItem from '../components/FAQItem';
import MapDirections from '../components/MapDirections';
import Footer from '../components/Footer';
import VerticalRooms from '../components/VerticalRooms';
import PopularServices, { Service } from '../components/PopularServices';
import QuickActions from '../components/QuickActions';
import LoadingAnimation from '../components/LoadingAnimation';
import ReviewRating from '../components/ReviewRating';
import WeatherForecast from '../components/WeatherForecast';

type Room = {
  id: string;
  room_number: string;
  room_type: string;
  description: string;
  price_per_night: number;
  images: string[] | null;
};

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
// const SNAP_OFFSET = screenHeight * 0.6789;
const SNAP_OFFSET = screenHeight - 400;

export default function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Dùng để xác định vị trí cuộn
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  // Animated opacity cho icon chevrons-down
  const chevronsOpacity = scrollY.interpolate({
    inputRange: [0, SNAP_OFFSET * 0.8],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Animated scale cho icon: từ 1 đến 2 đến 3 khi đến ngưỡng
  const iconScale = scrollY.interpolate({
    inputRange: [0, SNAP_OFFSET],
    outputRange: [1, 3],
    extrapolate: 'clamp',
  });
  // Animated value cho hiệu ứng nhấp nháy
  const blinkAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Bắt đầu hiệu ứng nhấp nháy (loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnimation, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  useEffect(() => {
    checkUser();
    fetchFeaturedRooms();
    fetchPopularServices();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
    } catch (err) {
      console.error('Error checking user:', err);
    }
  };
  // Hàm trộn (shuffle) mảng
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array]; // copy để tránh mutate
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const fetchFeaturedRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_available', true)
        .order('price_per_night', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) {
        // Trộn (shuffle) danh sách phòng
        const shuffled = shuffleArray(data);
        // Chọn ngẫu nhiên 3 hoặc 4
        const randomCount = Math.floor(Math.random() * 2) + 3;
        // Cắt mảng
        const selected = shuffled.slice(0, randomCount);
        setFeaturedRooms(selected);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const fetchPopularServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .limit(10);

      if (error) throw error;
      if (data) {
        const shuffled = shuffleArray(data);
        const randomCount = Math.floor(Math.random() * 2) + 3; // 3 hoặc 4
        const selected = shuffled.slice(0, randomCount);
        setPopularServices(selected);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching services:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y < SNAP_OFFSET) {
      // Tính khoảng cách tới 0 và SNAP_OFFSET
      const distToTop = y;
      const distToSnap = Math.abs(SNAP_OFFSET - y);

      // Snap về vị trí gần hơn
      if (distToTop < distToSnap) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        scrollRef.current?.scrollTo({ y: SNAP_OFFSET, animated: true });
      }
    }
  };
  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <ScrollView
        ref={scrollRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false} // Ngăn overscroll ở iOS
        overScrollMode="never" // Ngăn overscroll ở Android
      >
        {/* PHẦN VIDEO CỐ ĐỊNH */}
        <View style={styles.videoContainer}>
          <Video
            source={require('@/assets/bgvideo.mp4')}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
          {/* Overlay mờ & Tiêu đề chào mừng */}
          <View style={styles.overlay}>
            {/* DỰ BÁO THỜI TIẾT */}
            <WeatherForecast />
            <Text style={styles.mainGreeting}>
              Welcome to Kiatt
              {profile?.full_name ? `, ${profile.full_name}` : ''}
            </Text>
            <Text style={styles.subGreeting}>
              Discover luxury and tranquility in paradise
            </Text>

            {/* Icon ChevronsDown sẽ fade out khi cuộn xuống */}
            <Animated.View
              style={{
                marginTop: 15,
                opacity: Animated.multiply(chevronsOpacity, blinkAnimation),
                transform: [{ scale: iconScale }],
              }}
            >
              <ChevronsDown size={32} color="#fff" />
            </Animated.View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Quick Actions */}
          <QuickActions />
          {/* Featured Rooms */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Rooms</Text>
            <Link href="/(tabs)/explore" asChild>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <VerticalRooms rooms={featuredRooms} />

          {/* Popular Services */}
          <PopularServices services={popularServices} />
          {/* Review & Rating */}
          <ReviewRating />
          {/* about us */}
          <ProfileCard />
          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <View style={styles.faqContainer}>
              <FAQItem
                question="1. What is the check-in/check-out time?"
                answer="Check-in is from 2:00 PM and check-out is until 12:00 PM. Early check-in or late check-out may be arranged upon request."
              />
              <FAQItem
                question="2. Do you offer airport shuttle service?"
                answer="Yes, we provide airport shuttle service at an additional charge. Please contact our front desk for more information."
              />
              <FAQItem
                question="3. Can I cancel or modify my booking?"
                answer="We have flexible cancellation policies depending on the rate plan. Please refer to your booking confirmation or contact us for assistance."
              />
            </View>
          </View>

          {/* MAP MINI + GET DIRECTIONS */}
          <MapDirections />

          {/* FOOTER */}
          {/* <Footer /> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // MÀN HÌNH CHÍNH
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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

  // PHẦN VIDEO
  videoContainer: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: screenHeight * 0.15, // Đẩy text lên ~15% từ đáy
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  mainGreeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: '#f1f5f9',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // NỘI DUNG BÊN DƯỚI
  contentContainer: {
    width: screenWidth,
    minHeight: screenHeight,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // QUICK ACTIONS
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },

  // SECTIONS
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0891b2',
  },
  horizontalList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  // VERTICAL LIST (Featured Rooms)
  verticalList: {
    // top margin tùy ý
  },
  roomVerticalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,

    // Cao hơn 1 chút để room hiển thị đầy đủ
    width: '100%',
  },
  roomImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: '#ccc',
  },
  roomVerticalImage: {
    width: '100%',
    height: '100%',
  },
  heartIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  roomVerticalInfo: {
    padding: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  roomLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  priceRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  // roomPrice: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   color: '#0ea5e9',
  // },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
    marginRight: 4,
  },
  starText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  bookButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // CARD ROOM
  roomCard: {
    width: 240,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roomImage: {
    width: '100%',
    height: 140,
  },
  roomInfo: {
    padding: 12,
  },
  roomType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  roomNumber: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },

  // CARD SERVICE
  serviceCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  serviceImage: {
    width: '100%',
    height: 120,
  },
  serviceInfo: {
    padding: 12,
  },
  serviceCategory: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },

  // EMPTY STATE
  emptyState: {
    width: 240,
    height: 180,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 16,
  },
  faqContainer: {
    marginTop: 16,
  },
});
