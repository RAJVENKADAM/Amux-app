import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const Message = ({ type = 'info', message, visible = false, onClose, autoHideTime = 4000 }) => {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();

      if (autoHideTime > 0 && onClose) {
        setTimeout(() => {
          handleClose();
        }, autoHideTime);
      }
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle',
          bgColor: theme.successBg,
          borderColor: theme.success,
          textColor: theme.successText || theme.textLight,
          iconColor: theme.success,
        };
      case 'error':
        return {
          icon: 'alert-circle',
          bgColor: theme.errorBg,
          borderColor: theme.error,
          textColor: theme.errorText || theme.textLight,
          iconColor: theme.error,
        };
      case 'warning':
        return {
          icon: 'alert-triangle',
          bgColor: theme.warningBg,
          borderColor: theme.warning,
          textColor: theme.warningText || theme.textLight,
          iconColor: theme.warning,
        };
      default: // info
        return {
          icon: 'info',
          bgColor: theme.infoBg,
          borderColor: theme.primary,
          textColor: theme.infoText || theme.textLight,
          iconColor: theme.primary,
        };
    }
  };

  const config = getConfig();

  if (!visible && fadeAnim._value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderLeftColor: config.borderColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          shadowOpacity: theme.cardShadow.shadowOpacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Feather name={config.icon} size={20} color={config.iconColor} style={styles.icon} />
        <Text style={[styles.message, { color: config.textColor }]}>{message}</Text>
      </View>
      
      {onClose && (
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={18} color={config.textColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default Message;

