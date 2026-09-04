import React from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import Avatar from '../../components/Avatar';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

export default function GameOverScreen({
  navigation,
  route,
}) {

  const {
    result = 'INNOCENTS_WIN',
  } = route?.params || {};

  const players = [
    {
      id: 1,
      name: 'Player 01',
      alive: false,
    },
    {
      id: 2,
      name: 'Player 02',
      alive: true,
    },
    {
      id: 3,
      name: 'Player 03',
      alive: true,
    },
    {
      id: 4,
      name: 'Player 04',
      alive: true,
    },
  ];

  const predatorsWon =
    result === 'PREDATORS_WIN';

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* RESULT */}
        <View style={styles.hero}>

          <Text style={styles.eyebrow}>
            DECEPTION AROUND US
          </Text>

          <Text style={styles.gameOver}>
            GAME OVER
          </Text>

          <Text
            style={[
              styles.result,
              predatorsWon
                ? styles.predatorResult
                : styles.innocentResult,
            ]}
          >
            {predatorsWon
              ? 'PREDATORS WIN'
              : 'INNOCENTS WIN'}
          </Text>

          <Text style={styles.description}>
            {predatorsWon
              ? 'The predators successfully outnumbered the remaining players.'
              : 'The players successfully eliminated all predators.'}
          </Text>

        </View>

        {/* FINAL STATE */}
        <GlassCard style={styles.finalCard}>

          <Text style={styles.sectionTitle}>
            FINAL PLAYER STATE
          </Text>

          {players.map((player) => (
            <View
              key={player.id}
              style={styles.playerRow}
            >

              <Avatar
                name={player.name}
                size={42}
              />

              <View style={styles.playerInfo}>

                <Text style={styles.playerName}>
                  {player.name}
                </Text>

                <Text
                  style={[
                    styles.status,
                    player.alive
                      ? styles.alive
                      : styles.dead,
                  ]}
                >
                  {player.alive
                    ? 'ALIVE'
                    : 'ELIMINATED'}
                </Text>

              </View>

            </View>
          ))}

        </GlassCard>

        {/* ACTIONS */}
        <View style={styles.actions}>

          <GlassButton
            title="BACK TO GAMEHUB"
            onPress={() =>
              navigation.replace('GameCatalog')
            }
          />

          <View style={styles.secondaryAction}>

            <GlassButton
              title="PLAY AGAIN"
              variant="secondary"
              onPress={() =>
                navigation.replace('GameCatalog')
              }
            />

          </View>

        </View>

      </ScrollView>

    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    padding: spacing.xl,
    paddingBottom: 40,
    justifyContent: 'center',
    flexGrow: 1,
  },

  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },

  eyebrow: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  gameOver: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 32,
  },

  result: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 22,
    marginTop: 12,
  },

  predatorResult: {
    color: colors.danger,
  },

  innocentResult: {
    color: colors.success,
  },

  description: {
    maxWidth: 350,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },

  finalCard: {
    marginBottom: spacing.xxl,
  },

  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 16,
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  playerInfo: {
    marginLeft: 12,
  },

  playerName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },

  status: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    marginTop: 4,
  },

  alive: {
    color: colors.success,
  },

  dead: {
    color: colors.danger,
  },

  actions: {
    width: '100%',
  },

  secondaryAction: {
    marginTop: spacing.sm,
  },

});