import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function Logo({ size = 'medium' }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <View style={styles.container}>
      <View style={[styles.emblem, isLarge && styles.emblemLarge, isSmall && styles.emblemSmall]}>
        <Text style={[styles.emblemGlyph, isLarge && styles.emblemGlyphLarge, isSmall && styles.emblemGlyphSmall]}>
          🕹️
        </Text>
      </View>
      <View>
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, isLarge && styles.brandTextLarge, isSmall && styles.brandTextSmall]}>
            GAME<Text style={styles.brandAccent}>HUB</Text>
          </Text>
          <View style={styles.liveDot} />
        </View>
        {!isSmall && (
          <Text style={styles.tagline}>MULTIPLAYER ARENA</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblem: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E1B4B',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  emblemLarge: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  emblemSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  emblemGlyph: {
    fontSize: 20,
  },
  emblemGlyphLarge: {
    fontSize: 26,
  },
  emblemGlyphSmall: {
    fontSize: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 20,
    letterSpacing: 1.5,
  },
  brandTextLarge: {
    fontSize: 28,
    letterSpacing: 2,
  },
  brandTextSmall: {
    fontSize: 16,
    letterSpacing: 1,
  },
  brandAccent: {
    color: colors.neonCyan,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonLime,
    marginLeft: 6,
    marginTop: -2,
  },
  tagline: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 7.5,
    letterSpacing: 1.8,
    marginTop: 1,
  },
});
