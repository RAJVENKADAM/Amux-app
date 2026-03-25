import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions, Modal, Alert, ActivityIndicator } from 'react-native';
import { Entypo, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

const CourseCard = ({ course, savedCourseIds = new Set(), isPaid = false, onPress }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = width; // Full screen width

  const fee = (course.topics?.length || 0) * 1; // fee in Rs

  const [showMenuModal, setShowMenuModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user: authUser } = useAuth();
  const isSaved = savedCourseIds.has(course._id);


  return (
    <>
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, backgroundColor: theme.surface }]}
        onPress={onPress}
        activeOpacity={0.9}
      >
  {/* Thumbnail with conditional fee overlay */}
  <View style={styles.thumbnailWrapper}>
    <Image
      source={{
        uri:
          course.thumbnail ||
          course.previewImage ||
          `https://via.placeholder.com/300x160/e5467b/ffffff?text=Course`,
      }}
      style={styles.thumbnail}
      resizeMode="cover"
    />
    {!isPaid && (
      <View style={[styles.feeTag, { backgroundColor: '#000000' }]}>
        <Text style={[styles.fee, { color: 'white' }]}>₹{fee}</Text>
      </View>
    )}
  </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {course.title || course.name}
            </Text>
            {/* Three-dot icon adapts to theme */}
            <TouchableOpacity onPress={() => {
              if (!authUser) {
                Alert.alert('Login Required', 'Please login to save courses');
                return;
              }
              setShowMenuModal(true);
            }}>
              <Entypo
                name="dots-three-vertical"
                size={18}
                color={theme.dark ? '#fff' : '#a7a7a7'}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: theme.text }]} numberOfLines={2}>
            {course.description || 'No description'}
          </Text>
{/* Created by */}
          <View style={styles.tutorContainer}>
            <Text style={[styles.tutorName, { color: theme.textSecondary }]}>
              by {course.owner?.name || 'Unknown'}
            </Text>
          </View>
          
        </View>
      </TouchableOpacity>

      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{isSaved ? 'Unsave Course' : 'Save Course'}</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              {isSaved ? 'Remove' : 'Add'} "{course.title || course.name}" from your saved courses?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.textSecondary }]}
                onPress={() => setShowMenuModal(false)}
                disabled={saving}
              >
                <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  setSaving(true);
                  try {
                    await userAPI.toggleSaveCourse(course._id);
                    Alert.alert('Success', isSaved ? 'Course unsaved!' : 'Course saved!');
                  } catch (error) {
                    console.error('Save/Unsave error:', error);
                    Alert.alert('Error', 'Failed to update saved course. Try again.');
                  } finally {
                    setSaving(false);
                    setShowMenuModal(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{isSaved ? 'Unsave' : 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const getFirstLetter = (name) => name ? name.charAt(0).toUpperCase() : '?';
const getCreatorColor = (name) => {
  const colors = ['#e5467b'];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return colors[Math.abs(hash) % colors.length];
};

const styles = StyleSheet.create({
  card: {

    margin: 0,
    borderRadius: 0,
    marginBottom: 15,
    overflow: 'hidden',
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  feeTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fee: {
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
  },
  tutorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 0,
    marginBottom: 0,
    marginTop: 0,
  },

  tutorName: {
    fontSize: 10,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 24,
    maxWidth: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 12,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CourseCard;