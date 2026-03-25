import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { Feather, FontAwesome } from '@expo/vector-icons';
import YoutubePlayer from "react-native-youtube-iframe";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const CoursePlaylistScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { course: passedCourse, isPurchased = false, courseId } = route.params;
  const [course, setCourse] = useState(passedCourse);
  const [loading, setLoading] = useState(!passedCourse);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!course && courseId) {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const response = await courseAPI.getCourse(courseId);
          setCourse(response.data);
        } catch (err) {
          setError('Failed to load course');
          Alert.alert('Error', 'Failed to load course');
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    }
  }, [courseId]);

  if (!user) {
    Alert.alert('Error', 'User not logged in!');
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} style={styles.center} />
      </SafeAreaView>
    );
  }

  if (error || !course || !course.topics || course.topics.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: 'center', padding: 50 }}>No topics available for this course</Text>
      </SafeAreaView>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [trustStatus, setTrustStatus] = useState('neutral');

  const screenWidth = Dimensions.get('window').width;
  const videoHeight = (screenWidth * 9) / 16;

  const scrollRef = useRef();
  const effectiveUnlockedTopics = isPurchased ? course.topics.length : 1;

  const getYoutubeId = (url) => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      if (currentIndex + 1 < effectiveUnlockedTopics) {
        setCurrentIndex(currentIndex + 1);
        setPlaying(true);
        scrollRef.current?.scrollTo({ y: (currentIndex + 1) * 120, animated: true });
      }
    }
  }, [currentIndex, effectiveUnlockedTopics]);

  const playTopic = (index) => {
    if (index < effectiveUnlockedTopics) {
      setCurrentIndex(index);
      setPlaying(true);
    }
  };

  const currentVideo = course.topics[currentIndex];

  const generateCertificate = async () => {
    try {
      const html = `
      <div style="width:100%; height:100%; padding:50px; text-align:center; font-family: Arial;
        border:10px solid #4CAF50; border-radius:20px;">
        <h1>Certificate of Completion</h1>
        <h2>${user.name}</h2>
        <p>Completed</p>
        <h3>${course.title}</h3>
        <p>${new Date().toLocaleDateString()}</p>
      </div>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate certificate');
    }
  };

  const handleThumbsUp = async () => {
    const newStatus = trustStatus === 'up' ? 'neutral' : 'up';
    setTrustStatus(newStatus);
    try {
      await courseAPI.trustCourse(course._id);
      Alert.alert('Success', newStatus === 'up' ? 'Course trusted! ✓' : 'Trust removed! ✓');
    } catch (error) {
      setTrustStatus(trustStatus);
      Alert.alert('Error', 'Failed to update trust. Please try again.');
    }
  };



  const handleReport = () => {
    Alert.alert('Report', 'Report feature coming soon!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.courseTitle, { color: theme.text, fontWeight: '900' }]} numberOfLines={1}>
          {course.title}
        </Text>
      </View>

      {/* Video */}
      <YoutubePlayer
        height={videoHeight}
        width={screenWidth}
        play={playing}
        videoId={getYoutubeId(currentVideo.youtubeUrl)}
        onChangeState={onStateChange}
      />

      {/* Current Video */}
      <View style={[styles.currentVideo, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
        <Text style={[styles.currentTitle, { color: theme.text, fontWeight: '900' }]}>
          {currentVideo.name}
        </Text>

        <Text
          style={[styles.currentDescription, { color: 'lightgrey' }]}
          numberOfLines={expandedIndex === currentIndex ? undefined : 3}
        >
          {currentVideo.description || 'No description provided'}
        </Text>

        {currentVideo.description?.length > 10 && (
          <TouchableOpacity onPress={() =>
            setExpandedIndex(expandedIndex === currentIndex ? null : currentIndex)
          }>
            <Text style={{ color: 'grey', marginTop: 5 }}>
              {expandedIndex === currentIndex ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Bar */}
      <View style={[styles.actionBar, { paddingLeft: 16 }]}>
        {/* Creator Profile Picture */}
        {course.owner && (
          <TouchableOpacity
            style={styles.creatorBtn}
            onPress={() => navigation.navigate('PublicProfile', { userId: course.owner._id || course.owner })}
          >
            <Image
              source={{ uri: course.owner.profilePicture }}
              style={styles.creatorImage}
            />
          </TouchableOpacity>
        )}

        <View style={[styles.iconBtnsContainer, { marginRight: 16 }]}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor:
                  trustStatus === 'up' ? theme.primary : 'rgba(255,255,255,0.1)',
              },
            ]}
            onPress={handleThumbsUp}
          >
            <FontAwesome name="thumbs-up" size={20} color="white" />
          </TouchableOpacity>

        </View>

        <View style={styles.textBtnsContainer}>
          <TouchableOpacity
            style={[styles.textBtn, { backgroundColor: '#2c2c2c', flexDirection: 'row', alignItems: 'center', gap: 6 }]}
            onPress={handleReport}
          >
            <Feather name="shield" size={16} color="#fff" />
            <Text style={styles.textBtnLabel}>Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.textBtn, { backgroundColor: '#2c2c2c', flexDirection: 'row', alignItems: 'center', gap: 6 }]}
            onPress={generateCertificate}
          >
            <Feather name="award" size={16} color="#fff" />
            <Text style={styles.textBtnLabel}>Certificate</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Next Topics Section */}
      <View style={styles.nextTopicsSection}>
        <Text style={[styles.nextTopicsTitle, { color: theme.text }]}>
          Next Topics
        </Text>
      </View>

      {/* Topic List */}
      <ScrollView style={styles.scroll} ref={scrollRef}>
        {course.topics.map((topic, index) => {
          const isActive = index === currentIndex;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.topicCard,
                {
                  backgroundColor: '#2c2c2c',
                  borderWidth: isActive ? 0.5 : 0,
                  borderColor: isActive ? theme.primary : 'transparent',
                },
              ]}
              onPress={() => playTopic(index)}
            >
              <Text style={[styles.topicTitle, { color: theme.text }]}>
                {topic.name}
              </Text>

              {topic.description?.length > 100 && (
                <TouchableOpacity onPress={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }>
                  <Text style={{ color: theme.primary, marginTop: 5 }}>
                    {expandedIndex === index ? 'Show Less' : 'Show More'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

    </SafeAreaView>
  );
};

export default CoursePlaylistScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },

  courseTitle: {
    flex: 1,
    fontSize: 18,
    textAlign: 'center',
  },

  currentVideo: { padding: 16 },

  currentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },

  currentDescription: { fontSize: 14 },

  scroll: { flex: 1, paddingHorizontal: 16 },

  topicCard: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginVertical: 10,
  },

  creatorBtn: {
    padding: 4,
  },

  creatorImage: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: 'rgb(138, 138, 138)',
  },

  iconBtnsContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  iconBtn: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },

  textBtnsContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  textBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textBtnLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  nextTopicsSection: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },

  nextTopicsTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
});