import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { paymentAPI, userAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

const CoursePaymentScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { user, refreshUser } = useAuth();
  const [paymentCount, setPaymentCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);
  const { course } = route.params;

  const [loading, setLoading] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [savedCourseIds, setSavedCourseIds] = useState(new Set());
  const [savedLoading, setSavedLoading] = useState(false);
  const webviewRef = useRef();

  const fee = course.topics?.length * 1 || 0;

  useEffect(() => {
    checkPurchaseStatus();
    fetchPaymentCount();
  }, []);
  
  useEffect(() => {
    if (user?._id) fetchSavedCourses();
  }, [user]);

  const fetchSavedCourses = async () => {
    if (!user) return;
    try {
      setSavedLoading(true);
      const res = await userAPI.getSavedCourses(user._id);
      const ids = new Set(res.data.data?.courses?.map(c => c._id) || []);
      setSavedCourseIds(ids);
    } catch (err) {
      console.log('Saved courses fetch error:', err);
    } finally {
      setSavedLoading(false);
    }
  };

  const fetchPaymentCount = async () => {
    try {
      setCountLoading(true);
      const res = await paymentAPI.getCoursePaymentCount(course._id);
      setPaymentCount(res.data.count);
    } catch (err) {
      console.log('Payment count error:', err);
      setPaymentCount(0);
    } finally {
      setCountLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    try {
      const res = await paymentAPI.getMyPayments();
      const purchased = res.data.payments?.find(p => p.course?._id === course._id);
      if (purchased) {
        setAlreadyPurchased(true);
        navigation.replace('CoursePlaylist', { 
          course, 
          unlockedTopics: course.topics?.length || 0, 
          isPurchased: true 
        });
      }
    } catch (err) {
      console.log('Purchase check error:', err);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.createOrder(course._id);
      const { order } = res.data;

      const htmlContent = `
        <html>
          <head>
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          </head>
          <body>
            <script>
              const options = {
                "key": "${order.key_id || 'rzp_test_RXauOSZdEoe2PO'}",
                "amount": ${order.amount},
                "currency": "INR",
                "name": "UTalk Course",
                "description": "${course.title?.replace(/'/g, "\\'")}",
                "order_id": "${order.id}",
                "prefill": {
                  "name": "${user?.name?.replace(/'/g, "\\'") || ''}",
                  "email": "${user?.email || ''}",
                  "contact": "${user?.phone || '9999999999'}"
                },
                "theme": { "color": "${theme?.primary || '#0f1419'}" },
                "handler": function (response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ success: true, response }));
                },
                "modal": {
                  "ondismiss": function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ success: false }));
                  }
                }
              };
              const rzp = new Razorpay(options);
              rzp.open();
            </script>
          </body>
        </html>
      `;

      setCheckoutUrl(htmlContent);
    } catch (err) {
      Alert.alert('Error', 'Could not initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const onMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.success) {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data.response;

        await paymentAPI.verifyPayment({
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpaySignature: razorpay_signature,
          courseId: course._id
        });

        Alert.alert('Payment Successful!', 'Course unlocked successfully!');
        navigation.replace('CoursePlaylist', { 
          course, 
          unlockedTopics: course.topics?.length || 0,
          isPurchased: true
        });
      } else {
        Alert.alert('Payment Cancelled', 'Payment was cancelled.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      Alert.alert('Payment Error', 'Payment verification failed. Please contact support.');
    } finally {
      setCheckoutUrl(null);
      setLoading(false);
    }
  };

  if (alreadyPurchased) {
    return null;
  }

  const tutor = course.owner;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background || '#0f1419' }]}>
      {checkoutUrl ? (
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: checkoutUrl }}
          onMessage={onMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      ) : (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>

            <Image
              source={{ uri: course.thumbnail }}
              style={styles.thumbnail}
            />

            <View style={styles.details}>

              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme?.text || '#fff' }]} numberOfLines={1}>
                  {course.title}
                </Text>

                <TouchableOpacity onPress={() => setShowMenu(true)}>
                  <Feather name="more-vertical" size={22} color={theme?.text || '#fff'} />
                </TouchableOpacity>
              </View>

              <Text
                numberOfLines={expanded ? undefined : 3}
                style={[styles.description, { color: theme?.textSecondary || '#888' }]}
              >
                {course.description || 'No description available.'}
              </Text>

              {course.description && course.description.length > 100 && (
                <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                  <Text style={{ color: '#fff', marginBottom: 10, fontSize: 14 }}>
                    {expanded ? 'Show Less' : 'Show More'}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={[styles.topics, { backgroundColor: theme?.surfaceAlt || '#1a1a1a' }]}>
                <Text style={[styles.topicsTitle, { color: theme?.text || '#fff' }]}>
                  Topics
                </Text>

                {course.topics ? course.topics.map((topic, index) => (
                  <View key={index} style={styles.topicRow}>
                    <Feather name="play-circle" size={16} color={theme?.text || '#fff'} />
                    <Text style={{ color: theme?.text || '#fff', fontSize: 14, flex: 1 }} numberOfLines={1}>
                      {topic.name || `Topic ${index + 1}`}
                    </Text>
                  </View>
                )) : (
                  <Text style={{ color: theme?.textSecondary || '#888', fontStyle: 'italic' }}>
                    No topics listed
                  </Text>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={{ color: theme?.text || '#fff', fontSize: 12 }}>Trust</Text>
                  <Text style={{ color: theme?.text || '#fff', fontWeight: 'bold' }}>
                    {formatNumber(course.trustCount || 0)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={{ color: theme?.text || '#fff', fontSize: 12 }}>
                    {countLoading ? 'Loading...' : 'Views'}
                  </Text>
                  <Text style={{ color: theme?.text || '#fff', fontWeight: 'bold' }}>
                    {formatNumber(paymentCount)}
                  </Text>
                </View>
              </View>

              <View style={[styles.tutorBox, { backgroundColor: theme?.surfaceAlt || '#1a1a1a' }]}>
                <Text style={[styles.topicsTitle, { color: theme?.text || '#fff' }]}>
                  About Tutor
                </Text>

                <TouchableOpacity
                  style={styles.tutorContainer}
                  onPress={() => {
                    if (user?._id === tutor?._id) {
                      navigation.navigate('MainTabs', { screen: 'Profile' });
                    } else if (tutor?._id) {
                      navigation.navigate('PublicProfile', { userId: tutor._id });
                    }
                  }}
                  disabled={!tutor?._id}
                >
                  <Image
                    source={{ uri: tutor?.profilePicture }}
                    style={styles.tutorImageLarge}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tutorNameLarge, { color: theme?.text || '#fff' }]}>
                      {tutor?.name || 'Unknown Tutor'}
                    </Text>
                    {tutor?._id ? (
                      <Text style={{ color: theme?.textSecondary || '#888', fontSize: 12 }}>
                        View Profile
                      </Text>
                    ) : (
                      <Text style={{ color: theme?.textSecondary || '#888', fontSize: 12 }}>
                        Profile not available
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>

          {showMenu && (
            <TouchableOpacity 
              style={styles.menuOverlay}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            >
              <View style={[styles.menu, { backgroundColor: theme?.surfaceAlt || '#1a1a1a' }]}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={async () => { 
                    try {
                      const isSaved = savedCourseIds.has(course._id);
                      await userAPI.toggleSaveCourse(course._id);
                      setSavedCourseIds(prev => {
                        const newSet = new Set(prev);
                        if (isSaved) {
                          newSet.delete(course._id);
                        } else {
                          newSet.add(course._id);
                        }
                        return newSet;
                      });
                      Alert.alert('Success', isSaved ? 'Course unsaved!' : 'Course saved!');
                      refreshUser();
                    } catch (error) {
                      Alert.alert('Error', error.response?.data?.message || 'Toggle failed');
                    }
                    setShowMenu(false); 
                  }}
                >
                  <Feather name={savedCourseIds.has(course._id) ? "bookmark" : "bookmark"} size={20} color={theme?.text || '#fff'} />
                  <Text style={[styles.menuText, { color: theme?.text || '#fff' }]}>{savedCourseIds.has(course._id) ? 'Unsave Course' : 'Save Course'}</Text>
                </TouchableOpacity>
                
              </View>
            </TouchableOpacity>
          )}

          <View style={[styles.bottomBar, { backgroundColor: theme?.surface || '#000' }]}>
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: theme?.primary || '#6366f1' }]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.payBtnText}>Pay</Text>
                  <Text style={styles.feeText}>₹{fee}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scroll: { 
    flex: 1 
  },
  backBtn: {
    position: 'absolute',
    top: 15,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
  },
  thumbnail: {
    width: '100%',
    height: 240,
  },
  details: { 
    padding: 20 
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    flex: 1,
    marginRight: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 5,
    textAlign: 'justify',
  },
  topics: {
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  topicsTitle: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '900',
    fontFamily: 'Poppins_600SemiBold',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  menu: {
    borderRadius: 16,
    padding: 12,
    minWidth: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  tutorBox: {
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  tutorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 12,
  },
  tutorImageLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
  },
  tutorNameLarge: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  payBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  feeText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '900',
  },
});

export default CoursePaymentScreen;

