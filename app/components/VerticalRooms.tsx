import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Heart } from 'lucide-react-native';

export type Room = {
  id: string;
  room_number: string;
  room_type: string;
  description: string;
  price_per_night: number;
  images: string[] | null;
};

type VerticalRoomsProps = {
  rooms: Room[];
};

export default function VerticalRooms({ rooms }: VerticalRoomsProps) {
  return (
    <View style={styles.verticalList}>
      {rooms.length > 0 ? (
        rooms.map((room) => (
          <Link key={room.id} href={`./room/${room.id}`} asChild>
            <TouchableOpacity style={styles.roomVerticalCard}>
              {/* Ảnh phòng */}
              <View style={styles.roomImageContainer}>
                <Image
                  source={{
                    uri:
                      room.images && room.images.length > 0
                        ? room.images[0]
                        : 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2940&auto=format&fit=crop',
                  }}
                  style={styles.roomVerticalImage}
                />
                {/* Icon tim ở góc trên phải (nếu muốn) */}
                <TouchableOpacity style={styles.heartIconContainer}>
                  <Heart size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Thông tin phòng */}
              <View style={styles.roomVerticalInfo}>
                <Text style={styles.roomName} numberOfLines={1}>
                  {room.room_type} — Room {room.room_number}
                </Text>
                <Text style={styles.roomLocation} numberOfLines={1}>
                  New York City • Show on map
                </Text>

                {/* Giá & Rating */}
                <View style={styles.priceRatingContainer}>
                  <Text style={styles.roomPrice}>${room.price_per_night}</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>5</Text>
                    <Text style={styles.starText}>★</Text>
                  </View>
                </View>

                {/* Nút Book */}
                <TouchableOpacity style={styles.bookButton}>
                  <Link href={`./room/${room.id}`} asChild>
                    <Text style={styles.bookButtonText}>Book</Text>
                  </Link>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Link>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No rooms available</Text>
        </View>
      )}
    </View>
  );
}
// ...
const styles = StyleSheet.create({
  verticalList: {
    // Nếu cần thêm margin hoặc padding, chỉnh ở đây
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
  roomPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },
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
});
