import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  StyleSheet,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Your Privacy Matters
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          We collect minimal data (email, courses purchased) to provide course access. No sharing with third parties.
        </Text>
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Data Usage
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Your payment data is processed securely via Razorpay. Course progress is stored locally.
        </Text>
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Contact
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Questions? Email support@utalk.app
        </Text>
        
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>Last updated: 2024</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  placeholder: { width: 24 },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  paragraph: { fontSize: 16, lineHeight: 24, marginBottom: 16 },
  lastUpdated: { fontSize: 14, textAlign: 'center', marginTop: 40, fontStyle: 'italic' }
});

export default PrivacyPolicyScreen;

