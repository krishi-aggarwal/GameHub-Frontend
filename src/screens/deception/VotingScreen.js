
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
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

import {
  submitVote,
  getGameResult,
} from '../../api/deceptionApi';

import {
  useGame,
} from '../../context/GameContext';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  getApiErrorMessage,
} from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';

export default function VotingScreen({
  navigation,
}) {

  const {
    sessionId,
    gamePhase,
    roundNumber,
    players,
    yourUsername,
    yourRole,
    lastEvent,
    fetchGameState,
  } = useGame();

  const {
    user,
  } = useAuth();
  const { showToast } = useToast();

  const [
    selectedPlayer,
    setSelectedPlayer,
  ] = useState(null);

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  /*
   * CURRENT USER
   */

  const currentUserId =
    user?.userId ??
    user?.id ??
    user?.userID ??
    user?.user?.userId ??
    user?.user?.id ??
    null;

  /*
   * CURRENT PLAYER
   */

  const isSamePlayer =
    (player) => {

      if (
        !player ||
        currentUserId == null ||
        player.userId == null
      ) {
        return false;
      }

      return (
        String(player.userId) ===
        String(currentUserId)
      );
    };

  const currentPlayer =
    useMemo(
      () =>
        players.find(
          (player) =>
            isSamePlayer(player)
        ),
      [
        players,
        currentUserId,
      ]
    );

  const isAlive =
    currentPlayer
      ? currentPlayer.alive
      : true;

  /*
   * ELIGIBLE TARGETS
   *
   * Never include yourself.
   */

  const targetPlayers =
    useMemo(
      () =>
        players.filter(
          (player) =>
            player?.alive &&
            !isSamePlayer(player)
        ),
      [
        players,
        currentUserId,
      ]
    );

  /*
   * RESET WHEN NEW VOTING PHASE / ROUND
   */

  useEffect(() => {

    if (
      gamePhase === 'VOTING'
    ) {
      setSelectedPlayer(null);
      setSubmitted(false);
      setSubmitting(false);
    }

  }, [
    gamePhase,
    roundNumber,
  ]);

  /*
   * PHASE NAVIGATION
   */

  useEffect(() => {

    if (
      gamePhase === 'GAME_OVER'
    ) {
      navigation.replace(
        'GameOver'
      );

      return;
    }

    if (
      gamePhase === 'NIGHT'
    ) {
      navigation.replace(
        'Night'
      );

      return;
    }

    if (
      gamePhase === 'DAY'
    ) {
      navigation.replace(
        'Day'
      );
    }

  }, [
    gamePhase,
    navigation,
  ]);

  /*
   * SOCKET EVENTS
   */

  useEffect(() => {

    if (!lastEvent) {
      return;
    }

    switch (
      lastEvent.type
    ) {

      case 'VOTING_STARTED':
        fetchGameState(
          sessionId
        ).catch(() => {});
        break;

      case 'VOTING_RESOLVED':
      case 'PLAYER_ELIMINATED':

        fetchGameState(
          sessionId
        ).catch(() => {});

        break;

      case 'GAME_OVER':

        navigation.replace(
          'GameOver'
        );

        break;

      case 'NIGHT_STARTED':

        navigation.replace(
          'Night'
        );

        break;

      default:
        break;
    }

  }, [
    lastEvent,
    sessionId,
    fetchGameState,
    navigation,
  ]);

  /*
   * VOTE
   */

  async function handleVote() {

    if (!sessionId) {

      showToast('Game session not found.');

      return;
    }

    if (!isAlive) {

      showToast('You have been eliminated and cannot vote.');

      return;
    }

    if (!selectedPlayer) {

      showToast('Choose a player before submitting your vote.');

      return;
    }

    if (
      submitted ||
      submitting
    ) {
      return;
    }

    const target =
      targetPlayers.find(
        (player) =>
          String(player.userId) ===
          String(selectedPlayer)
      );

    if (!target) {

      showToast('That player is no longer eligible.');

      setSelectedPlayer(null);
      return;
    }

    try {

      setSubmitting(
        true
      );

      await submitVote(
        sessionId,
        selectedPlayer
      );

      setSubmitted(
        true
      );

      await fetchGameState(
        sessionId
      );

      showToast('Vote recorded.', 'success');

    } catch (error) {

      console.error(
        'Vote failed:',
        error
      );

      showToast(
        getApiErrorMessage(error, 'Unable to submit your vote.')
      );

    } finally {

      setSubmitting(
        false
      );
    }
  }

  /*
   * GAME OVER FALLBACK
   */

  async function handleGameOver() {

    try {

      await getGameResult(
        sessionId
      );

    } catch (error) {

      console.log(
        'Game result fetch failed:',
        error
      );

    } finally {

      navigation.replace(
        'GameOver'
      );
    }
  }

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* HEADER */}

        <View
          style={styles.header}
        >

          <View>

            <Text
              style={
                styles.eyebrow
              }
            >
              DECEPTION AROUND US
            </Text>

            <Text
              style={
                styles.title
              }
            >
              VOTING
            </Text>

          </View>

          <View
            style={
              styles.roundBadge
            }
          >

            <Text
              style={
                styles.roundText
              }
            >
              DAY{' '}
              {String(
                roundNumber
              ).padStart(2, '0')}
            </Text>

          </View>

        </View>

        {/* IDENTITY */}

        <GlassCard
          style={
            styles.identityCard
          }
        >

          <Text
            style={
              styles.identityLabel
            }
          >
            YOUR STATUS
          </Text>

          <View
            style={
              styles.identityRow
            }
          >

            <View
              style={
                styles.identityInfo
              }
            >

              <Text
                style={
                  styles.identityName
                }
              >
                {yourUsername ||
                  'YOU'}
              </Text>

              <Text
                style={
                  styles.identityRole
                }
              >
                {String(
                  yourRole ||
                  'PLAYER'
                ).toUpperCase()}
              </Text>

            </View>

            <View
              style={[
                styles.aliveBadge,
                !isAlive &&
                  styles.deadBadge,
              ]}
            >

              <Text
                style={[
                  styles.aliveBadgeText,
                  !isAlive &&
                    styles.deadBadgeText,
                ]}
              >
                {isAlive
                  ? 'ALIVE'
                  : 'ELIMINATED'}
              </Text>

            </View>

          </View>

        </GlassCard>

        {/* EXPLANATION */}

        <GlassCard
          style={
            styles.infoCard
          }
        >

          <Text
            style={
              styles.infoTitle
            }
          >
            Who do you suspect?
          </Text>

          <Text
            style={
              styles.infoText
            }
          >
            Choose one living player.
            The player with the most
            votes will be eliminated.
          </Text>

          <Text
            style={
              styles.warningText
            }
          >
            Ties result in no elimination.
          </Text>

        </GlassCard>

        {/* PLAYER LIST */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          PLAYERS
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          Select a living player to
          cast your vote.
        </Text>

        <View
          style={
            styles.players
          }
        >

          {targetPlayers.length ===
          0 ? (

            <GlassCard
              style={
                styles.emptyCard
              }
            >

              <Text
                style={
                  styles.emptyText
                }
              >
                No eligible players
                available.
              </Text>

            </GlassCard>

          ) : (

            targetPlayers.map(
              (player) => {

                const selected =
                  String(
                    selectedPlayer
                  ) ===
                  String(
                    player.userId
                  );

                const playerName =
                  player.displayName ||
                  player.username ||
                  `Player ${player.userId}`;

                return (
                  <Pressable
                    key={
                      String(
                        player.userId
                      )
                    }
                    onPress={() => {

                      if (
                        !submitted &&
                        !submitting &&
                        isAlive
                      ) {
                        setSelectedPlayer(
                          player.userId
                        );
                      }

                    }}
                    style={[
                      styles.player,
                      selected &&
                        styles.selectedPlayer,
                      submitted &&
                        styles.disabledPlayer,
                    ]}
                  >

                    <Avatar
                      uri={
                        player.avatarUrl
                      }
                      name={
                        playerName
                      }
                      size={50}
                    />

                    <View
                      style={
                        styles.playerInfo
                      }
                    >

                      <Text
                        style={
                          styles.playerName
                        }
                      >
                        {playerName}
                      </Text>

                      <Text
                        style={
                          styles.aliveText
                        }
                      >
                        ALIVE
                      </Text>

                    </View>

                    {selected && (

                      <View
                        style={
                          styles.voteBadge
                        }
                      >

                        <Text
                          style={
                            styles.voteBadgeText
                          }
                        >
                          YOUR VOTE
                        </Text>

                      </View>

                    )}

                  </Pressable>
                );
              }
            )

          )}

        </View>

        {/* SUBMIT / OBSERVER */}

        {isAlive ? (

          <GlassButton
            title={
              submitting
                ? 'SUBMITTING...'
                : submitted
                ? 'VOTE SUBMITTED'
                : 'SUBMIT VOTE'
            }
            onPress={
              handleVote
            }
            disabled={
              !selectedPlayer ||
              submitted ||
              submitting
            }
          />

        ) : (

          <GlassCard
            style={
              styles.observerCard
            }
          >

            <Text
              style={
                styles.observerTitle
              }
            >
              OBSERVER MODE
            </Text>

            <Text
              style={
                styles.observerText
              }
            >
              You have been eliminated.
              You can watch the voting phase
              but cannot vote.
            </Text>

          </GlassCard>

        )}

        {/* WAITING */}

        {submitted &&
          isAlive && (

          <GlassCard
            style={
              styles.waitingCard
            }
          >

            <View
              style={
                styles.waitingHeader
              }
            >

              <View
                style={
                  styles.waitingDot
                }
              />

              <Text
                style={
                  styles.waitingTitle
                }
              >
                VOTE LOCKED
              </Text>

            </View>

            <Text
              style={
                styles.waitingText
              }
            >
              Your vote is recorded.
              Waiting for the remaining
              living players to vote.
            </Text>

          </GlassCard>

        )}

        {/* GAME OVER FALLBACK */}

        {gamePhase ===
          'GAME_OVER' && (

          <GlassButton
            title="VIEW GAME RESULT"
            onPress={
              handleGameOver
            }
          />

        )}

        {/* INFO */}

        <GlassCard
          style={
            styles.footerCard
          }
        >

          <Text
            style={
              styles.footerText
            }
          >
            Votes remain private until
            the voting phase resolves.
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

  identityCard: {
    marginBottom: spacing.lg,
  },

  identityLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 10,
  },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  identityInfo: {
    flex: 1,
  },

  identityName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },

  identityRole: {
    color: colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },

  aliveBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  aliveBadgeText: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },

  deadBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.danger,
  },

  deadBadgeText: {
    color: colors.danger,
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
    backgroundColor:
      'rgba(139, 92, 246, 0.12)',
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
    borderColor: colors.warning,
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
    lineHeight: 19,
  },

  waitingCard: {
    marginTop: spacing.lg,
  },

  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  waitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },

  waitingTitle: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },

  waitingText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
  },

  emptyCard: {
    paddingVertical: 24,
  },

  emptyText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 13,
    textAlign: 'center',
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

