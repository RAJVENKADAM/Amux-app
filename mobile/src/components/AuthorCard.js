import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const AuthorCard = ({ user, onPress, style }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const getFollowersText = (count) => {
    if (!count) return '0 followers';
    if (count > 1000) return `${(count/1000).toFixed(1)}k followers`;
    return `${count} followers`;
  };

  return (
    <TouchableOpacity 
      style={[styles.card, style, { backgroundColor: theme.surface }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <Image
          source={{ 
            uri: user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=e5467b&color=fff&size=80&bold=true`
          }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={[styles.username, { color: theme.textSecondary }]}>@{user.username}</Text>
          {user.bio && (
            <Text style={[styles.bio, { color: theme.textSecondary }]} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.followers, { color: theme.textSecondary }]}>
          {getFollowersText(user.followers?.length || 0)}
        </Text>
        <Feather name="arrow-right" size={18} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingLeft: 68, // align with avatar
  },
  followers: {
    fontSize: 12,
  },
});

export default AuthorCard;

