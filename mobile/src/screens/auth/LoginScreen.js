import React, { useState, useEffect, useRef } from 'react';
import {
View,
Text,
TextInput,
StyleSheet,
TouchableOpacity,
Platform,
ScrollView,
Alert,
Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Message from '../../components/Message';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const LoginScreen = ({ navigation }) => {
const { theme } = useTheme();

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState({ type: 'info', text: '', visible: false });
const { login } = useAuth();

// Animation values
const fadeAnim = useRef(new Animated.Value(0)).current;
const sheetFadeAnim = useRef(new Animated.Value(0)).current;
const logoFadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  // Simple fade in animation - all at once
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(sheetFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(logoFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    })
  ]).start();
}, []);

const handleLogin = async () => {

if (!email || !password) {
  showMessage('error', 'Please fill in all fields');
  return;
}

setLoading(true);

const result = await login({ email, password });

setLoading(false);

if (!result.success) {

  // Handle OTP verification needed
  if (result.type === 'otp_verification') {
    showMessage('info', result.message);
    navigation.navigate('VerifyEmail', { email });
    return;
  }

  showMessage('error', result.message);
} else {
  showMessage('success', 'Login successful! Redirecting...');
}

};

const showMessage = (type, text) => {
  setMessage({ type, text, visible: true });
};

const hideMessage = () => {
  setMessage(prev => ({ ...prev, visible: false }));
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

<Animated.View
style={[styles.container, { opacity: fadeAnim }]}>

<ScrollView contentContainerStyle={styles.scroll}>

{/* App Header */}



{/* White Modal */}

<Animated.View style={[styles.sheet, { backgroundColor: theme.surface, shadowColor: theme.cardShadow.shadowColor, elevation: theme.cardShadow.elevation }]}>

<Text style={[styles.sheetTitle, { color: theme.text }]}>Welcome back</Text>

<View style={styles.inputBox}>
<TextInput
placeholder="Email"
placeholderTextColor={theme.textLight}
style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
value={email}
onChangeText={setEmail}
autoCapitalize="none"
/>
</View>

<View style={styles.inputBox}>
<TextInput
placeholder="Password"
placeholderTextColor={theme.textLight}
style={[styles.input, { paddingRight: 40, borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
value={password}
onChangeText={setPassword}
secureTextEntry={!showPassword}
/>

{password.length > 0 && (
<TouchableOpacity
style={styles.eye}
onPress={()=>setShowPassword(!showPassword)}
>
<Feather
name={showPassword ? 'eye-off':'eye'}
size={20}
color={theme.textSecondary}
/>
</TouchableOpacity>
)}

</View>

<TouchableOpacity
style={[styles.button, { backgroundColor: theme.primary }, loading && { backgroundColor: theme.borderDark }]}
onPress={handleLogin}
disabled={loading}
>
<Text style={styles.buttonText}>
{loading ? 'Logging in...' : 'Login'}
</Text>
</TouchableOpacity>

<View style={styles.footer}>
<Text style={{ color: theme.textSecondary }}>Don't have an account?</Text>

<TouchableOpacity
onPress={()=>navigation.navigate('Register')}
>
<Text style={[styles.link, { color: theme.primary }]}> Sign Up</Text>
</TouchableOpacity>

</View>

</Animated.View>

</ScrollView>
</Animated.View>
</SafeAreaView>
</View>
);
};

const styles = StyleSheet.create({

safeArea: {
  flex: 1,
},

container:{
flex:1
},

gradient: {
  flex: 1,
},

scroll:{
flexGrow:1,
justifyContent:'center'
},

title: {
  fontSize: 48,
  fontFamily: 'Poppins_900Black',
  letterSpacing: -1,
  textAlign: 'center',
},

hi: {
  fontFamily: 'Poppins_900Black',
},

rhub: {
  fontFamily: 'Poppins_900Black',
},

sheetTitle: {
  fontSize: 24,
  fontFamily: 'Poppins_700Bold',
  textAlign: 'left',
  marginBottom: 24,
},

header: {
  alignItems: 'center',
  marginBottom: 40,
},

sheet:{
  marginHorizontal:20,
  borderRadius:24,
  padding:24,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
},

inputBox:{
  marginBottom:20,
  position:'relative'
},

input:{
  borderWidth:1.5,
  borderRadius:12,
  padding:16,
  fontFamily: 'Poppins_400Regular',
  fontSize: 15,
},

eye:{
  position:'absolute',
  right:16,
  top:16
},

button:{
  padding:16,
  borderRadius:12,
  alignItems:'center',
  marginTop: 8,
},
buttonText:{
  color:'#fff',
  fontFamily: 'Poppins_700Bold',
  fontSize:16
},

footer:{
  flexDirection:'row',
  justifyContent:'center',
  marginTop:24
},

link:{
  fontFamily: 'Poppins_700Bold',
}

});

export default LoginScreen;

