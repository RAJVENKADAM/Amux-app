// VideoPlayerScreen - Stub (YouTube embed)
import React from 'react';
import { WebView } from 'react-native-webview';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const VideoPlayerScreen = ({ route }) => {
  const { theme } = useTheme();
  const { url, title } = route.params;

  const youtubeUrl = url.includes('youtu.be') 
    ? url.replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1'
    : url.replace('watch?v=', 'embed/') + '?autoplay=1';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <WebView
        source={{ uri: youtubeUrl }}
        startInLoadingState
        renderLoading={() => <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
};

export default VideoPlayerScreen;

