import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import colors from '../theme/colors';
import { playSfx } from '../utils/soundEffects';

export default function GlassButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  icon,
  size = 'medium',
  style,
  textStyle,
  sfx = 'click',
}) {
  const handlePress = (e) => {
    if (disabled) return;
    playSfx(sfx);
    if (onPress) onPress(e);
  };

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        styles[variant] || styles.primary,
        isSmall && styles.sizeSmall,
        isLarge && styles.sizeLarge,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {!!icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`] || styles.primaryText,
            isSmall && styles.textSmall,
            isLarge && styles.textLarge,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrap: {
    marginRight: 2,
  },
  sizeSmall: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sizeLarge: {
    minHeight: 56,
    paddingHorizontal: 24,
    borderRadius: 16,
  },

  /* VARIANTS */
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
  },
  primaryText: {
    color: colors.white,
  },

  cyan: {
    backgroundColor: colors.neonCyan,
    shadowColor: colors.neonCyan,
  },
  cyanText: {
    color: '#080B14',
    fontFamily: 'Inter-ExtraBold',
  },

  lime: {
    backgroundColor: colors.neonLime,
    shadowColor: colors.neonLime,
  },
  limeText: {
    color: '#080B14',
    fontFamily: 'Inter-ExtraBold',
  },

  pink: {
    backgroundColor: colors.neonPink,
    shadowColor: colors.neonPink,
  },
  pinkText: {
    color: colors.white,
    fontFamily: 'Inter-ExtraBold',
  },

  gold: {
    backgroundColor: colors.neonAmber,
    shadowColor: colors.neonAmber,
  },
  goldText: {
    color: '#1A1000',
    fontFamily: 'Inter-ExtraBold',
  },

  danger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
  },
  dangerText: {
    color: colors.white,
  },

  secondary: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.2,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
  },
  secondaryText: {
    color: colors.text,
  },

  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostText: {
    color: colors.textSecondary,
  },

  text: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
    letterSpacing: 0.8,
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.975 }],
  },
  disabled: {
    opacity: 0.42,
  },
});
