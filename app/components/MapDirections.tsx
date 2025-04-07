import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const latitude = parseFloat(process.env.EXPO_PUBLIC_LATITUDE || '0');
const longitude = parseFloat(process.env.EXPO_PUBLIC_LONGITUDE || '0');

// // Kiểm tra nếu `latitude` hoặc `longitude` bị lỗi (0 có thể là lỗi)
// if (latitude === 0 || longitude === 0) {
//   console.warn(
//     ' Biến môi trường EXPO_PUBLIC_LATITUDE hoặc EXPO_PUBLIC_LONGITUDE chưa được thiết lập!'
//   );
// }

// Thiết lập tọa độ bản đồ
const miniMapRegion = {
  latitude,
  longitude,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function MapDirections() {
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.mapSection}>
      <Text style={styles.mapSectionTitle}>Find Us</Text>
      <View style={styles.miniMapContainer}>
        <MapView style={styles.miniMap} initialRegion={miniMapRegion}>
          <Marker
            coordinate={{ latitude, longitude }}
            title="Kiatt Resort & Spa"
            description="Your perfect getaway"
          />
        </MapView>
      </View>
      <TouchableOpacity
        style={styles.directionButton}
        onPress={handleGetDirections}
      >
        <Text style={styles.directionButtonText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  mapSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  miniMapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  directionButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  directionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
