// src/screens/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { uploadAPI } from '../services/uploadAPI';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setProfilePicUrl(user.profilePicture || '');
    }
  }, [user]);

  const pickProfilePic = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const image = result.assets[0];

      try {
        setUploading(true);

        const uploaded = await uploadAPI.uploadFile({
          uri: image.uri,
          name: 'profile.jpg',
          mimeType: 'image/jpeg',
        });

        setProfilePicUrl(uploaded.url);

        Alert.alert('Success', 'Profile image uploaded!');
        
        // 🔥 AUTO-SAVE PROFILE after upload (only if user data loaded and fields valid)
        if (user?.name?.trim() && user?.username?.trim() && name.trim() && username.trim()) {
          try {
            console.log('🔥 Auto-saving profile with new pic:', uploaded.url.substring(0, 50) + '...');
            await userAPI.updateProfile({
              name: name.trim(),
              username: username.trim(),
              profilePicture: uploaded.url
            });
            await refreshUser();
            Alert.alert('✅ Profile Saved!', 'Image uploaded and saved successfully!');
          } catch (updateError) {
            console.error('❌ Auto-save error:', updateError);
            Alert.alert('Upload Success', 'Image uploaded but save failed. Tap Update manually.');
          }
        } else {
          Alert.alert('Upload Success', 'Tap Update to save profile changes with image.');
        }
      } catch (error) {
        Alert.alert('Upload failed', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!name.trim() || !username.trim()) {
      return Alert.alert('Error', 'Fill all fields');
    }

    try {
      setLoading(true);

      await userAPI.updateProfile({
        name,
        username,
        profilePicture: profilePicUrl || '',
      });

      await refreshUser();

      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={{ padding: 20 }}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>

        {/* Profile Image */}
        <TouchableOpacity onPress={pickProfilePic} style={styles.imageContainer}>
          {profilePicUrl ? (
            <Image source={{ uri: profilePicUrl }} style={styles.image} />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: theme.surfaceAlt }]}>
              <Feather name="camera" size={32} color={theme.textSecondary} />
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {uploading && <ActivityIndicator size="large" color={theme.primary} style={styles.spinner} />}

        {/* Name Input */}
        <TextInput
          style={[styles.input, { 
            borderColor: theme.border, 
            backgroundColor: theme.inputBackground, 
            color: theme.text 
          }]}
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
          placeholderTextColor={theme.textLight}
        />

        {/* Username Input */}
        <TextInput
          style={[styles.input, { 
            borderColor: theme.border, 
            backgroundColor: theme.inputBackground, 
            color: theme.text 
          }]}
          value={username}
          onChangeText={setUsername}
          placeholder="@username"
          placeholderTextColor={theme.textLight}
        />

        {/* Update Button */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]} 
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Update Profile</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(229, 70, 123, 0.2)',
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 14,
  },
  spinner: {
    marginVertical: 20,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
