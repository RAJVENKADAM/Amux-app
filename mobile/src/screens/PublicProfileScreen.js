import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Share,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userAPI, followAPI, courseAPI, paymentAPI } from '../services/api';
import UserCourseCard from '../components/UserCourseCard';
import banner from '../assets/banner.jpg';

const PublicProfileScreen = () => {
  const route = useRoute();
  const { userId } = route.params;
  const navigation = useNavigation();

  const { theme } = useTheme();
  const { user: authUser, refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [savedCourseIds, setSavedCourseIds] = useState(new Set());
  const [savedLoading, setSavedLoading] = useState(false);

  const isFollowing = React.useMemo(() => 
    !!authUser?._id &&
    !!profile?.followers?.some(f => {
      const followerId = typeof f === 'object' ? f._id : f;
      return followerId?.toString() === authUser._id.toString();
    }),
  [profile, authUser]
  );

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  
  const coursesCount = courses.length;
  const trustCount = profile?.totalTrustCount || 0;
  const getFollowersCount = () => profile?.followers?.length || 0;

  const fetchSavedCourses = async () => {
    if (!authUser?._id) return;
    try {
      setSavedLoading(true);
      const res = await userAPI.getSavedCourses(authUser._id);
      const ids = new Set(res.data.data?.courses?.map(c => c._id) || []);
      setSavedCourseIds(ids);
    } catch (err) {
      console.log('Public profile saved courses fetch error:', err);
    } finally {
      setSavedLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await userAPI.getProfile(userId);
      setProfile(res.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await courseAPI.getMyCourses(userId);
      setCourses(res.data.data?.courses || []);
    } catch {
      setCourses([]);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;
    if (!authUser) {
      Alert.alert('Login Required', 'Please login to follow users');
      return;
    }
    setFollowLoading(true);
    try {
      const isFollowingLocal = profile?.followers?.some(f => {
        const followerId = typeof f === 'object' ? f._id : f;
        return followerId?.toString() === authUser._id.toString();
      });
      if (isFollowingLocal) {
        setProfile(prev => ({
          ...prev,
          followers: prev.followers.filter(f => {
            const id = typeof f === 'object' ? f._id : f;
            return id !== authUser._id;
          })
        }));
        await followAPI.unfollow(userId);
      } else {
        setProfile(prev => ({
          ...prev,
          followers: [...prev.followers, authUser._id]
        }));
        await followAPI.follow(userId);
      }
      await fetchProfile();
      Alert.alert('Success', isFollowingLocal ? 'Unfollowed' : 'Now following');
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Action failed. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    Share.share({
      message: `Check out ${profile.name}'s profile (@${profile.username}) on UTalk!`
    });
  };

  const handleCoursePress = useCallback(async (course) => {
    if (!authUser?._id) {
      Alert.alert('Login Required', 'Please login to access courses');
      return;
    }

    try {
      const res = await paymentAPI.getMyPayments();
      const isPaid = res.data.payments?.some(p => p.status === 'paid' && p.course?._id === course._id);
      
      if (isPaid) {
        navigation.navigate('CoursePlaylist', { 
          course, 
          isPurchased: true 
        });
      } else {
        navigation.navigate('CoursePayment', { course });
      }
    } catch (error) {
      console.log('Payment check error:', error);
      navigation.navigate('CoursePayment', { course });
    }
  }, [authUser, navigation]);

  useEffect(() => {
    fetchProfile();
    fetchCourses();
    fetchSavedCourses();
  }, [userId]);

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Banner */}
            <View style={styles.bannerContainer}>
              <Image source={banner} style={styles.banner} />
              <View style={styles.overlay} />
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
              <Image
                source={{ uri: profile.profilePicture }}
                style={styles.profileImage}
              />

              <Text style={[styles.name, { color: theme.text }]}>
                {profile.name}
              </Text>

              <Text style={[styles.username, { color: theme.textSecondary }]}>
                @{profile.username}
              </Text>

              {/* Follow & Share Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.followBtn,
                    {
                      backgroundColor: isFollowing ? 'transparent' : theme.primary,
                      borderColor: theme.primary,
                      flex: 1,
                      marginRight: 8
                    }
                  ]}
                  onPress={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Text style={{
                      color: isFollowing ? theme.primary : '#fff',
                      fontWeight: '700'
                    }}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: theme.primary }]}
                  onPress={handleShare}
                >
                  <Feather name="share-2" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <Stat value={coursesCount} label="Courses" theme={theme} />
                <Stat value={trustCount} label="Trust" theme={theme} />
                <Stat value={getFollowersCount()} label="Followers" theme={theme} />
              </View>

              {/* Bio */}
              {profile.bio && (
                <Text style={[styles.bio, { color: theme.textSecondary }]}>
                  {profile.bio}
                </Text>
              )}
            </View>

            {/* Lessons Title */}
            <View style={styles.lessonsTitleContainer}>
              <Text style={[styles.lessonsTitle, { color: theme.text }]}>Lessons Created</Text>
            </View>
          </>
        }
        data={courses}
        renderItem={({ item: course }) => (
          <UserCourseCard 
            course={course} 
            onPress={() => handleCoursePress(course)} 
            savedCourseIds={savedCourseIds}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="book-open" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No lessons available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const Stat = ({ value, label, theme }) => (
  <View style={styles.stat}>
    <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  bannerContainer: { 
    position: 'relative' 
  },
  banner: { width: '100%', height: 120, resizeMode: 'cover',borderRadius: 8 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },

  backBtn: {
    position: 'absolute',
    top: 5,
    left: 5,
    zIndex: 1,
    padding: 8
  },

  profileSection: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 16,
    paddingBottom: 20
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0'
  },

  name: { fontSize: 24, fontWeight: '800', marginTop: 12 },
  username: { fontSize: 16, marginTop: 4 },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    width: '100%'
  },

  followBtn: {
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },

  shareBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
    width: '100%',
    borderBottomWidth: 0.2,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 20
  },

  stat: { alignItems: 'center' },

  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },

  bio: {
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
    fontSize: 15
  },

  lessonsTitleContainer: {
    marginTop: 0,
    marginBottom: 15,
  },

  lessonsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e5467b'
  },

  emptyContainer: {
    padding: 60,
    alignItems: 'center'
  },

  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12
  }
});

export default PublicProfileScreen;
