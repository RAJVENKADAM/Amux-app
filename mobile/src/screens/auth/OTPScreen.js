import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Message from '../../components/Message';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const OTPScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { email = '' } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: 'info', text: '', visible: false });
  const { verifyOTP, resendOTP } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sheetFadeAnim = useRef(new Animated.Value(0)).current;
  const logoFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(sheetFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(logoFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      showMessage('error', 'Please enter full 4-digit OTP');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    const result = await verifyOTP(email, otp);
    
    if (result.success) {
      showMessage('success', 'OTP verified! Redirecting to login...');
      navigation.replace('Login');
    } else {
      showMessage('error', result.message);
      setOtp(''); // Clear OTP on error
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      showMessage('error', 'Email not available');
      return;
    }

    setLoading(true);
    const result = await resendOTP(email);
    showMessage(result.success ? 'success' : 'error', result.message);
    setLoading(false);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text, visible: true });
  };

  const hideMessage = () => {
    setMessage(prev => ({ ...prev, visible: false }));
  };

  const handleOtpChange = (text) => {
    if (/^\d{0,4}$/.test(text)) {
      setOtp(text);
    }
  };

  return (
    <View style={[styles.gradient, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Message
          type={message.type}
          message={message.text}
          visible={message.visible}
          onClose={hideMessage}
          autoHideTime={4000}
        />
        
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={styles.scroll}>
            

            <Animated.View style={[styles.sheet, { backgroundColor: theme.surface, shadowColor: theme.cardShadow.shadowColor, elevation: theme.cardShadow.elevation }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Enter OTP</Text>
              
              <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                We sent a 4-digit code to{' '}
                <Text style={[styles.email, { color: theme.primary }]}>{email}</Text>
              </Text>
              
              <Text style={[styles.subInstruction, { color: theme.textLight }]}>Check your email (including spam)</Text>

              <View style={styles.otpContainer}>
                <TextInput
                  style={[styles.otpInput, { 
                    borderColor: theme.border, 
                    color: theme.primary,
                    backgroundColor: theme.inputBackground,
                  }]}
                  value={otp}
                  onChangeText={handleOtpChange}
                  placeholder="0000"
                  placeholderTextColor={theme.textLight}
                  keyboardType="number-pad"
                  maxLength={4}
                  textAlign="center"
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }, loading && { backgroundColor: theme.borderDark }]}
                onPress={handleVerify}
                disabled={loading || otp.length !== 4}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resendButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                onPress={handleResend}
                disabled={loading}
              >
                <Text style={[styles.resendText, { color: theme.primary }]}>
                  {loading ? 'Sending...' : `Resend OTP to ${email ? email.substring(0, 8) + '...' : 'email'}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme.surfaceAlt }]}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={[styles.backText, { color: theme.textSecondary }]}>Change Email</Text>
              </TouchableOpacity>

              <Text style={[styles.helpText, { color: theme.textLight }]}>
                Code expires in 5 minutes
              </Text>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  title: {
    fontSize: 48,
    fontFamily: 'Poppins_900Black',
    letterSpacing: -1,
    textAlign: 'center',
  },
  hi: { fontFamily: 'Poppins_900Black' },
  rhub: { fontFamily: 'Poppins_900Black' },
  sheet: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  sheetTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 22,
  },
  email: {
    fontWeight: 'bold',
  },
  subInstruction: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpInput: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 8,
  },
  button: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { 
    color: '#fff', 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 16 
  },
  resendButton: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  backButton: {
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  backText: { 
    fontFamily: 'Poppins_700Bold', 
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default OTPScreen;

