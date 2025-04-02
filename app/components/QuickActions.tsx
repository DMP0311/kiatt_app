import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Bed, HandPlatter, Calendar } from 'lucide-react-native';

export default function QuickActions() {
  return (
    <View style={styles.quickActions}>
      <Link href="/(tabs)/explore" asChild>
        <TouchableOpacity style={styles.quickActionItem}>
          <View
            style={[styles.quickActionIcon, { backgroundColor: '#e0f2fe' }]}
          >
            <Bed size={24} color="#0891b2" />
          </View>
          <Text style={styles.quickActionText}>Rooms</Text>
        </TouchableOpacity>
      </Link>
      {/*  */}
      <Link href="/services" asChild>
        <TouchableOpacity style={styles.quickActionItem}>
          <View
            style={[styles.quickActionIcon, { backgroundColor: '#f0fdf4' }]}
          >
            <HandPlatter size={24} color="#16a34a" />
          </View>
          <Text style={styles.quickActionText}>Services</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/bookings" asChild>
        <TouchableOpacity style={styles.quickActionItem}>
          <View
            style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}
          >
            <Calendar size={24} color="#d97706" />
          </View>
          <Text style={styles.quickActionText}>Bookings</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
