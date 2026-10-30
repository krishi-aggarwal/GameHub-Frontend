
import React, {
  useState,
} from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassInput from '../../components/GlassInput';
import GlassButton from '../../components/GlassButton';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

import {
  createGame,
} from '../../api/gameApi';

import {
  getApiErrorMessage,
} from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';

export default function AdminCreateGameScreen({
  navigation,
}) {
  const [name, setName] =
    useState('');

  const [slug, setSlug] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [minPlayers, setMinPlayers] =
    useState('4');

  const [maxPlayers, setMaxPlayers] =
    useState('15');

  const [loading, setLoading] =
    useState(false);
  const { showToast } = useToast();

  async function handleCreateGame() {
    const trimmedName =
      name.trim();

    const trimmedSlug =
      slug.trim();

    const trimmedDescription =
      description.trim();

    const min =
      Number(minPlayers);

    const max =
      Number(maxPlayers);

    if (
      !trimmedName ||
      !trimmedSlug ||
      !trimmedDescription
    ) {
      showToast('Please complete all required fields.');

      return;
    }

    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max)
    ) {
      showToast('Minimum and maximum players must be valid numbers.');

      return;
    }

    if (min < 2 || max < 2) {
      showToast('Player limits must be at least 2.');

      return;
    }

    if (min > max) {
      showToast('Minimum players cannot exceed maximum players.');

      return;
    }

    try {
      setLoading(true);

      await createGame({
        name: trimmedName,
        slug: trimmedSlug,
        description: trimmedDescription,
        minPlayers: min,
        maxPlayers: max,
        gameType: 'PARTY',
        thumbnailUrl: null,
      });

      showToast('Game added to the catalog.', 'success');
      navigation.replace('GameCatalog');

      setName('');
      setSlug('');
      setDescription('');
      setMinPlayers('4');
      setMaxPlayers('15');

    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Unable to create the game.')
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.eyebrow}>
          ADMIN
        </Text>

        <Text style={styles.title}>
          CREATE GAME
        </Text>

        <Text style={styles.subtitle}>
          Add a new game to the GameHub catalog.
        </Text>

        <GlassCard>

          <GlassInput
            label="GAME NAME"
            placeholder="Example: Deception Around Us"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <GlassInput
            label="SLUG"
            placeholder="example-game"
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <GlassInput
            label="DESCRIPTION"
            placeholder="Describe the game..."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <GlassInput
            label="MINIMUM PLAYERS"
            placeholder="4"
            value={minPlayers}
            onChangeText={setMinPlayers}
            keyboardType="numeric"
          />

          <GlassInput
            label="MAXIMUM PLAYERS"
            placeholder="15"
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            keyboardType="numeric"
          />

          <GlassButton
            title={
              loading
                ? 'CREATING...'
                : 'CREATE GAME'
            }
            onPress={handleCreateGame}
            disabled={loading}
          />

        </GlassCard>

        <Text style={styles.note}>
          Admin game management is intentionally limited
          to creation for the Beta release.
        </Text>

      </ScrollView>

    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    padding: spacing.xl,
    paddingBottom: 40,
  },

  eyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 30,
  },

  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: spacing.xxl,
  },

  note: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 16,
  },

});

