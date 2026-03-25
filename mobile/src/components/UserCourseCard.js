import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import CustomModal from './CustomModal';

const UserCourseCard = ({ 
  course = {}, 
  type = 'saved', // 'saved' | 'lessons' | 'learnings'
  isPinned = false,
  onPress, 
  savedCourseIds = new Set(), 
  paidCourseIds = new Set(),
  userId,
  onCoursePress,
  onUnsave,
  onDelete,
  onEdit,
  onPin,
  onShare,
  isCreator = false
}) => {

  const { theme } = useTheme();
  const { user: authUser, refreshUser } = useAuth();

  // Safe values
  const title = course.title ?? 'Untitled Course';
  const description = course.description ?? 'No description available.';
  const thumbnail = course.thumbnail ?? null;

  const isSaved = savedCourseIds.has(course._id);
  const isOwner = course.owner === userId;
  const isPaid = paidCourseIds.has(course._id);
  const [menuVisible, setMenuVisible] = useState(false);

  const getMenuButtons = () => {
    let buttons = [];
    
    // First button: dynamic for different types
    if (type === 'lessons') {
      buttons = [
        { text: 'Delete Course', style: 'destructive', onPress: () => {
          setMenuVisible(false);
          onDelete?.(course._id);
        }},
        { text: 'Edit Course', onPress: () => {
          onEdit?.(course);
          setMenuVisible(false);
        }}
      ];
    } else if (type === 'saved') {
      buttons = [
        { text: 'Unsave Course', style: 'destructive', onPress: () => {
          onUnsave?.(course._id);
          setMenuVisible(false);
        }}
      ];
    } else if (type === 'learnings') {
      // No pin/unpin buttons
    }

    // Always add Share
    buttons.push({ 
      text: 'Share Course', 
      onPress: () => {
        onShare?.(course);
        setMenuVisible(false);
      }
    });

    return buttons;
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleCoursePress = () => {
    onCoursePress?.(course);
    onPress?.(course);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: 'transparent' }]}
        onPress={handleCoursePress}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailContainer}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, { backgroundColor: theme.surface }]} />
          )}
          {type === 'learnings' && isPinned && (
            <View style={[styles.pinnedBadge, { backgroundColor: theme.primary }]}>
              <Feather name="star" size={16} color="#FFF" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {title}
            </Text>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleMenuPress}
            >
              <Feather name="more-vertical" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>
      </TouchableOpacity>

      <CustomModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Course Options"
        buttons={getMenuButtons()}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    height: 100,
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 150,
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  pinnedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuButton: {
    paddingLeft: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  description: {
    fontSize: 13,
    marginTop: 1,
  },

  // (kept unused styles — no UI change)
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    maxHeight: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
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

export default UserCourseCard;
