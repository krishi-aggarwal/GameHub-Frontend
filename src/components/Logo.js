import React from 'react';
import {
  Text,
  StyleSheet,
} from 'react-native';

import colors from '../theme/colors';

export default function Logo() {
  return (
    <Text style={styles.logo}>
      GAMEHUB
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    color: colors.text,

    fontFamily: 'Inter-ExtraBold',

    fontSize: 34,

    letterSpacing: 3,
  },
});