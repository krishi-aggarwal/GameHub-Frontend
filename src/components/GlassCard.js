import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function GlassCard({ children, style, glow, variant = 'default' }) {
  const glowStyle = glow ? styles[`glow_${glow}`] : null;

  return (
    <View style={[styles.card, styles[variant], glowStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  neon: {
    backgroundColor: 'rgba(19, 28, 46, 0.88)',
    borderColor: colors.borderStrong,
  },
  glow_purple: {
    borderColor: colors.primaryGlow,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  glow_cyan: {
    borderColor: colors.neonCyanGlow,
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  glow_pink: {
    borderColor: colors.neonPinkGlow,
    shadowColor: colors.neonPink,
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  glow_lime: {
    borderColor: colors.neonLimeGlow,
    shadowColor: colors.neonLime,
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  glow_gold: {
    borderColor: colors.neonAmberGlow,
    shadowColor: colors.neonAmber,
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
});
