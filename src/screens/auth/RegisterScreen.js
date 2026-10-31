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
import { playSfx } from '../../utils/soundEffects';

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
      playSfx('error');
      showToast('Please fill in all player fields.');
      return;
    }

    if (password.length < 6) {
      playSfx('error');
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

      playSfx('fanfare');
      showToast('Account created. Sign in to enter the arena!', 'success');
      navigation.replace('Login');
    } catch (error) {
      console.error('Registration failed:', error);
      playSfx('error');
      showToast(getApiErrorMessage(error, 'Unable to create your player account.'));
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
          {/* HEADER */}
          <View style={styles.header}>
            <Logo size="large" />

            <View style={styles.badgeRow}>
              <View style={styles.kickerBadge}>
                <Text style={styles.kickerText}>✨ NEW PLAYER ONBOARDING</Text>
              </View>
            </View>

            <Text style={styles.welcome}>Create Gamer Tag</Text>
            <Text style={styles.description}>
              Unlock party tools, track streaks, and host multiplayer games with friends.
            </Text>
          </View>

          {/* REGISTER CARD */}
          <GlassCard glow="cyan" style={styles.card}>
            <Text style={styles.title}>Player Registration</Text>
            <Text style={styles.subtitle}>Set up your profile to start playing.</Text>

            <GlassInput
              label="Player Name (Display Name)"
              placeholder="e.g. Captain Pixel"
              value={displayName}
              onChangeText={setDisplayName}
              autoCorrect={false}
              editable={!loading}
            />

            <GlassInput
              label="Unique GamerTag (Username)"
              placeholder="e.g. captain_pixel_99"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <GlassInput
              label="Email Address"
              placeholder="player@gamehub.io"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <GlassInput
              label="Secret Key / Password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <GlassButton
              title={loading ? 'CREATING PROFILE...' : 'JOIN GAMEHUB ⚡'}
              variant="cyan"
              size="large"
              onPress={handleRegister}
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

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already registered?</Text>
              <Text
                style={[styles.loginLink, loading && styles.disabledLink]}
                onPress={() => {
                  if (!loading) {
                    playSfx('click');
                    navigation.navigate('Login');
                  }
                }}
              >
                Sign in to Arena →
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
    marginTop: 18,
    marginBottom: 8,
  },
  kickerBadge: {
    backgroundColor: 'rgba(16, 231, 117, 0.12)',
    borderWidth: 1,
    borderColor: colors.neonLime,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kickerText: {
    color: colors.neonLime,
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  loginText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
  },
  loginLink: {
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
