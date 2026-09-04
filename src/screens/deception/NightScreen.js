import React, { useMemo, useState } from 'react';

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

export default function NightScreen({ navigation, route }) {

  /*
   * Later these values will come from the actual GameSession
   * returned by the backend.
   */
  const {
    sessionId = 'demo-session',
    role = 'PREDATOR',
    roundNumber = 1,
  } = route?.params || {};

  /*
   * Demo players for the UI.
   *
   * IMPORTANT:
   * We intentionally do NOT expose other players' roles.
   */
  const players = useMemo(
    () => [
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
    ],
    []
  );

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  /*
   * Determine what action this role can perform.
   */
  const actionInfo = {
    PREDATOR: {
      title: 'Choose a Target',
      description:
        'Select a living player to eliminate during the night.',
      action: 'ELIMINATE',
      button: 'ELIMINATE PLAYER',
    },

    DOCTOR: {
      title: 'Choose Someone to Protect',
      description:
        'Select a living player to protect from elimination tonight.',
      action: 'PROTECT',
      button: 'PROTECT PLAYER',
    },

    DETECTIVE: {
      title: 'Choose Someone to Investigate',
      description:
        'Select a living player to investigate their identity.',
      action: 'INVESTIGATE',
      button: 'INVESTIGATE PLAYER',
    },

    INNOCENT: {
      title: 'Night Watch',
      description:
        'You have no night action. Wait for the other players to finish.',
      action: null,
      button: null,
    },
  };

  const currentAction = actionInfo[role] || actionInfo.INNOCENT;

  /*
   * Temporary UI-only submit.
   *
   * During integration this will call:
   *
   * POST
   * /api/deception/rooms/{sessionId}/night/{action}
   *
   * with:
   *
   * {
   *   targetUserId
   * }
   */
  function handleSubmitAction() {

    if (!selectedPlayer) {
      Alert.alert(
        'Select a Player',
        'Choose a living player before continuing.'
      );

      return;
    }

    setSubmitted(true);

    Alert.alert(
      'Action Submitted',
      'Your night action has been submitted.',
      [
        {
          text: 'Continue',
          onPress: () =>
            navigation.navigate('Day', {
              sessionId,
            }),
        },
      ]
    );
  }

  /*
   * Innocent players cannot perform a night action.
   */
  const canAct = role !== 'INNOCENT';

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
              NIGHT {String(roundNumber).padStart(2, '0')}
            </Text>
          </View>

          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>
              NIGHT
            </Text>
          </View>
        </View>

        {/* ROLE CARD */}
        <GlassCard style={styles.roleCard}>

          <Text style={styles.sectionLabel}>
            YOUR ROLE
          </Text>

          <Text style={styles.role}>
            {role}
          </Text>

          <Text style={styles.description}>
            {currentAction.description}
          </Text>

        </GlassCard>

        {/* INNOCENT STATE */}
        {!canAct && (
          <GlassCard style={styles.waitingCard}>

            <Text style={styles.waitingTitle}>
              WAITING FOR NIGHT ACTIONS
            </Text>

            <Text style={styles.waitingText}>
              Other players with night abilities are
              making their decisions.
            </Text>

            <View style={styles.waitingIndicator}>
              <View style={styles.dot} />

              <Text style={styles.waitingIndicatorText}>
                Waiting for morning...
              </Text>
            </View>

          </GlassCard>
        )}

        {/* ACTION AREA */}
        {canAct && !submitted && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {currentAction.title}
              </Text>

              <Text style={styles.sectionSubtitle}>
                Select one living player
              </Text>
            </View>

            <View style={styles.playersGrid}>

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
                        setSelectedPlayer(player.id)
                      }
                      style={[
                        styles.playerCard,
                        selected && styles.selectedPlayer,
                      ]}
                    >

                      <Avatar
                        uri={player.avatarUrl}
                        name={player.name}
                        size={56}
                      />

                      <Text style={styles.playerName}>
                        {player.name}
                      </Text>

                      {selected && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>
                            SELECTED
                          </Text>
                        </View>
                      )}

                    </Pressable>
                  );
                })}

            </View>

            <GlassButton
              title={currentAction.button}
              onPress={handleSubmitAction}
              disabled={!selectedPlayer}
            />
          </>
        )}

        {/* SUBMITTED STATE */}
        {canAct && submitted && (
          <GlassCard style={styles.submittedCard}>

            <Text style={styles.submittedTitle}>
              ACTION SUBMITTED
            </Text>

            <Text style={styles.submittedText}>
              Your decision has been recorded.
            </Text>

            <Text style={styles.submittedWaiting}>
              Waiting for the remaining night actions...
            </Text>

          </GlassCard>
        )}

        {/* SAFE NIGHT ACTIVITY */}
        <GlassCard style={styles.activityCard}>

          <Text style={styles.sectionLabel}>
            NIGHT ACTIVITY
          </Text>

          <View style={styles.activityRow}>
            <View style={styles.activityDot} />

            <Text style={styles.activityText}>
              A player has completed their night action.
            </Text>
          </View>

          <View style={styles.activityRow}>
            <View style={styles.activityDot} />

            <Text style={styles.activityText}>
              Waiting for the remaining players...
            </Text>
          </View>

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

  phaseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },

  phaseText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 1,
  },

  roleCard: {
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1.3,
    marginBottom: 8,
  },

  role: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 25,
    marginBottom: 10,
  },

  description: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
  },

  waitingCard: {
    marginBottom: spacing.xl,
  },

  waitingTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 8,
  },

  waitingText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
  },

  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
    marginRight: 8,
  },

  waitingIndicatorText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },

  sectionHeader: {
    marginBottom: spacing.md,
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
  },

  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  playerCard: {
    width: '47%',
    minHeight: 130,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },

  selectedPlayer: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
  },

  playerName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    marginTop: 10,
  },

  selectedBadge: {
    marginTop: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },

  selectedBadgeText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    letterSpacing: 0.5,
  },

  submittedCard: {
    marginBottom: spacing.xl,
  },

  submittedTitle: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 8,
  },

  submittedText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 14,
  },

  submittedWaiting: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 14,
  },

  activityCard: {
    marginTop: spacing.xl,
  },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
    marginRight: 10,
  },

  activityText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
  },

});