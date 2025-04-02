import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
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
};

const SERVICES_PER_PAGE = 8;

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    // Reset trang mỗi khi lọc category thay đổi
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

      setServices((data as Service[]) || []);

      if (data) {
        const uniqueCategories = Array.from(
          new Set(data.map((service: Service) => service.category))
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
    currentPage * SERVICES_PER_PAGE
  );

  // Render từng service card
  const renderServiceCard = ({ item }: { item: Service }) => {
    const defaultImage =
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop';
    const firstImage =
      item.images && item.images.length > 0 ? item.images[0] : defaultImage;

    // Tính duration hiển thị (nếu có)
    let durationText = '';
    if (item.duration) {
      const parts = item.duration.split(':');
      if (parts.length === 3) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const totalMinutes = h * 60 + m;
        durationText = `${totalMinutes} min`;
      }
    }

    return (
      <Link key={item.id} href={`/service/${item.id}`} asChild>
        <TouchableOpacity style={styles.serviceCard}>
          <Image source={{ uri: firstImage }} style={styles.serviceImage} />
          <View style={styles.serviceContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.serviceFooter}>
              <Text style={styles.servicePrice}>${item.price}</Text>
              {durationText.length > 0 && (
                <View style={styles.durationContainer}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.durationText}>{durationText}</Text>
                </View>
              )}
              {!item.is_available && (
                <Text style={styles.unavailableText}>Unavailable</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  // Render Pagination Controls làm ListFooterComponent
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

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>Explore our premium services</Text>
      </View>

      {/* Thanh chọn Category */}
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
              selectedCategory === null && styles.selectedCategoryButtonText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
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

      {/* Danh sách dịch vụ dạng FlatList với pagination ở dưới */}
      <FlatList
        data={currentServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.servicesContent}
        ListFooterComponent={renderPagination}
      />

      {/* Nếu không có dịch vụ nào */}
      {filteredServices.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No services found</Text>
          <Text style={styles.emptyStateText}>
            {selectedCategory
              ? `No services available in the ${selectedCategory} category`
              : 'No services available at the moment'}
          </Text>
          {selectedCategory && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.resetButtonText}>Show all services</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  categoriesContainer: {
    maxHeight: 80,
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
    marginRight: 8,
    minHeight: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#0891b2',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    lineHeight: 18,
  },
  selectedCategoryButtonText: {
    color: '#ffffff',
  },
  servicesContent: {
    padding: 16,
    paddingTop: 0,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  serviceImage: {
    width: '100%',
    height: 180,
  },
  serviceContent: {
    padding: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  durationText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#64748b',
  },
  unavailableText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 16,
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0891b2',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontWeight: '500',
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
});
