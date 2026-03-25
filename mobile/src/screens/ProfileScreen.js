import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Animated,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userAPI, courseAPI, paymentAPI } from '../services/api';
import UserCourseCard from '../components/UserCourseCard';

import banner from '../assets/banner.jpg';

const sentenceCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const themeHook = useTheme();
  const theme = themeHook.theme;
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('myLessons');
  const [profileData, setProfileData] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [myLearnings, setMyLearnings] = useState([]);
  const [savedCourses, setSavedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [scrollY] = useState(new Animated.Value(0));

  const handleCoursePress = useCallback((course) => {
    navigation.navigate('CoursePlaylist', { course });
  }, [navigation]);



  const shareCourseHandler = useCallback((course) => {
    Share.share({
      message: `Check out this course: ${course.title}`,
    }).catch(console.error);
  }, []);

  const confirmDelete = (courseId) => Alert.alert(
    'Delete Course?',
    'This action cannot be undone.',
    [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCourse(courseId) }
    ]
  );

  const deleteCourse = async (id) => {
    try {
      await courseAPI.deleteCourse(id);
      setMyCourses(prev => prev.filter(c => c._id !== id));
      Alert.alert('Deleted', 'Course removed successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete course.');
    }
  };

  const toggleSaveCourse = async (courseId) => {
    try {
      await userAPI.toggleSaveCourse(courseId);
      // Refresh the list to reflect toggle state
      await fetchSavedCourses();
      Alert.alert('Success', 'Course save status toggled.');
    } catch (err) {
      Alert.alert('Error', 'Could not toggle save status.');
    }
  };

  const totalTrustCount = useMemo(() => {
    return myCourses.reduce((acc, curr) => acc + (curr.trustCount || 0), 0);
  }, [myCourses]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setProfileError(null);
      const identifier = profileData?.username || user?.username || user?._id;
      if (!identifier) throw new Error('No user identifier');
      const response = await userAPI.getProfile(identifier);
      setProfileData(response.data.data);
    } catch (err) {
      setProfileError(err.message);
      Alert.alert('Profile Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    if (!user) return;
    try {
      const response = await courseAPI.getMyCourses(user._id);
      setMyCourses(response.data.data?.courses || []);
    } catch (err) {
      setMyCourses([]);
    }
  };

  const fetchMyLearnings = async () => {
    if (!user) return;
    try {
      const res = await paymentAPI.getMyPayments();
      const paidCourses = res.data.payments.filter(p => p.course).map(p => p.course);
      setMyLearnings(paidCourses);
    } catch (err) {
      setMyLearnings([]);
    }
  };

  const fetchSavedCourses = async () => {
    if (!user) return;
    try {
      const response = await userAPI.getSavedCourses(user._id);
      setSavedCourses(response.data.data?.courses || []);
    } catch (err) {
      setSavedCourses([]);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'myLessons') fetchMyCourses();
    if (activeTab === 'myLearnings') fetchMyLearnings();
    if (activeTab === 'savedCourses') fetchSavedCourses();
  }, [activeTab, user]);

  if (authLoading || loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme?.background || '#fff' }]}>
        <ActivityIndicator size="large" color="#e5467b" style={styles.center} />
      </SafeAreaView>
    );
  }

  const effectiveUser = profileData || user;
  const avatarSrc = effectiveUser?.profilePicture?.trim();
  const displayName = effectiveUser?.name || 'User';
  const displayUsername = effectiveUser?.username || 'user';
  const coursesCount = myCourses.length;
  const followersCount = effectiveUser?.followers?.length || 0;

  const tabs = [
    { key: 'myLessons', label: 'Lessons', isRectangle: true },
    { key: 'myLearnings', label: 'Learnings', isRectangle: true },
    { key: 'savedCourses', label: 'Saved', icon: 'bookmark' },
    { key: 'analytics', icon: 'bar-chart-2' },
    { key: 'settings', icon: 'settings' },
  ];

  const learningsData = myLearnings;

  const tabData = activeTab === 'settings' ? [{ id: 'settings' }] :
                  activeTab === 'myLessons' ? myCourses :
                  activeTab === 'myLearnings' ? myLearnings :
                  activeTab === 'savedCourses' ? savedCourses : [];

  const getEmptyState = () => {
    switch (activeTab) {
      case 'myLessons': return { icon: 'book-open', title: 'No courses yet', sub: 'Create your first course' };
      case 'myLearnings': return { icon: 'play-circle', title: 'No learnings', sub: 'Purchase a course to view here' };
      case 'savedCourses': return { icon: 'bookmark', title: 'No saved courses', sub: 'Save courses from the payment screen' };
      default: return null;
    }
  };

  const renderTabItem = ({ item }) => {
    if (activeTab === 'settings') {
      return (
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => Share.share({ message: `Check out my profile: [App Link]/profile/${displayUsername}` })}>
            <Feather name="share-2" size={24} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Share Profile</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Share your public view</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('EditProfile')}>
            <Feather name="edit-3" size={24} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Edit Profile</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Update name & username</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('MainTabs', { screen: 'PrivacyPolicyScreen' })}>
            <Feather name="shield" size={24} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Privacy Policy</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>View our terms</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={() => {
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: logout }
            ]);
          }}>
            <Feather name="log-out" size={24} color="#EF4444" />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Logout</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Sign out of account</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      );
    }
    // Course tabs
    let type, onDelete, onEdit, onUnsave;
    if (activeTab === 'myLessons') {
      type = 'lessons';
      onDelete = confirmDelete;
      onEdit = course => navigation.navigate('Upload', { editCourse: course });
    } else if (activeTab === 'savedCourses') {
      type = 'saved';
      onUnsave = toggleSaveCourse;
    } else {
      type = 'learnings';
    }
    return (
      <UserCourseCard 
        course={item}
        type={type}
        onPress={() => handleCoursePress(item)}
        onShare={shareCourseHandler}
        onDelete={onDelete}
        onEdit={onEdit}
        onUnsave={onUnsave}
      />
    );
  };


  const keyExtractor = (item) => item._id || item.id || 'item';

  const emptyState = getEmptyState();

  if (!user && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme?.background || '#fff' }]}>
        <Text style={styles.centerText}>Please login to view profile</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background || '#fff', flex: 1 }]}>
      <FlatList
        ListHeaderComponent={
          <>
            <Image source={banner} style={styles.banner} />
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {avatarSrc ? (
                  <Image source={{ uri: avatarSrc }} style={styles.avatar} />
                ) : (
                  <View style={[styles.defaultAvatar, { backgroundColor: '#e5467b' }]}>
                <Text style={styles.avatarLetter}>{displayName[0]?.toUpperCase() || '?'}</Text>
                  </View>
                )}
              </View>
              <View style={styles.infoContainer}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{sentenceCase(displayName)}</Text>
                <Text style={[styles.usernameText, { color: theme.textSecondary }]}>@{displayUsername}</Text>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>{coursesCount}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Courses</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>{totalTrustCount}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Trust Count</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>{followersCount}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
              </View>
            </View>
            <View style={styles.tabsContainer}>
              <View style={styles.tabsRow}>
                {tabs.map(tab => {
                  const isActive = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        tab.isRectangle
                          ? { ...styles.tabRectangle, backgroundColor: isActive ? '#e5467b' : theme.surfaceAlt, borderColor: isActive ? '#e5467b' : theme.surfaceAlt }
                          : { ...styles.tabIcon, backgroundColor: isActive ? '#e5467b' : theme.surfaceAlt, borderColor: isActive ? '#e5467b' : theme.surfaceAlt }
                      ]}
                      onPress={() => setActiveTab(tab.key)}
                    >
                      {tab.icon ? (
                        <Feather name={tab.icon} size={20} color={isActive ? '#FFFFFF' : theme.textLight} />
                      ) : (
                        <Text style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : theme.textLight }]}>{tab.label}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={{ height: 12 }} />
          </>
        }
        data={tabData}
        renderItem={renderTabItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={emptyState && <EmptyState icon={emptyState.icon} title={emptyState.title} sub={emptyState.sub} theme={theme} />}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const EmptyState = ({ icon, title, sub, theme }) => (
  <View style={[styles.contentCard, { backgroundColor: theme.surfaceAlt }]}>
    <Feather name={icon} size={48} color={theme.textSecondary} />
    <Text style={[styles.tabTitle, { color: theme.textSecondary, marginTop: 12 }]}>{title}</Text>
    <Text style={[styles.contentText, { color: theme.textSecondary }]}>{sub}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { width: '100%', height: 120, resizeMode: 'cover' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 8 },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 0.5, borderColor: '#000000' },
  defaultAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 32, fontWeight: '800', color: 'white' },
  infoContainer: { flex: 1 },
  name: { fontSize: 22, fontWeight: 'bold' },
  usernameText: { fontSize: 15, marginTop: 2 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  tabsContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  tabsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tabRectangle: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginRight: 8 },
  tabIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginLeft: 8 },
  tabLabel: { fontSize: 12, fontWeight: '800' },
  listContainer: {
    paddingBottom: 100,
  },
  contentCard: { justifyContent: 'center', alignItems: 'center', padding: 48, borderRadius: 16, marginVertical: 20 },
  contentText: { fontSize: 16, textAlign: 'center', fontWeight: '500', lineHeight: 24, marginTop: 8 },
  tabTitle: { fontSize: 20, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerText: { textAlign: 'center', padding: 60, fontSize: 16, fontWeight: '500' },
  settingsContainer: { paddingBottom: 24 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  logoutItem: { marginTop: 20 },
  settingTextContainer: { flex: 1, marginLeft: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingSubtitle: { fontSize: 14, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
});

export default ProfileScreen;
