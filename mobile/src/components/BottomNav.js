// src/components/BottomNav.js
import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const BottomNav = ({ currentRoute, navigation, scrollY }) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const prevScrollY = useRef(0);
  const scrollDirection = useRef('down'); // 'up' or 'down'

  // Direction-aware animation
  const animateNav = (direction) => {
    Animated.timing(translateY, {
      toValue: direction === 'up' ? 80 : 0, // hide on up, show on down
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  scrollY?.addListener(({ value }) => {
    const delta = value - prevScrollY.current;
    const threshold = 5;

    if (Math.abs(delta) > threshold) {
      const newDirection = delta > 0 ? 'down' : 'up';
      if (newDirection !== scrollDirection.current) {
        scrollDirection.current = newDirection;
        animateNav(newDirection);
      }
    }
    prevScrollY.current = value;
  });

  const tabs = [
    { name: 'Home', icon: 'home', label: 'Home' },
{ name: 'Search', icon: 'search', label: 'Search' },
    { name: 'Upload', icon: 'upload-cloud', label: 'Upload' },
    { name: 'Notifications', icon: 'bell', label: 'Alerts' },
    { name: 'Profile', icon: 'user', label: 'Profile' },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          transform: [{ translateY }],
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = currentRoute === tab.name;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(tab.name)}
          >
            <Feather
              name={tab.icon}
              size={22}
              color={isActive ? '#e5467b' : theme.textLight}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? '#e5467b' : theme.textLight },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 65,
    paddingBottom: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 3,
    fontFamily: 'Poppins_500Medium',
  },
});