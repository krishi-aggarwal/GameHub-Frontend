import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import colors from '../theme/colors';

export default function Screen({ children, style }) {
  return (
    <SafeAreaView style={[styles.container, style]}>
      {/* Ambient Cyber Glow Orbs */}
      <View pointerEvents="none" style={styles.ambientTopRight} />
      <View pointerEvents="none" style={styles.ambientBottomLeft} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientTopRight: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  ambientBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
});
