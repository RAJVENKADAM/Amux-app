// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { courseAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CourseCard from '../components/CourseCard';
import { Feather } from '@expo/vector-icons';

const HomeScreen = ({ navigation, route }) => {
  const { theme } = useTheme();

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();
  const [savedCourseIds, setSavedCourseIds] = useState(new Set());
  const [paidCourseIds, setPaidCourseIds] = useState(new Set());
  
  // Fetch all courses + paid status on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all courses
        const allRes = await courseAPI.getAllCourses();
        let allCourses = [];
        if (allRes?.data?.success) {
          allCourses = allRes.data.data?.courses || allRes.data.data || [];
        }

        let filteredAll = allCourses.filter(course => course.owner?._id !== authUser?._id);

        let finalFiltered = filteredAll;
        if (authUser) {
          // Fetch paid courses
          const paidRes = await courseAPI.getPaidCourses(1, 100);
          const paidCourses = paidRes?.data?.data?.courses || [];
          const paidIds = new Set(paidCourses.map(c => c._id));
          setPaidCourseIds(paidIds);

          // Split into unpaid/paid
          const unpaid = filteredAll.filter(course => !paidIds.has(course._id));
          const paid = filteredAll.filter(course => paidIds.has(course._id));
          
          // Sort each by newest
          const unpaidSorted = unpaid.sort((a, b) => 
            new Date(b.createdAt || b.publishedAt) - new Date(a.createdAt || a.publishedAt)
          );
          const paidSorted = paid.sort((a, b) => 
            new Date(b.createdAt || b.publishedAt) - new Date(a.createdAt || a.publishedAt)
          );
          
          finalFiltered = [...unpaidSorted, ...paidSorted];
        } else {
          // Guest: newest first
          finalFiltered = filteredAll.sort((a, b) => 
            new Date(b.createdAt || b.publishedAt) - new Date(a.createdAt || a.publishedAt)
          );
        }

        setCourses(filteredAll);
        setFilteredCourses(finalFiltered);
      } catch (err) {
        console.log('Error fetching home data', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSavedCourses = async () => {
      if (authUser) {
        try {
          const res = await userAPI.getSavedCourses(authUser._id, 1, 100);
          const ids = new Set(res.data.data?.courses?.map(c => c._id) || []);
          setSavedCourseIds(ids);
        } catch (err) {
          console.log('Error fetching saved courses:', err);
        }
      }
    };

    fetchData();
    fetchSavedCourses();
  }, [authUser]);

  const refreshSavedCourses = async () => {
    await fetchSavedCourses();
  };

  const renderCourse = ({ item }) => (
    <CourseCard 
      course={item} 
      savedCourseIds={savedCourseIds}
      isPaid={paidCourseIds.has(item._id)}
      onPress={() => navigation.navigate('CoursePayment', { course: item })} 
      onSaveToggle={refreshSavedCourses}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const scrollY = route.params?.scrollY;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <TouchableOpacity 
        style={[
          styles.searchBar, 
          { 
            backgroundColor: theme.surface || '#1F2937',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12
          }
        ]}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.7}
      >
        <Feather name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <Text style={[styles.searchText, { color: '#9CA3AF' }]}>
          Search courses and tutors
        </Text>
      </TouchableOpacity>

      <FlatList
        style={{ flex: 1, marginTop: 20 }}
        data={filteredCourses}
        keyExtractor={(item, index) =>
          item._id?.toString() || index.toString()
        }
        renderItem={renderCourse}
        ListEmptyComponent={() => (
          <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.emptyText, { color: '#94A3B8' }]}>
              No courses found
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={(event) =>
          scrollY?.setValue(event.nativeEvent.contentOffset.y)
        }
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },

  searchBar: {
    backgroundColor: '#1F2937',
    margin: 10,
    padding: 15,
    paddingLeft: 15,
    borderRadius: 30,
    alignItems: 'center',
  },

  searchText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 50
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
});
