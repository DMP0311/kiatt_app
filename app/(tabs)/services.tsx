// services.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import LoadingAnimation from '../components/LoadingAnimation';
import {
  ArrowLeft,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  Users,
  MoreHorizontal,
  Bell,
} from 'lucide-react-native';

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
  rating?: number; // Added for rating display
  popular?: boolean; // Added to mark popular services
};

const SERVICES_PER_PAGE = 6;

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]); // State cho 3 featured services
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    // Reset to page 1 when category filter changes
    setCurrentPage(1);
  }, [selectedCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Add mock ratings and popular flag to some services
      const enhancedData = ((data as Service[]) || []).map((service) => ({
        ...service,
        rating: parseFloat((3.0 + Math.random() * 1.5).toFixed(1)),
        popular: Math.random() > 0.7,
      }));

      setServices(enhancedData);

      if (enhancedData.length > 0) {
        const shuffled = [...enhancedData].sort(() => Math.random() - 0.5);
        const randomFeatured = shuffled.slice(0, 3);
        setFeaturedServices(randomFeatured);
      }

      if (data) {
        const uniqueCategories = Array.from(
          new Set(data.map((service: Service) => service.category)),
        );
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = selectedCategory
    ? services.filter((service) => service.category === selectedCategory)
    : services;

  const totalPages = Math.ceil(filteredServices.length / SERVICES_PER_PAGE);
  const currentServices = filteredServices.slice(
    (currentPage - 1) * SERVICES_PER_PAGE,
    currentPage * SERVICES_PER_PAGE,
  );

  const renderFeaturedPackage = ({ item }: { item: Service }) => {
    const defaultImage =
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop';
    const firstImage =
      item.images && item.images.length > 0 ? item.images[0] : defaultImage;

    return (
      <Link key={item.id} href={`/service/${item.id}`} asChild>
        <TouchableOpacity style={styles.featuredCard}>
          <ImageBackground
            source={{ uri: firstImage }}
            style={styles.featuredImage}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.featuredOverlay} />
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTitle}>{item.name}</Text>
              <View style={styles.featuredDetails}>
                <View style={styles.featuredPriceContainer}>
                  <Text style={styles.featuredPrice}>${item.price}</Text>
                  <Text style={styles.featuredPerson}>/person</Text>
                </View>
                <View style={styles.featuredDurationContainer}>
                  <Clock size={14} color="#fff" />
                  <Text style={styles.featuredDuration}>
                    {item.duration ? item.duration : 'N/A'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </Link>
    );
  };

  const renderServiceCard = ({ item }: { item: Service }) => {
    const defaultImage =
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop';
    const firstImage =
      item.images && item.images.length > 0 ? item.images[0] : defaultImage;

    return (
      <Link key={item.id} href={`/service/${item.id}`} asChild>
        <TouchableOpacity style={styles.serviceCard}>
          <View style={styles.serviceImageContainer}>
            <Image source={{ uri: firstImage }} style={styles.serviceImage} />
            {item.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Popular</Text>
              </View>
            )}
          </View>
          <View style={styles.serviceContent}>
            <View style={styles.serviceHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              )}
            </View>

            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.serviceFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.servicePrice}>${item.price}</Text>
                <Text style={styles.perPerson}>/person</Text>
              </View>

              {item.duration && (
                <View style={styles.durationContainer}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              )}

              {!item.is_available && (
                <View style={styles.unavailableContainer}>
                  <Text style={styles.unavailableText}>Unavailable</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  // Render Pagination Controls (giữ nguyên)
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

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header with resort branding */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Experiences</Text>
            <Text style={styles.subtitle}>Discover Paradise</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={22} color="#1e293b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main scroll content */}
      <FlatList
        data={currentServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={() => (
          <>
            {/* Featured services section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Packages</Text>
            </View>

            {/* Horizontal scrolling featured services */}
            <FlatList
              horizontal
              data={featuredServices}
              renderItem={renderFeaturedPackage}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            />

            {/* Category filter section */}
            <View style={styles.categorySectionHeader}>
              <Text style={styles.sectionTitle}>Resort Services</Text>
              <TouchableOpacity>
                <MoreHorizontal size={20} color="#0e7490" />
              </TouchableOpacity>
            </View>

            {/* Category tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === null && styles.selectedCategoryButton,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === null &&
                      styles.selectedCategoryButtonText,
                  ]}
                >
                  All Experiences
                </Text>
              </TouchableOpacity>

              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category &&
                      styles.selectedCategoryButton,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category &&
                        styles.selectedCategoryButtonText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        ListFooterComponent={renderPagination}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94',
              }}
              style={styles.emptyStateImage}
            />
            <Text style={styles.emptyStateTitle}>No services found</Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory
                ? `No experiences available in the ${selectedCategory} category`
                : 'No resort experiences available at the moment'}
            </Text>
            {selectedCategory && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.resetButtonText}>Show All Experiences</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0e7490',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Section header styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Featured packages styles
  featuredContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  featuredCard: {
    width: 260,
    height: 180,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredPerson: {
    fontSize: 12,
    color: '#e2e8f0',
    marginLeft: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredDuration: {
    marginLeft: 4,
    fontSize: 12,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredButton: {
    backgroundColor: 'rgba(14, 116, 144, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  featuredButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Category styles
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectedCategoryButton: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0e7490',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  selectedCategoryButtonText: {
    color: '#0e7490',
    fontWeight: '600',
  },

  // Service card styles
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceImageContainer: {
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: 180,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceContent: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#0e7490',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0e7490',
  },
  perPerson: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 2,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  durationText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#64748b',
  },
  unavailableContainer: {
    marginLeft: 'auto',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#0e7490',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 24,
  },
  emptyStateImage: {
    width: 200,
    height: 150,
    marginBottom: 24,
    borderRadius: 12,
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
    marginBottom: 16,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0e7490',
    borderRadius: 24,
  },
  resetButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
});
