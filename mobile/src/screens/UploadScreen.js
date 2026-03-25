import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { uploadAPI } from '../services/uploadAPI';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const UploadScreen = ({ route }) => {
  const editCourse = route.params?.editCourse;
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const [course, setCourse] = useState({
    title: '',
    description: '',
    thumbnail: '',
    thumbnailPreview: null,
  });
  const [topics, setTopics] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTopic, setNewTopic] = useState({ name: '', youtubeUrl: '', description: '' });
  const [isPreview, setIsPreview] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigation.navigate('Login');
  }, [isAuthenticated]);

  useEffect(() => {
    if (editCourse) {
      setCourse({
        title: editCourse.title || '',
        description: editCourse.description || '',
        thumbnail: editCourse.thumbnail || '',
        thumbnailPreview: editCourse.thumbnail || null,
      });
      setTopics(editCourse.topics || []);
      setEditingId(editCourse._id);
    }
  }, [editCourse]);

  useEffect(() => {
    AsyncStorage.setItem('courseDraft', JSON.stringify({ course, topics }));
  }, [course, topics]);

  // ✅ validation
  const isCourseValid = () => {
    return (
      course.title.trim() !== '' &&
      course.description.trim() !== '' &&
      course.thumbnail
    );
  };

  const pickThumbnail = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert('Permission required for gallery access');

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setCourse({ ...course, thumbnail: asset.uri, thumbnailPreview: asset.uri });
    }
  };

  // ✅ duplicate URL check added
  const addTopic = () => {
  if (!newTopic.name || !newTopic.youtubeUrl)
    return Alert.alert('Topic name and YouTube URL are required');

  const youtubeRegex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+(\S+)?$/;
  if (!youtubeRegex.test(newTopic.youtubeUrl))
    return Alert.alert('Invalid YouTube URL');

  const isDuplicate = topics.some(
    (t, index) =>
      t.youtubeUrl.trim() === newTopic.youtubeUrl.trim() &&
      index !== editingIndex
  );

  if (isDuplicate)
    return Alert.alert('This video is already added as a topic');

  if (isEditing) {
    // ✅ UPDATE MODE
    const updatedTopics = [...topics];
    updatedTopics[editingIndex] = newTopic;
    setTopics(updatedTopics);
    setIsEditing(false);
    setEditingIndex(null);
  } else {
    // ✅ CREATE MODE
    setTopics([...topics, newTopic]);
  }

  setNewTopic({ name: '', youtubeUrl: '', description: '' });
  setShowTopicForm(false);
};
  const cancelDraft = async () => {
    await AsyncStorage.removeItem('courseDraft');
    setCourse({ title: '', description: '', thumbnail: '', thumbnailPreview: null });
    setTopics([]);
    setIsPreview(false);
    setShowTopicForm(false);
  };

  const handleLaunchCourse = async () => {
    if (!course.title.trim()) {
      return Alert.alert('Error', 'Course title is required');
    }
    if (topics.length === 0) {
      return Alert.alert('Error', 'Add at least 1 topic');
    }
    if (!course.thumbnail) {
      return Alert.alert('Error', 'Select a thumbnail');
    }

    setLoading(true);
    try {
      let thumbnailUrl = course.thumbnail;

      if (course.thumbnail.startsWith('file://') || course.thumbnail.startsWith('ph://')) {
        setUploadingThumbnail(true);
        const uploaded = await uploadAPI.uploadFile({
          uri: course.thumbnail,
          name: 'thumbnail.jpg',
          mimeType: 'image/jpeg',
        });
        thumbnailUrl = uploaded.url;
      }

      const courseData = {
        title: course.title.trim(),
        description: course.description.trim(),
        thumbnail: thumbnailUrl,
        topics,
        source: 'course',
      };

      if (editingId) {
        await courseAPI.updateCourse(editingId, courseData);
        Alert.alert('Success', 'Course updated successfully!');
      } else {
        await courseAPI.createCourse(courseData);
        Alert.alert('Success', 'Course launched successfully!', [
          {
            text: 'View Profile',
            onPress: () => navigation.navigate('Profile'),
          },
          { text: 'OK' },
        ]);
      }

      Alert.alert('Success', 'Course launched successfully!', [
        {
          text: 'View Profile',
          onPress: () => navigation.navigate('Profile'),
        },
        { text: 'OK' },
      ]);

      await cancelDraft();
    } catch (error) {
      console.error('Launch course error:', error);
      Alert.alert(
        'Launch Failed',
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
      setUploadingThumbnail(false);
    }
  };

  const scrollY = route.params?.scrollY;
const [expanded, setExpanded] = useState(false);
const removeTopic = (index) => {
  const updatedTopics = topics.filter((_, i) => i !== index);
  setTopics(updatedTopics);
};
const cancelTopicForm = () => {
  setNewTopic({ name: '', youtubeUrl: '', description: '' });
  setShowTopicForm(false);
  setIsEditing(false);
  setEditingIndex(null);
};
const [editingIndex, setEditingIndex] = useState(null);
const [isEditing, setIsEditing] = useState(false);
const editTopic = (index) => {
  setNewTopic(topics[index]);
  setEditingIndex(index);
  setIsEditing(true);
  setShowTopicForm(true);
};
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
    
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        onScroll={(event) => scrollY?.setValue(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {!isPreview && (
          <>
            <Text style={[styles.header, { color: theme.primary }]}>{editingId ? 'Update Course' : 'Create Course'}</Text>

            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Course Title"
              placeholderTextColor={theme.textLight}
              value={course.title}
              onChangeText={t => setCourse({ ...course, title: t })}
            />

            <TouchableOpacity
              style={[styles.thumbnailBox, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
              onPress={pickThumbnail}
            >
              {course.thumbnailPreview ? (
                <Image source={{ uri: course.thumbnailPreview }} style={styles.thumbnailImage} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <MaterialIcons name="image" size={32} color={theme.textLight} />
                  <Text style={[styles.thumbText, { color: theme.textSecondary }]}>Select Thumbnail</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={[styles.input, {
                minHeight: 120,
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.inputBackground,
                textAlignVertical: 'top',
              }]}
              placeholder="Description"
              placeholderTextColor={theme.textLight}
              multiline
              value={course.description}
              onChangeText={t => setCourse({ ...course, description: t })}
            />

            {/* ✅ updated button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: isCourseValid()
                    ? theme.primary
                    : theme.border
                }
              ]}
              onPress={() => {
                if (!isCourseValid()) {
                  return Alert.alert('Fill all fields before creating course');
                }
                setIsPreview(true);
              }}
            >
              <Text style={styles.btnText}>Create Course</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: 'transparent', borderColor:'grey', borderWidth:1}]} onPress={cancelDraft}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 🔥 rest unchanged */}
        {isPreview && (
          <>
            <TouchableOpacity style={styles.backBtn} onPress={() => setIsPreview(false)}>
              <Feather name="arrow-left" size={24} color='lightgrey'/>
              <Text style={[styles.backText, { color: 'lightgrey' }]}>Edit Course</Text>
            </TouchableOpacity>
            {/* 🔥 Top Right Close Button */}
<TouchableOpacity
  style={styles.closeBtn}
  onPress={cancelDraft}
>
  <Feather name="x" size={26} color={theme.text} />
</TouchableOpacity>

            <View style={[styles.previewCard, { backgroundColor: theme.surfaceAlt }]}>
  <Text style={[styles.previewTitle, { color: theme.text }]}>
    {course.title}
  </Text>

  {course.thumbnailPreview && (
    <Image source={{ uri: course.thumbnailPreview }} style={styles.previewImage} />
  )}

  {/* Description with show more/less */}
  <Text
    style={[styles.previewDescription, { color: 'white' }]}
    numberOfLines={expanded ? undefined : 4}
  >
    {course.description}
  </Text>

  {course.description.length > 120 && ( // condition to show button
    <TouchableOpacity onPress={() => setExpanded(!expanded)}>
      <Text style={{ color: 'lightgrey', marginTop: 6 }}>
        {expanded ? 'Show Less' : 'Show More'}
      </Text>
    </TouchableOpacity>
  )}
</View>

            <TouchableOpacity style={styles.addTopicBtn} onPress={() => setShowTopicForm(true)}>
              <MaterialIcons name="add-circle-outline" size={20} color={theme.primary} />
              <Text style={[styles.addTopicText, { color: theme.primary }]}>Add Topic</Text>
            </TouchableOpacity>

            {showTopicForm && (
              <View style={[styles.topicForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>

  {/* 🔥 Header with Title + Close */}
  <View style={styles.topicFormHeader}>
    <Text style={[styles.topicFormTitle, { color: theme.text }]}>
      Create Topic
    </Text>

    <TouchableOpacity onPress={cancelTopicForm}>
      <Feather name="x" size={22} color={theme.text} />
    </TouchableOpacity>
  </View>

  <TextInput
    style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
    placeholder="Topic Name"
    placeholderTextColor={theme.textLight}
    value={newTopic.name}
    onChangeText={t => setNewTopic({ ...newTopic, name: t })}
  />

  <TextInput
    style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
    placeholder="YouTube URL"
    placeholderTextColor={theme.textLight}
    value={newTopic.youtubeUrl}
    onChangeText={t => setNewTopic({ ...newTopic, youtubeUrl: t })}
  />

  <TextInput
    style={[styles.input, {
      minHeight: 80,
      borderColor: theme.border,
      color: theme.text,
      backgroundColor: theme.inputBackground,
      textAlignVertical: 'top',
    }]}
    placeholder="Description"
    placeholderTextColor={theme.textLight}
    multiline
    value={newTopic.description}
    onChangeText={t => setNewTopic({ ...newTopic, description: t })}
  />

  <TouchableOpacity
    style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
    onPress={addTopic}
  >
    <Text style={styles.btnText}>
  {isEditing ? 'Update Topic' : 'Create Topic'}
</Text>
  </TouchableOpacity>

</View>
            )}

            {topics.map((t, i) => (
  <TouchableOpacity
    key={i}
    onPress={() => editTopic(i)}   // ✅ click to edit
    style={[
      styles.topicItem,
      {
        borderColor: theme.border,
        backgroundColor: theme.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }
    ]}
  >
    <Text style={[styles.topicTitle, { color: theme.text }]}>
      {t.name}
    </Text>

    <TouchableOpacity onPress={() => removeTopic(i)}>
      <Feather name="x" size={20} color="red" />
    </TouchableOpacity>
  </TouchableOpacity>
))}
<View style={{ marginTop: 24, marginBottom: 20 }}>
  <TouchableOpacity
    style={[styles.launchBtn, { backgroundColor: theme.primary }]}
    disabled={loading || uploadingThumbnail}
    onPress={handleLaunchCourse}
  >
    {loading || uploadingThumbnail ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.btnText}>Launch Course</Text>
    )}
  </TouchableOpacity>
</View>

            
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default UploadScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { fontSize: 28, fontFamily: 'Poppins_700Bold', marginBottom: 24 },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
topicFormHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

topicFormTitle: {
  fontSize: 16,
  fontFamily: 'Poppins_600SemiBold',
},
closeBtn: {
  position: 'absolute',
  top: 10,
  right: 16,
  zIndex: 10,
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: 8,
  borderRadius: 20,
},
  // ✅ full width fix
  thumbnailBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  thumbnailImage: { width: '100%', height: '100%', borderRadius: 16 },
  thumbPlaceholder: { alignItems: 'center' },
  thumbText: { fontFamily: 'Poppins_500Medium', marginTop: 8 },
  primaryBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  cancelBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  cancelText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  previewCard: { marginBottom: 24, borderRadius: 16, padding: 16 },
  previewTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold', marginBottom: 12 },
  previewImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, marginBottom: 16 },
  previewDescription: { fontFamily: 'Poppins_400Regular', fontSize: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backText: { fontFamily: 'Poppins_600SemiBold', marginLeft: 8, fontSize: 16 },
  addTopicBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  addTopicText: { fontFamily: 'Poppins_900SemiBold', marginLeft: 6, fontSize: 15, fontWeight:'900' },
  topicForm: { marginBottom: 24, padding: 20, borderRadius: 16, borderWidth: 1 },
  topicItem: { padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  topicTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, marginBottom: 4 },
  topicUrl: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  launchBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
});