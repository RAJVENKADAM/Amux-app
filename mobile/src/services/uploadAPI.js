// src/services/uploadAPI.js
import api, { uploadRequest } from './api';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export const uploadAPI = {

  // ================= PICK IMAGE =================
  pickImage: async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.log('❌ Image pick error:', error);
      return null;
    }
  },

  // ================= PICK FILE =================
  pickFile: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.log('❌ File pick error:', error);
      return null;
    }
  },

  // ================= UPLOAD FILE =================
  uploadFile: async (file) => {
    if (!file || !file.uri) {
      throw new Error('Invalid file selected');
    }

    const formData = new FormData();

    formData.append('files', {
      uri: file.uri,
      name: file.name || file.fileName || 'upload.jpg',
      type: file.mimeType || file.type || 'image/jpeg',
    });

    try {
      // ✅ Use uploadRequest for multipart headers (imported from api.js)
      const response = await uploadRequest('/upload', formData);

      console.log('🔥 Upload success:', response.data);

      if (!response.data?.files || response.data.files.length === 0) {
        throw new Error('Upload failed: No file returned');
      }

      console.log('✅ Profile upload URL:', response.data.files[0].url);

      return response.data.files[0];
    } catch (error) {
      console.log('❌ Upload error:', error);

      throw new Error(
        error?.response?.data?.message ||
        error.message ||
        'Upload failed'
      );
    }
  },
};

export default uploadAPI;