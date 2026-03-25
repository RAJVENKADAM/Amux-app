import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Animated
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { courseAPI, tutorAPI } from '../services/api'; // assume you have tutorAPI

const SearchScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Fetch predictions while typing
  useEffect(() => {
    if (query.trim() === '') {
      setPredictions([]);
      setShowResults(false);
      return;
    }

    const fetchPredictions = async () => {
      try {
        // Simulate predictive search
        const courseRes = await courseAPI.searchCourses(query); // returns array
        const tutorRes = await tutorAPI.searchTutors(query); // returns array

        const combined = [
          ...courseRes?.data?.data?.courses || [],
          ...tutorRes?.data?.data?.tutors || [],
        ];

        // Only show top 5 suggestions
        setPredictions(combined.slice(0, 5));
      } catch (err) {
        console.log('Prediction error', err);
      }
    };

    fetchPredictions();
  }, [query]);

  // When user selects a suggestion
  const handleSelect = (item) => {
    setQuery(item.name || item.title); // fill the search bar
    setShowResults(true);
    setPredictions([]);
    Keyboard.dismiss();
  };

  // Render each prediction item
  const renderPrediction = ({ item }) => (
    <TouchableOpacity style={styles.predictionItem} onPress={() => handleSelect(item)}>
      <Text style={[styles.predictionText, { color: theme.text }]}>{item.name || item.title}</Text>
    </TouchableOpacity>
  );

  // Render search result item
  const renderResult = ({ item }) => (
    <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.resultTitle, { color: theme.text }]}>{item.name || item.title}</Text>
      {item.type && <Text style={[styles.resultType, { color: theme.textSecondary }]}>{item.type}</Text>}
    </View>
  );

  // Fetch results manually (when pressing enter)
  const handleSearch = async () => {
    if (query.trim() === '') return;
    try {
      const courseRes = await courseAPI.searchCourses(query);
      const tutorRes = await tutorAPI.searchTutors(query);

      const combined = [
        ...(courseRes?.data?.data?.courses || []).map((c) => ({ ...c, type: 'Course' })),
        ...(tutorRes?.data?.data?.tutors || []).map((t) => ({ ...t, type: 'Tutor' })),
      ];

      setResults(combined);
      setShowResults(true);
      setPredictions([]);
      Keyboard.dismiss();
    } catch (err) {
      console.log('Search error', err);
      setResults([]);
    }
  };

  const scrollY = route.params?.scrollY;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 80 }}
        onScroll={(event) => scrollY?.setValue(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Back and Search */}
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
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setPredictions([]); setShowResults(false); }}>
            <Feather name="x" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Predictions */}
      {predictions.length > 0 && !showResults && (
        <FlatList
          data={predictions}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderPrediction}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Results */}
      {showResults && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderResult}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Empty state */}
      {showResults && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No results found.
          </Text>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  predictionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  predictionText: { fontSize: 16 },
  resultCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: { fontSize: 16, fontFamily: 'Poppins_500Medium' },
  resultType: { fontSize: 12, marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, textAlign: 'center' },
});

export default SearchScreen;