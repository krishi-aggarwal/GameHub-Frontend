import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassInput from '../../components/GlassInput';
import GlassButton from '../../components/GlassButton';
import Logo from '../../components/Logo';

import colors from '../../theme/colors';

export default function LoginScreen({ navigation }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Authentication will be connected later.
    console.log('Login:', username);
  };

  return (
    <Screen>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.header}>
            <Logo />

            <Text style={styles.welcome}>
              Welcome back.
            </Text>

            <Text style={styles.description}>
              Enter the hub and find your next game.
            </Text>
          </View>

          <GlassCard style={styles.card}>

            <Text style={styles.title}>
              Sign in
            </Text>

            <Text style={styles.subtitle}>
              Continue your GameHub session.
            </Text>

            <GlassInput
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
            />

            <GlassInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <GlassButton
              title="ENTER GAMEHUB"
              onPress={handleLogin}
            />

            <View style={styles.registerRow}>

              <Text style={styles.registerText}>
                Don't have an account?
              </Text>

              <Text
                style={styles.registerLink}
                onPress={() =>
                  navigation.navigate('Register')
                }
              >
                Register
              </Text>

            </View>

          </GlassCard>

        </ScrollView>

      </KeyboardAvoidingView>

    </Screen>
  );
}

const styles = StyleSheet.create({

  keyboard: {
    flex: 1,
  },

  container: {
    flexGrow: 1,

    justifyContent: 'center',

    paddingHorizontal: 24,
    paddingVertical: 40,

    maxWidth: 520,

    width: '100%',

    alignSelf: 'center',
  },

  header: {
    alignItems: 'center',

    marginBottom: 32,
  },

  welcome: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 22,

    marginTop: 28,
  },

  description: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 14,

    marginTop: 8,

    textAlign: 'center',
  },

  card: {
    padding: 24,
  },

  title: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 24,
  },

  subtitle: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 13,

    marginTop: 6,
    marginBottom: 24,
  },

  registerRow: {
    flexDirection: 'row',

    justifyContent: 'center',

    marginTop: 22,
  },

  registerText: {
    color: colors.textMuted,

    fontFamily: 'Inter',

    fontSize: 13,
  },

  registerLink: {
    color: colors.primary,

    fontFamily: 'Inter-SemiBold',

    fontSize: 13,

    marginLeft: 5,
  },

});