
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
  submitNightAction,
} from '../../api/deceptionApi';

import {
  getApiErrorMessage,
} from '../../api/apiUtils';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  useGame,
} from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';

export default function NightScreen({
  navigation,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    sessionId,
    gamePhase,
    roundNumber,
    yourRole,
    yourUsername,
    players,
    lastEvent,
    fetchGameState,
    loading,
  } = useGame();

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

  const currentUserId =
    user?.userId ??
    user?.id ??
    user?.userID ??
    user?.user?.userId ??
    user?.user?.id ??
    null;

  const currentUsername =
    user?.username ??
    user?.user?.username ??
    yourUsername ??
    null;

  const currentDisplayName =
    user?.displayName ??
    user?.user?.displayName ??
    yourUsername ??
    user?.username ??
    'Player';

  const normalizedRole =
    String(yourRole || '')
      .toUpperCase();

  const isSamePlayer = (
    player
  ) => {
    if (!player) {
      return false;
    }

    if (
      currentUserId != null &&
      player.userId != null
    ) {
      return (
        String(player.userId) ===
        String(currentUserId)
      );
    }

    if (
      player.displayName &&
      currentDisplayName
    ) {
      return (
        String(player.displayName)
          .trim()
          .toLowerCase() ===
        String(currentDisplayName)
          .trim()
          .toLowerCase()
      );
    }

    return false;
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
        currentDisplayName,
      ]
    );

  const isAlive =
    currentPlayer
      ? currentPlayer.alive
      : true;

  /*
   * LOAD STATE
   */

  useEffect(() => {
    if (
      sessionId &&
      !yourRole
    ) {
      fetchGameState(
        sessionId
      ).catch(() => {});
    }
  }, [
    sessionId,
    yourRole,
    fetchGameState,
  ]);

  /*
   * RESET WHEN A NEW NIGHT / ROUND STARTS
   */

  useEffect(() => {
    if (
      gamePhase === 'NIGHT'
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
   * ALSO RESET FROM SOCKET EVENT
   */

  useEffect(() => {
    if (
      lastEvent?.type ===
      'NIGHT_STARTED'
    ) {
      setSelectedPlayer(null);
      setSubmitted(false);
      setSubmitting(false);
    }
  }, [
    lastEvent,
  ]);

  /*
   * ROLE INFORMATION
   */

  const actionInfo = {
    PREDATOR: {
      label: 'PREDATOR',
      title: 'Choose a Player to Eliminate',
      description:
        'Select one living player to eliminate during the night.',
      action: 'ELIMINATE',
      button: 'ELIMINATE PLAYER',
      accent: colors.danger,
      rule:
        'You cannot eliminate yourself.',
    },

    DOCTOR: {
      label: 'DOCTOR',
      title: 'Choose a Player to Protect',
      description:
        'Protect one living player from the Predator tonight.',
      action: 'PROTECT',
      button: 'PROTECT PLAYER',
      accent: colors.success,
      rule:
        'You may protect yourself or another living player.',
    },

    DETECTIVE: {
      label: 'DETECTIVE',
      title: 'Choose a Player to Investigate',
      description:
        'Investigate one living player to learn their role.',
      action: 'INVESTIGATE',
      button: 'INVESTIGATE PLAYER',
      accent: colors.warning,
      rule:
        'You cannot investigate yourself.',
    },

    INNOCENT: {
      label: 'INNOCENT',
      title: 'Night Watch',
      description:
        'You have no night ability. Stay alert and wait for morning.',
      action: null,
      button: null,
      accent: colors.primary,
      rule:
        'Watch the night unfold. Your decisions happen during the day.',
    },
  };

  const currentAction =
    actionInfo[normalizedRole] ||
    actionInfo.INNOCENT;

  /*
   * TARGET PLAYERS
   *
   * Doctor can target self.
   * Predator / Detective cannot.
   */

  const targetPlayers =
    useMemo(() => {
      return players.filter(
        (player) => {

          if (
            !player ||
            !player.alive
          ) {
            return false;
          }

          const isSelf =
            isSamePlayer(
              player
            );

          if (
            normalizedRole ===
            'DOCTOR'
          ) {
            return true;
          }

          return !isSelf;
        }
      );
    }, [
      players,
      normalizedRole,
      currentUserId,
      currentDisplayName,
    ]);

  /*
   * SUBMIT NIGHT ACTION
   */

  const handleSubmitAction =
    async () => {

      if (!sessionId) {
        showToast('No active game session was found.');
        return;
      }

      if (!currentAction.action) {
        return;
      }

      if (!selectedPlayer) {
        showToast('Choose a living player before continuing.');
        return;
      }

      const selectedTarget =
        players.find(
          (player) =>
            String(player.userId) ===
            String(selectedPlayer)
        );

      if (
        !selectedTarget ||
        !selectedTarget.alive
      ) {
        showToast('That player is no longer available.');

        setSelectedPlayer(null);
        return;
      }

      if (
        normalizedRole !== 'DOCTOR' &&
        isSamePlayer(selectedTarget)
      ) {
        showToast('You cannot target yourself.');

        setSelectedPlayer(null);
        return;
      }

      try {
        setSubmitting(true);

        await submitNightAction(
          sessionId,
          currentAction.action,
          selectedPlayer
        );

        setSubmitted(true);

        await fetchGameState(
          sessionId
        );

      } catch (error) {
        console.error(
          'Night action failed:',
          error
        );

        showToast(
          getApiErrorMessage(error, 'Unable to submit your night action.')
        );
      } finally {
        setSubmitting(false);
      }
    };

  /*
   * PHASE NAVIGATION
   */

  useEffect(() => {
    if (
      gamePhase === 'DAY'
    ) {
      navigation.replace(
        'Day'
      );
      return;
    }

    if (
      gamePhase === 'VOTING'
    ) {
      navigation.replace(
        'Voting'
      );
      return;
    }

    if (
      gamePhase === 'GAME_OVER'
    ) {
      navigation.replace(
        'GameOver'
      );
    }
  }, [
    gamePhase,
    navigation,
  ]);

  /*
   * NO SESSION
   */

  if (!sessionId) {
    return (
      <Screen>
        <View
          style={
            styles.loadingContainer
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            Game session unavailable
          </Text>

          <GlassButton
            title="BACK TO GAMEHUB"
            onPress={() =>
              navigation.replace(
                'Home'
              )
            }
          />
        </View>
      </Screen>
    );
  }

  /*
   * LOADING
   */

  if (
    loading &&
    !yourRole
  ) {
    return (
      <Screen>
        <View
          style={
            styles.loadingContainer
          }
        >
          <Text
            style={
              styles.loadingTitle
            }
          >
            Preparing the game...
          </Text>

          <Text
            style={
              styles.loadingText
            }
          >
            Assigning your role and
            loading the players.
          </Text>
        </View>
      </Screen>
    );
  }

  const canAct =
    isAlive &&
    normalizedRole !== 'INNOCENT' &&
    !!currentAction.action;

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
              style={styles.eyebrow}
            >
              DECEPTION AROUND US
            </Text>

            <Text
              style={styles.title}
            >
              NIGHT{' '}
              {String(
                roundNumber
              ).padStart(2, '0')}
            </Text>
          </View>

          <View
            style={styles.phaseBadge}
          >
            <View
              style={styles.phaseDot}
            />

            <Text
              style={styles.phaseText}
            >
              NIGHT
            </Text>
          </View>
        </View>

        {/* IDENTITY */}

        <GlassCard
          style={
            styles.identityCard
          }
        >
          <View
            style={
              styles.identityTop
            }
          >
            <Text
              style={
                styles.sectionLabel
              }
            >
              PLAYING AS
            </Text>

            <View
              style={
                styles.youBadge
              }
            >
              <Text
                style={
                  styles.youBadgeText
                }
              >
                YOU
              </Text>
            </View>
          </View>

          <View
            style={
              styles.identityContent
            }
          >
            <Avatar
              uri={
                currentPlayer?.avatarUrl ||
                user?.avatarUrl
              }
              name={
                currentDisplayName
              }
              size={58}
            />

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
                {currentDisplayName}
              </Text>

              <Text
                style={
                  styles.identityRole
                }
              >
                {normalizedRole ||
                  'ROLE LOADING...'}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.identityDivider
            }
          />

          <Text
            style={
              styles.identityHint
            }
          >
            Your role and night decisions
            are private.
          </Text>
        </GlassCard>

        {/* ROLE */}

        <GlassCard
          style={[
            styles.roleCard,
            {
              borderColor:
                currentAction.accent,
            },
          ]}
        >
          <View
            style={
              styles.roleHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionLabel
                }
              >
                YOUR ROLE
              </Text>

              <Text
                style={[
                  styles.role,
                  {
                    color:
                      currentAction.accent,
                  },
                ]}
              >
                {normalizedRole ||
                  'LOADING...'}
              </Text>
            </View>

            <View
              style={[
                styles.roleIcon,
                {
                  borderColor:
                    currentAction.accent,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleIconText,
                  {
                    color:
                      currentAction.accent,
                  },
                ]}
              >
                {normalizedRole ===
                'PREDATOR'
                  ? '☠'
                  : normalizedRole ===
                    'DOCTOR'
                  ? '+'
                  : normalizedRole ===
                    'DETECTIVE'
                  ? '?'
                  : '•'}
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.description
            }
          >
            {
              currentAction.description
            }
          </Text>

          <View
            style={
              styles.ruleBox
            }
          >
            <Text
              style={
                styles.ruleLabel
              }
            >
              NIGHT RULE
            </Text>

            <Text
              style={
                styles.ruleText
              }
            >
              {currentAction.rule}
            </Text>
          </View>
        </GlassCard>

        {/* DEAD PLAYER */}

        {!isAlive && (
          <GlassCard
            style={
              styles.deadCard
            }
          >
            <Text
              style={
                styles.deadTitle
              }
            >
              YOU ARE ELIMINATED
            </Text>

            <Text
              style={
                styles.deadText
              }
            >
              You cannot perform night actions.
              You are now observing the game.
            </Text>
          </GlassCard>
        )}

        {/* WAITING */}

        {isAlive &&
          !canAct && (
            <GlassCard
              style={
                styles.waitingCard
              }
            >
              <Text
                style={
                  styles.waitingTitle
                }
              >
                WAITING FOR MORNING
              </Text>

              <Text
                style={
                  styles.waitingText
                }
              >
                You have no night action.
                Other players with night
                abilities are making their
                decisions.
              </Text>

              <View
                style={
                  styles.waitingIndicator
                }
              >
                <View
                  style={styles.dot}
                />

                <Text
                  style={
                    styles.waitingIndicatorText
                  }
                >
                  Night actions are in progress...
                </Text>
              </View>
            </GlassCard>
          )}

        {/* ACTION */}

        {canAct &&
          !submitted && (
            <>
              <View
                style={
                  styles.sectionHeader
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {
                    currentAction.title
                  }
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  {normalizedRole ===
                  'DOCTOR'
                    ? 'Choose yourself or another living player'
                    : 'Choose one living player other than yourself'}
                </Text>
              </View>

              {targetPlayers.length ===
              0 ? (
                <GlassCard
                  style={
                    styles.emptyCard
                  }
                >
                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    NO VALID TARGETS
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    There are currently no
                    living players available
                    for this action.
                  </Text>
                </GlassCard>
              ) : (
                <View
                  style={
                    styles.playersGrid
                  }
                >
                  {targetPlayers.map(
                    (player) => {

                      const selected =
                        String(
                          selectedPlayer
                        ) ===
                        String(
                          player.userId
                        );

                      const isSelf =
                        isSamePlayer(
                          player
                        );

                      return (
                        <Pressable
                          key={
                            String(
                              player.userId
                            )
                          }
                          onPress={() => {

                            if (
                              normalizedRole !==
                                'DOCTOR' &&
                              isSelf
                            ) {
                              return;
                            }

                            setSelectedPlayer(
                              player.userId
                            );
                          }}
                          style={[
                            styles.playerCard,
                            selected &&
                              styles.selectedPlayer,
                          ]}
                        >
                          <View
                            style={
                              styles.avatarContainer
                            }
                          >
                            <Avatar
                              uri={
                                player.avatarUrl
                              }
                              name={
                                player.displayName
                              }
                              size={58}
                            />

                            <View
                              style={
                                styles.aliveDot
                              }
                            />
                          </View>

                          <Text
                            style={
                              styles.playerName
                            }
                          >
                            {
                              player.displayName
                            }

                            {isSelf &&
                              ' (you)'}
                          </Text>

                          <Text
                            style={
                              styles.aliveText
                            }
                          >
                            ALIVE
                          </Text>

                          {selected && (
                            <View
                              style={
                                styles.selectedBadge
                              }
                            >
                              <Text
                                style={
                                  styles.selectedBadgeText
                                }
                              >
                                SELECTED
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    }
                  )}
                </View>
              )}

              <GlassButton
                title={
                  submitting
                    ? 'SUBMITTING...'
                    : currentAction.button
                }
                onPress={
                  handleSubmitAction
                }
                disabled={
                  !selectedPlayer ||
                  submitting
                }
              />
            </>
          )}

        {/* SUBMITTED */}

        {canAct &&
          submitted && (
            <GlassCard
              style={
                styles.submittedCard
              }
            >
              <View
                style={
                  styles.successCircle
                }
              >
                <Text
                  style={
                    styles.successIcon
                  }
                >
                  ✓
                </Text>
              </View>

              <Text
                style={
                  styles.submittedTitle
                }
              >
                ACTION SUBMITTED
              </Text>

              <Text
                style={
                  styles.submittedText
                }
              >
                Your decision has been
                recorded privately.
              </Text>

              <Text
                style={
                  styles.submittedWaiting
                }
              >
                Waiting for the remaining
                night actions...
              </Text>
            </GlassCard>
          )}

        {/* STATUS */}

        <GlassCard
          style={
            styles.activityCard
          }
        >
          <Text
            style={
              styles.sectionLabel
            }
          >
            NIGHT STATUS
          </Text>

          <View
            style={
              styles.activityRow
            }
          >
            <View
              style={styles.activityDot}
            />

            <Text
              style={
                styles.activityText
              }
            >
              Night actions are processed
              privately.
            </Text>
          </View>

          <View
            style={
              styles.activityRow
            }
          >
            <View
              style={styles.activityDot}
            />

            <Text
              style={
                styles.activityText
              }
            >
              Other players cannot see
              your selected target.
            </Text>
          </View>

          <View
            style={
              styles.activityRow
            }
          >
            <View
              style={styles.activityDot}
            />

            <Text
              style={
                styles.activityText
              }
            >
              The game advances when all
              required night actions are complete.
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
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  eyebrow: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.6,
    marginBottom: 6,
  },

  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 30,
  },

  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },

  phaseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 7,
  },

  phaseText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1,
  },

  identityCard: {
    marginBottom: spacing.lg,
  },

  identityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  youBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
  },

  youBadgeText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
  },

  identityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  identityInfo: {
    marginLeft: 14,
    flex: 1,
  },

  identityName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 19,
    marginBottom: 5,
  },

  identityRole: {
    color: colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },

  identityDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 15,
  },

  identityHint: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 17,
  },

  roleCard: {
    marginBottom: spacing.lg,
  },

  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 7,
  },

  role: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 25,
    marginBottom: 10,
  },

  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: colors.surfaceStrong,
  },

  roleIconText: {
    fontFamily: 'Inter-Bold',
    fontSize: 21,
  },

  description: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
  },

  ruleBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },

  ruleLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 5,
  },

  ruleText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 17,
  },

  deadCard: {
    marginBottom: spacing.lg,
    borderColor: colors.danger,
  },

  deadTitle: {
    color: colors.danger,
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    marginBottom: 7,
  },

  deadText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
  },

  waitingCard: {
    marginBottom: spacing.lg,
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
    fontSize: 13,
    lineHeight: 20,
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
    fontSize: 11,
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
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 11,
    marginTop: 5,
    lineHeight: 17,
  },

  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  playerCard: {
    width: '47%',
    minHeight: 145,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },

  selectedPlayer: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },

  avatarContainer: {
    position: 'relative',
  },

  aliveDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },

  playerName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },

  aliveText: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 4,
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

  emptyCard: {
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    color: colors.warning,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    marginBottom: 7,
  },

  emptyText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
  },

  submittedCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },

  successCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  successIcon: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 22,
  },

  submittedTitle: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 7,
  },

  submittedText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    textAlign: 'center',
  },

  submittedWaiting: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 14,
    textAlign: 'center',
  },

  activityCard: {
    marginTop: spacing.md,
  },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },

  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 10,
    marginTop: 5,
  },

  activityText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 17,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  loadingTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 8,
  },

  loadingText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 14,
    textAlign: 'center',
  },

  errorTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 20,
  },

});
