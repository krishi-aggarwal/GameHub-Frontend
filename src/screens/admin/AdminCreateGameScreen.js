import React, { useState } from 'react';

import {
  Alert,
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

export default function AdminCreateGameScreen({
  navigation,
}) {

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const [minPlayers, setMinPlayers] = useState('4');
  const [maxPlayers, setMaxPlayers] = useState('15');

  function handleCreateGame() {

    if (
      !name.trim() ||
      !slug.trim() ||
      !description.trim()
    ) {
      Alert.alert(
        'Missing Information',
        'Please complete all required fields.'
      );

      return;
    }

    /*
     * Later this will call:
     *
     * POST /api/games/create
     *
     * This screen is intentionally limited to
     * the Beta-supported admin operation.
     */

    Alert.alert(
      'Game Created',
      'The game has been created successfully.',
      [
        {
          text: 'BACK',
          onPress: () =>
            navigation.navigate('GameCatalog'),
        },
      ]
    );
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
          />

          <GlassInput
            label="DESCRIPTION"
            placeholder="Describe the game..."
            value={description}
            onChangeText={setDescription}
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
            title="CREATE GAME"
            onPress={handleCreateGame}
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