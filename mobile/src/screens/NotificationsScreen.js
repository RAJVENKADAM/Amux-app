import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const NotificationsScreen = ({ route }) => {
  const scrollY = route.params?.scrollY;
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        onScroll={(event) => scrollY?.setValue(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Notifications Screen - Empty (No Function)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
