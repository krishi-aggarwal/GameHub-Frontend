import React from 'react';

import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';

import colors from '../theme/colors';

export default function Avatar({
  uri,
  name = '?',
  size = 48,
}) {
  const initial =
    name?.trim()?.charAt(0)?.toUpperCase() || '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.initial,
          {
            fontSize: size * 0.38,
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },

  fallback: {
    backgroundColor: colors.surfaceStrong,

    justifyContent: 'center',
    alignItems: 'center',
  },

  initial: {
  color: colors.text,
  fontFamily: 'Inter-Bold',
},
});