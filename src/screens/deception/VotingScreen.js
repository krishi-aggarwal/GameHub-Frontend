import React, { useState } from 'react';

import {
  Alert,
  Pressable,
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

export default function VotingScreen({ navigation, route }) {

  const {
    sessionId = 'demo-session',
    roundNumber = 1,
    isAlive = true,
  } = route?.params || {};

  const players = [
    {
      id: 1,
      name: 'You',
      avatarUrl: null,
      alive: true,
    },
    {
      id: 2,
      name: 'Player 02',
      avatarUrl: null,
      alive: true,
    },
    {
      id: 3,
      name: 'Player 03',
      avatarUrl: null,
      alive: true,
    },
    {
      id: 4,
      name: 'Player 04',
      avatarUrl: null,
      alive: true,
    },
  ];

  const [selectedPlayer, setSelectedPlayer] =
    useState(null);

  const [submitted, setSubmitted] =
    useState(false);

  function handleVote() {

    if (!selectedPlayer) {
      Alert.alert(
        'Select a Player',
        'Choose a player before submitting your vote.'
      );

      return;
    }

    /*
     * Later:
     *
     * POST
     * /api/deception/rooms/{sessionId}/vote
     *
     * {
     *   targetUserId
     * }
     */

    setSubmitted(true);

    Alert.alert(
      'Vote Submitted',
      'Your vote has been recorded.',
      [
        {
          text: 'OK',
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

        {/* HEADER */}
        <View style={styles.header}>

          <View>
            <Text style={styles.eyebrow}>
              DECEPTION AROUND US
            </Text>

            <Text style={styles.title}>
              VOTING
            </Text>
          </View>

          <View style={styles.roundBadge}>
            <Text style={styles.roundText}>
              DAY {String(roundNumber).padStart(2, '0')}
            </Text>
          </View>

        </View>

        {/* EXPLANATION */}
        <GlassCard style={styles.infoCard}>

          <Text style={styles.infoTitle}>
            Who do you suspect?
          </Text>

          <Text style={styles.infoText}>
            Choose one living player. The player with
            the most votes will be eliminated.
          </Text>

          <Text style={styles.warningText}>
            Ties result in no elimination.
          </Text>

        </GlassCard>

        {/* PLAYER LIST */}
        <Text style={styles.sectionTitle}>
          PLAYERS
        </Text>

        <Text style={styles.sectionSubtitle}>
          Select a player to cast your vote.
        </Text>

        <View style={styles.players}>

          {players
            .filter((player) => player.alive)
            .filter((player) => player.id !== 1)
            .map((player) => {

              const selected =
                selectedPlayer === player.id;

              return (
                <Pressable
                  key={player.id}
                  onPress={() =>
                    !submitted &&
                    setSelectedPlayer(player.id)
                  }
                  style={[
                    styles.player,
                    selected &&
                      styles.selectedPlayer,
                    submitted &&
                      styles.disabledPlayer,
                  ]}
                >

                  <Avatar
                    uri={player.avatarUrl}
                    name={player.name}
                    size={50}
                  />

                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {player.name}
                    </Text>

                    <Text style={styles.aliveText}>
                      ALIVE
                    </Text>
                  </View>

                  {selected && (
                    <View style={styles.voteBadge}>
                      <Text style={styles.voteBadgeText}>
                        YOUR VOTE
                      </Text>
                    </View>
                  )}

                </Pressable>
              );
            })}

        </View>

        {/* SUBMIT */}
        {isAlive ? (
          <GlassButton
            title={
              submitted
                ? 'VOTE SUBMITTED'
                : 'SUBMIT VOTE'
            }
            onPress={handleVote}
            disabled={
              !selectedPlayer || submitted
            }
          />
        ) : (
          <GlassCard style={styles.observerCard}>

            <Text style={styles.observerTitle}>
              OBSERVER MODE
            </Text>

            <Text style={styles.observerText}>
              You have been eliminated and cannot vote.
            </Text>

          </GlassCard>
        )}

        {/* INFO */}
        <GlassCard style={styles.footerCard}>

          <Text style={styles.footerText}>
            Votes are private until the voting phase
            resolves.
          </Text>

        </GlassCard>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    padding: spacing.xl,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  eyebrow: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 28,
  },

  roundBadge: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  roundText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },

  infoCard: {
    marginBottom: spacing.xl,
  },

  infoTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 8,
  },

  infoText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
  },

  warningText: {
    color: colors.warning,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 12,
  },

  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 4,
    marginBottom: spacing.md,
  },

  players: {
    gap: 10,
    marginBottom: spacing.xl,
  },

  player: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  selectedPlayer: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },

  disabledPlayer: {
    opacity: 0.6,
  },

  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  playerName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },

  aliveText: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    marginTop: 4,
  },

  voteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },

  voteBadgeText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
  },

  observerCard: {
    marginTop: 5,
  },

  observerTitle: {
    color: colors.warning,
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    marginBottom: 6,
  },

  observerText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
  },

  footerCard: {
    marginTop: spacing.xl,
  },

  footerText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },

});