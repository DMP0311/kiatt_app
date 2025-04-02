import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Link } from 'expo-router';

export type Room = {
  id: string;
  room_number: string;
  room_type: string;
  description: string;
  price_per_night: number;
  images: string[] | null;
};

type SuggestedItemsProps = {
  rooms: Room[];
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SuggestedItems({ rooms }: SuggestedItemsProps) {
  // Shuffle and get 4 random rooms
  const shuffledRooms = shuffleArray(rooms).slice(0, 4);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>You may be interested in</Text>
      <View style={styles.gridContainer}>
        {shuffledRooms.map((room) => (
          <Link key={room.id} href={`/room/${room.id}`} asChild>
            <TouchableOpacity style={styles.card}>
              <Image
                source={{
                  uri:
                    room.images && room.images.length > 0
                      ? room.images[0]
                      : 'https://via.placeholder.com/200x120.png?text=Room',
                }}
                style={styles.image}
              />
              <View style={styles.info}>
                <Text style={styles.title}>
                  {room.room_type} - Room {room.room_number}
                </Text>
                <Text style={styles.price}>
                  ${room.price_per_night} per night
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
  title: {
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
});
