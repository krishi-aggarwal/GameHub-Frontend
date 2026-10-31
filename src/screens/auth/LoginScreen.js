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
import { login } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';
import { playSfx } from '../../utils/soundEffects';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { saveAuth } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      playSfx('error');
      showToast('Please enter your username and password.');
      return;
    }

    try {
      setLoading(true);

      const data = await login(username.trim(), password);
      const token = data?.token || data?.accessToken;
      const user = data?.user || data;

      if (!token) {
        throw new Error('Login succeeded but no authentication token was received.');
      }

      playSfx('fanfare');
      await saveAuth(token, user);
      navigation.replace('Home');
    } catch (error) {
      console.error('Login failed:', error);
      playSfx('error');
      showToast(getApiErrorMessage(error, 'Invalid username or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* GAMEHUB GAMER HERO HEADER */}
          <View style={styles.header}>
            <Logo size="large" />

            <View style={styles.badgeRow}>
              <View style={styles.kickerBadge}>
                <Text style={styles.kickerText}>🕹️ READY PLAYER ONE</Text>
              </View>
            </View>

            <Text style={styles.welcome}>Enter The Arena</Text>
            <Text style={styles.description}>
              Sign in to host multiplayer rooms, roll dice, and challenge your crew.
            </Text>
          </View>

          {/* LOGIN CARD */}
          <GlassCard glow="purple" style={styles.card}>
            <Text style={styles.title}>Player Login</Text>
            <Text style={styles.subtitle}>Enter your GamerHub credentials.</Text>

            <GlassInput
              label="GamerTag / Username"
              placeholder="e.g. shadow_ninja"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <GlassInput
              label="Secret Key / Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <GlassButton
              title={loading ? 'ENTERING ARENA...' : 'ENTER GAMEHUB ⚡'}
              variant="primary"
              size="large"
              onPress={handleLogin}
              disabled={loading}
              sfx="start"
            />

            {loading && (
              <ActivityIndicator
                size="small"
                color={colors.neonCyan}
                style={styles.loader}
              />
            )}

            {/* REGISTER */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>New challenger?</Text>
              <Text
                style={[styles.registerLink, loading && styles.disabledLink]}
                onPress={() => {
                  if (!loading) {
                    playSfx('click');
                    navigation.navigate('Register');
                  }
                }}
              >
                Create Player Account →
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
    paddingHorizontal: 20,
    paddingVertical: 36,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeRow: {
    marginTop: 20,
    marginBottom: 8,
  },
  kickerBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.neonCyan,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kickerText: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  welcome: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  card: {
    padding: 22,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  registerText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
  },
  registerLink: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  disabledLink: {
    opacity: 0.5,
  },
  loader: {
    marginTop: 14,
  },
});
