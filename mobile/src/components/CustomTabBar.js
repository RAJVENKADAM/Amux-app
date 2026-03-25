import React from 'react';
import { View, StyleSheet } from 'react-native';
import BottomNav from './BottomNav';
import { useTheme } from '../context/ThemeContext';

const CustomTabBar = ({ state, descriptors, navigation, scrollY }) => {
  const { theme } = useTheme();
  
  const currentRoute = state.routes[state.index].name;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <BottomNav 
        currentRoute={currentRoute}
        navigation={navigation}
        scrollY={scrollY}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

export default CustomTabBar;

