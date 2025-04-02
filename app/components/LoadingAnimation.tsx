import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';

export default function LoadingAnimation() {
  return (
    <SafeAreaView style={styles.container}>
      <LottieView
        source={require('../../assets/animations/bus.json')}
        autoPlay
        loop
        speed={0.5}
        style={styles.animation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#64748b',
  },
});
