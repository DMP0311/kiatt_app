import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Lock } from 'lucide-react-native';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string) => {
  return password.length >= 8;
};

export default function RegisterScreen() {
  // State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<Video>(null);

  // Ẩn lỗi sau 3 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Validate input
  const validateInputs = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError(null);
    if (!validateInputs()) {
      return;
    }
    try {
      setLoading(true);
      console.log('Starting registration process...');

      // Tạo user qua Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber || null,
            },
          },
        }
      );

      if (signUpError) {
        console.error('Authentication error:', signUpError);
        throw signUpError;
      }

      const user = authData.user;
      if (!user) {
        throw new Error('Registration failed: Unable to create user account');
      }

      console.log('Auth record created:', user.id);

      // Thêm profile vào bảng profiles
      console.log('Inserting user data into profiles table...');
      const { error: profileInsertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            phone_number: phoneNumber || null,
            created_at: user.created_at,
          },
        ]);

      if (profileInsertError) {
        console.error('Profile insertion error:', profileInsertError);
        throw new Error(
          profileInsertError.message || 'Failed to create profile'
        );
      }

      console.log('Profile inserted successfully.');

      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        ref={videoRef}
        source={require('@/assets/bgvideo2.mp4')}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      {/* Overlay Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.35)']}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our luxury resort community</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <User size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#a1a1aa"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Mail size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#a1a1aa"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Phone size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              placeholderTextColor="#a1a1aa"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Lock size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#a1a1aa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Lock size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#a1a1aa"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.buttonText}>Creating account...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/login" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    padding: 24,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fdecea',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#0891b2',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  footerLink: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
