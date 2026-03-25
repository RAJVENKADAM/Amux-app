import React,{useState, useEffect, useRef} from 'react';
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

const RegisterScreen = ({navigation}) => {
const { theme } = useTheme();

const [name,setName] = useState('');
const [username,setUsername] = useState('');
const [email,setEmail] = useState('');
const [password,setPassword] = useState('');
const [confirmPassword,setConfirmPassword] = useState('');
const [showPassword,setShowPassword] = useState(false);
const [showConfirmPassword,setShowConfirmPassword] = useState(false);
const [loading,setLoading] = useState(false);
const [message, setMessage] = useState({ type: 'info', text: '', visible: false });

const { register } = useAuth();

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

const handleRegister = async () => {

if(!name || !username || !email || !password){
  showMessage('error', 'Please fill all fields');
  return;
}

if(password !== confirmPassword){
  showMessage('error', 'Passwords do not match');
  return;
}

setLoading(true);

const result = await register({
name,
username,
email,
password
});

setLoading(false);

if(!result.success){
  showMessage('error', result.message);
}else{

  showMessage('success', result.message);
  navigation.navigate('VerifyEmail', { email });

}

};

const showMessage = (type, text) => {
  setMessage({ type, text, visible: true });
};

const hideMessage = () => {
  setMessage(prev => ({ ...prev, visible: false }));
};

return(

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



<Animated.View style={[styles.sheet, { backgroundColor: theme.surface, shadowColor: theme.cardShadow.shadowColor, elevation: theme.cardShadow.elevation }]}>

<Text style={[styles.sheettitle, { color: theme.text }]}>Create Account</Text>

<TextInput
placeholder="Full Name"
placeholderTextColor={theme.textLight}
style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
value={name}
onChangeText={setName}
/>

<TextInput
placeholder="Username"
placeholderTextColor={theme.textLight}
style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
value={username}
onChangeText={setUsername}
autoCapitalize="none"
/>

<TextInput
placeholder="Email"
placeholderTextColor={theme.textLight}
style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
value={email}
onChangeText={setEmail}
/>

<View style={{position:'relative'}}>

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
name={showPassword?'eye-off':'eye'}
size={20}
color={theme.textSecondary}
/>
</TouchableOpacity>
)}

</View>

<View style={{position:'relative'}}>

<TextInput
placeholder="Confirm Password"
placeholderTextColor={theme.textLight}
style={[styles.input, { paddingRight: 40, borderColor: theme.border, color: theme.text, backgroundColor: theme.inputBackground }]}
value={confirmPassword}
onChangeText={setConfirmPassword}
secureTextEntry={!showConfirmPassword}
/>

{confirmPassword.length > 0 && (
<TouchableOpacity
style={styles.eye}
onPress={()=>setShowConfirmPassword(!showConfirmPassword)}
>
<Feather
name={showConfirmPassword?'eye-off':'eye'}
size={20}
color={theme.textSecondary}
/>
</TouchableOpacity>
)}

</View>

<TouchableOpacity
style={[styles.button, { backgroundColor: theme.primary }, loading && { backgroundColor: theme.borderDark }]}
onPress={handleRegister}
disabled={loading}
>
<Text style={styles.buttonText}>
{loading ? 'Creating...' : 'Sign Up'}
</Text>
</TouchableOpacity>

<View style={styles.footer}>

<Text style={{ color: theme.textSecondary }}>Already have an account?</Text>

<TouchableOpacity
onPress={()=>navigation.navigate('Login')}
>
<Text style={[styles.link, { color: theme.primary }]}> Login</Text>
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

header:{
  alignItems:'center',
  marginBottom:32
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

sheet:{
  marginHorizontal:20,
  borderRadius:24,
  padding:24,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
},

sheettitle:{
  fontSize: 24,
  fontFamily: 'Poppins_700Bold',
  textAlign: 'left',
  marginBottom: 20,
},

input:{
  borderWidth:1.5,
  borderRadius:12,
  padding:16,
  marginBottom:16,
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

export default RegisterScreen;

