import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Footer from '../components/Footer';
import {
  Settings,
  LogOut,
  ChevronRight,
  User,
  Mail,
  Phone,
  Star,
  Shield,
  CreditCard,
  KeyRound,
} from 'lucide-react-native';
import LoadingAnimation from '../components/LoadingAnimation';

type Profile = {
  id: string;
  full_name: string | null;
  email?: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  created_at?: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State chỉnh sửa thông tin cá nhân
  const [editing, setEditing] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // State cho đổi mật khẩu (hiển thị khi nhấn mục Change Password)
  const [changePassVisible, setChangePassVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error('User fetch error:', userError);
        throw userError;
      }
      if (!user) {
        console.log('No authenticated user found');
        router.replace('/login');
        return;
      }
      console.log('Fetching profile for user ID:', user.id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }
      setProfile(profileData);
      setNewFullName(profileData.full_name || '');
      setNewPhone(profileData.phone_number || '');
    } catch (err: any) {
      console.error('Error in fetchProfile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.replace('/login');
          } catch (err) {
            console.error('Error logging out:', err);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleUpdateProfile = async () => {
    if (!newFullName.trim()) {
      Alert.alert('Validation', 'Full name cannot be empty.');
      return;
    }
    try {
      setLoading(true);
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { full_name: newFullName, phone_number: newPhone },
      });
      if (authUpdateError) {
        console.error('Auth update error:', authUpdateError);
        throw authUpdateError;
      }
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ full_name: newFullName, phone_number: newPhone })
        .eq('id', profile?.id);
      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
        throw profileUpdateError;
      }
      setProfile((prev) =>
        prev
          ? { ...prev, full_name: newFullName, phone_number: newPhone }
          : prev,
      );
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      console.error('Update error:', err);
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation', 'Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Validation',
        'New password and confirm password do not match.',
      );
      return;
    }
    try {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user || !user.email) {
        throw new Error('User not authenticated or email not available.');
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });
      if (signInError) {
        Alert.alert('Error', 'Old password is incorrect.');
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      Alert.alert('Success', 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangePassVisible(false);
    } catch (err: any) {
      console.error('Change password error:', err);
      Alert.alert('Error', err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission required',
          'Permission to access your media library is required!',
        );
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (pickerResult.canceled) return;
      const fileUri = pickerResult.assets[0].uri;
      const fileExt = fileUri.split('.').pop();
      const fileName = `${profile?.id}_${Date.now()}.${fileExt}`;
      const fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileData, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (!data.publicUrl) {
        throw new Error(
          'Cannot get public URL (file not found or bucket error).',
        );
      }
      const publicURL = data.publicUrl;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicURL })
        .eq('id', profile?.id);
      if (updateError) throw updateError;
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicURL } : prev));
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (err: any) {
      console.error('Avatar update error:', err);
      Alert.alert('Error', err.message || 'Failed to update avatar.');
    }
  };
  if (loading) {
    return <LoadingAnimation />;
  }
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Profile</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    // Sử dụng SafeAreaView không bao gồm bottom để tránh thêm padding
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleAvatarChange}>
            <Image
              source={{
                uri:
                  profile?.avatar_url ||
                  'https://ytgldrpdtkrabukbtnpk.supabase.co/storage/v1/object/sign/avatars/avtdefault.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdmF0YXJzL2F2dGRlZmF1bHQuanBnIiwiaWF0IjoxNzQyOTM3NDM4LCJleHAiOjE3NzQ0NzM0Mzh9.YfSLkOTXhtYJIPKRFqmSzhLSV-yxLIj4F5run3EX4X4',
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.full_name || 'Guest User'}
            </Text>
            <Text style={styles.memberSince}>
              Member since{' '}
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Recently'}
            </Text>
          </View>
        </View>

        {/* Nút Edit / Save / Cancel */}
        <View style={styles.editContainer}>
          {editing ? (
            <>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setNewFullName(profile?.full_name || '');
                  setNewPhone(profile?.phone_number || '');
                  setEditing(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color="#0891b2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoValueEditable}
                    value={newFullName}
                    onChangeText={setNewFullName}
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {profile?.full_name || 'Not set'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color="#0891b2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {profile?.email || 'Not set'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Phone size={20} color="#0891b2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                {editing ? (
                  <TextInput
                    style={styles.infoValueEditable}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {profile?.phone_number || 'Not set'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => router.push('/reviewrating/reviewrating')}
            >
              <View style={styles.infoIconContainer}>
                <Star size={20} color="#f59e0b" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>My Reviews</Text>
                <Text style={styles.infoDescription}>
                  View and manage your reviews
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Shield size={20} color="#16a34a" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Privacy & Security</Text>
                <Text style={styles.infoDescription}>
                  Manage your privacy settings
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <CreditCard size={20} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Methods</Text>
                <Text style={styles.infoDescription}>
                  Manage your payment options
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Settings - Change Password */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => setChangePassVisible(true)}
            >
              <View style={styles.infoIconContainer}>
                <KeyRound size={20} color="#ef4444" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Change Password</Text>
                <Text style={styles.infoDescription}>
                  Update your account password
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Password UI */}
        {changePassVisible && (
          <View style={styles.changePassContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Current Password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={styles.passButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>Update Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setChangePassVisible(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 16 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16 },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  memberSince: { fontSize: 14, color: '#64748b' },
  editContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: { color: '#ffffff', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  saveButtonText: { color: '#ffffff', fontWeight: '600' },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: { color: '#ffffff', fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 16,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  infoValue: { fontSize: 14, color: '#64748b' },
  infoValueEditable: {
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 6,
    marginTop: 2,
  },
  infoDescription: { fontSize: 14, color: '#64748b' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginLeft: 68 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#64748b', fontSize: 16 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  // Change Password Styles
  changePassContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  passButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
});

export { ProfileScreen };
