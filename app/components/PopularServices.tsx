import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';

export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  images: string[] | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

type PopularServicesProps = {
  services: Service[];
};

export default function PopularServices({ services }: PopularServicesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Popular Services</Text>
        <Link href="/services" asChild>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        {services.length > 0 ? (
          services.map((service) => {
            const firstImage =
              service.images && service.images.length > 0
                ? service.images[0]
                : 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop';

            return (
              <Link key={service.id} href={`/service/${service.id}`} asChild>
                <TouchableOpacity style={styles.card}>
                  <Image source={{ uri: firstImage }} style={styles.image} />
                  <View style={styles.info}>
                    <Text style={styles.category}>{service.category}</Text>
                    <Text style={styles.name}>{service.name}</Text>
                    <Text style={styles.price}>${service.price}</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No services available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0891b2',
  },
  scrollContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  card: {
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
  image: {
    width: '100%',
    height: 120,
  },
  info: {
    padding: 12,
  },
  category: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },
  emptyState: {
    width: 200,
    height: 120,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 16,
  },
});
