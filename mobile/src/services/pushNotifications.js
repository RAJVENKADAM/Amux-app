import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userAPI } from './api';

// Notifications.setNotificationHandler removed to avoid import error
// Handled automatically by expo-notifications

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants?.expoConfig?.extra?.eas.projectId,
    })).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
};

export const usePushNotifications = () => {
  const { user, setUser } = useAuth();

  const handleTokenReceived = async (token) => {
    if (!user) return;
    
    // Store token in user profile
    try {
      await userAPI.updateProfile({ pushToken: token });
      setUser(prev => ({ ...prev, pushToken: token }));
    } catch (err) {
      console.error('Failed to save push token:', err);
    }
  };

  return { handleTokenReceived };
};
