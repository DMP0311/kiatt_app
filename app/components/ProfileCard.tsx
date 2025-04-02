import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { Facebook, Twitter, Linkedin } from 'lucide-react-native'; // hoặc bất kỳ icon nào bạn dùng

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileCard() {
  const handleOpenFacebook = () => {
    Linking.openURL('https://facebook.com/dmp0311');
  };
  const handleOpenTwitter = () => {
    Linking.openURL('https://twitter.com/');
  };
  const handleOpenLinkedin = () => {
    Linking.openURL('https://www.linkedin.com/in/');
  };
  return (
    <View style={styles.cardContainer}>
      <Text style={styles.testimonialSectionTitle}>About Us</Text>
      {/* Ảnh đại diện */}
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: 'https://ytgldrpdtkrabukbtnpk.supabase.co/storage/v1/object/sign/avatars/avtdmp.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdmF0YXJzL2F2dGRtcC5qcGciLCJpYXQiOjE3NDI2NTAwMTcsImV4cCI6MTc3NDE4NjAxN30.zTq6V7qT4SysiJDkC6a69nkR8XAombURxaU0F9ds3Zc',
          }}
          style={styles.avatar}
        />
      </View>
      <Text style={styles.subtitle}>Co-founder</Text>
      <Text style={styles.name}>Duong Minh Phuong</Text>
      <Text style={styles.description}>
        If we are not dreaming big, we are held back with fear. When I learned
        to walk through my fears, I was freed to not only dream big, I started
        to live those dreams.
      </Text>

      {/* Mạng xã hội */}
      <View style={styles.socialRow}>
        <TouchableOpacity
          style={styles.socialIcon}
          onPress={handleOpenFacebook}
        >
          <Facebook size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialIcon} onPress={handleOpenTwitter}>
          <Twitter size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialIcon}
          onPress={handleOpenLinkedin}
        >
          <Linkedin size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_WIDTH = screenWidth * 0.8;
const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#e0f2fe',
    borderRadius: CARD_RADIUS,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
  },
  testimonialSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  socialIcon: {
    marginHorizontal: 8,
  },
});
