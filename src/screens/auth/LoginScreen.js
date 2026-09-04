
import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassInput from '../../components/GlassInput';
import GlassButton from '../../components/GlassButton';
import Logo from '../../components/Logo';

import colors from '../../theme/colors';

import { login } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../api/apiUtils';

export default function LoginScreen({ navigation }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const { saveAuth } = useAuth();

  const handleLogin = async () => {

    // Basic validation
    if (!username.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter your username and password.'
      );

      return;
    }

    try {

      setLoading(true);

      // Call backend login API
      const data = await login(
        username.trim(),
        password
      );

      /*
       * Backend may return:
       * {
       *   token: "...",
       *   user: {...}
       * }
       *
       * We also support accessToken as a fallback.
       */
      const token =
        data?.token ||
        data?.accessToken;

      const user =
        data?.user ||
        data;

      if (!token) {
        throw new Error(
          'Login succeeded but no authentication token was received.'
        );
      }

      // Save JWT + user in AuthContext / AsyncStorage
      await saveAuth(token, user);

      // Move into the GameHub platform
      navigation.replace('Home');

    } catch (error) {

      console.error(
        'Login failed:',
        error
      );

      Alert.alert(
        'Login Failed',
        getApiErrorMessage(
          error,
          'Invalid username or password.'
        )
      );

    } finally {

      setLoading(false);

    }
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

          {/* GAMEHUB HEADER */}
          <View style={styles.header}>

            <Logo />

            <Text style={styles.welcome}>
              Welcome back.
            </Text>

            <Text style={styles.description}>
              Enter the hub and find your next game.
            </Text>

          </View>

          {/* LOGIN CARD */}
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
              autoCapitalize="none"
              editable={!loading}
            />

            <GlassInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <GlassButton
              title={
                loading
                  ? 'SIGNING IN...'
                  : 'ENTER GAMEHUB'
              }
              onPress={handleLogin}
              disabled={loading}
            />

            {loading && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.loader}
              />
            )}

            {/* REGISTER */}
            <View style={styles.registerRow}>

              <Text style={styles.registerText}>
                Don't have an account?
              </Text>

              <Text
                style={[
                  styles.registerLink,
                  loading && styles.disabledLink,
                ]}
                onPress={() => {
                  if (!loading) {
                    navigation.navigate('Register');
                  }
                }}
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

  disabledLink: {
    opacity: 0.5,
  },

  loader: {
    marginTop: 12,
  },

});

