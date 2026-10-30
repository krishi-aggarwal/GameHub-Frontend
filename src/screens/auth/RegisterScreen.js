import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassInput from '../../components/GlassInput';
import GlassButton from '../../components/GlassButton';
import Logo from '../../components/Logo';

import colors from '../../theme/colors';

import { register } from '../../api/authApi';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleRegister = async () => {
    if (
      !username.trim() ||
      !displayName.trim() ||
      !email.trim() ||
      !password
    ) {
      showToast('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      await register({
        username: username.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });

      showToast('Account created. Sign in to continue.', 'success');
      navigation.replace('Login');
    } catch (error) {
      console.error(
        'Registration failed:',
        error
      );

      showToast(
        getApiErrorMessage(error, 'Unable to create your account.')
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
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <Logo />

            <Text style={styles.welcome}>
              Join GameHub.
            </Text>

            <Text style={styles.description}>
              Create your account and enter the hub.
            </Text>
          </View>

          {/* REGISTER CARD */}

          <GlassCard style={styles.card}>
            <Text style={styles.title}>
              Create account
            </Text>

            <Text style={styles.subtitle}>
              Set up your GameHub profile.
            </Text>

            <GlassInput
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <GlassInput
              label="Display Name"
              placeholder="Enter your display name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCorrect={false}
              editable={!loading}
            />

            <GlassInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <GlassInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <GlassButton
              title={
                loading
                  ? 'CREATING ACCOUNT...'
                  : 'CREATE ACCOUNT'
              }
              onPress={handleRegister}
              disabled={loading}
            />

            {loading && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.loader}
              />
            )}

            {/* LOGIN */}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                Already have an account?
              </Text>

              <Text
                style={[
                  styles.loginLink,
                  loading && styles.disabledLink,
                ]}
                onPress={() => {
                  if (!loading) {
                    navigation.replace('Login');
                  }
                }}
              >
                Sign in
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

  loader: {
    marginTop: 12,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  loginText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 13,
  },

  loginLink: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    marginLeft: 5,
  },

  disabledLink: {
    opacity: 0.5,
  },
});