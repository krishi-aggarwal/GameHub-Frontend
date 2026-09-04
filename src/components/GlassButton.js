import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';

import colors from '../theme/colors';

export default function GlassButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,

        variant === 'secondary' && styles.secondary,

        pressed && styles.pressed,

        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'secondary' && styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,

    backgroundColor: colors.primary,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 20,
  },

  secondary: {
    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.borderStrong,
  },

  text: {
  color: colors.white,
  fontFamily: 'Inter-SemiBold',
  fontSize: 15,
},

  secondaryText: {
    color: colors.text,
  },

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.4,
  },
});