import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import { courseSearchAPI as courseAPI, tutorSearchAPI as tutorAPI } from '../services/searchAPI';
import AuthorCard from '../components/AuthorCard';
import { useNavigation } from '@react-navigation/native';

const SearchScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user: authUser } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ courses: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  // Load payments
  useEffect(() => {
    if (authUser?._id) {
      paymentAPI.getMyPayments()
        .then(res => setPayments(res.data.payments || []))
        .catch(err => console.log(err));
    }
  }, [authUser]);

  // Check paid
  const isCoursePaid = useCallback((courseId) => {
    return payments.some(p => p.status === 'paid' && p.course?._id === courseId);
  }, [payments]);

  // Course click
  const handleCoursePress = useCallback((course) => {
    if (!authUser) {
      Alert.alert('Login Required', 'Please login to access courses');
      return;
    }

    if (isCoursePaid(course._id)) {
      navigation.navigate('CoursePlaylist', { course, isPurchased: true });
    } else {
      navigation.navigate('CoursePayment', { course });
    }
  }, [authUser, isCoursePaid]);

  // Tutor click
  const handleTutorPress = useCallback((user) => {
    navigation.navigate('PublicProfile', { userId: user._id || user.username });
  }, []);

  // Live search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ courses: [], users: [] });
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const courseRes = await courseAPI.searchCourses(query);
        const tutorRes = await tutorAPI.searchTutors(query);

        setResults({
          courses: courseRes?.data?.data?.courses || [],
          users: tutorRes?.data?.data?.users || [],
        });

      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  // Combine results
  const combinedResults = [
    ...results.courses.map(c => ({ ...c, type: 'course' })),
    ...results.users.map(u => ({ ...u, type: 'user' }))
  ];

  // Render item
  const renderItem = ({ item }) => {
    if (item.type === 'course') {
      return (
        <TouchableOpacity
          style={[styles.courseCard, { backgroundColor: theme.card }]}
          onPress={() => handleCoursePress(item)}
        >
          {/* Thumbnail */}
          <Image
            source={{ uri: item.thumbnail || item.previewImage }}
            style={styles.thumbnail}
          />

          {/* Content */}
          <View style={styles.courseInfo}>
            <Text
              style={[styles.courseTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <Text
              style={[styles.courseDesc, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {item.description || 'No description available'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <AuthorCard
        user={item}
        onPress={() => handleTutorPress(item)}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <TextInput
          placeholder="Search courses, tutors..."
          placeholderTextColor="#888"
          style={[styles.searchInput, { color: theme.text, backgroundColor: theme.card }]}
          value={query}
          onChangeText={setQuery}
        />

        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Feather name="x" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      )}

      {/* Results */}
      <FlatList
        data={combinedResults}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Empty */}
      {!loading && combinedResults.length === 0 && query.length > 0 && (
        <View style={styles.emptyContainer}>
          <Text style={{ color: theme.textSecondary }}>
            No results found
          </Text>
        </View>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },

  // 🎓 Course UI
  courseCard: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  thumbnail: {
    width: 100,
    height: 56, // 16:9 ratio
    borderRadius: 8,
  },

  courseInfo: {
    flex: 1,
    marginLeft: 10,
  },

  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
  },

  courseDesc: {
    fontSize: 13,
    marginTop: 4,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
});

export default SearchScreen;