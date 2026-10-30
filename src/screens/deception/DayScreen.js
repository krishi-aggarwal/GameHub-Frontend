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
  TextInput,
  View,
} from 'react-native';

import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';

import colors from '../../theme/colors';

import {
  useGame,
} from '../../context/GameContext';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  getInvestigationResult,
  sendGameChatMessage,
  startVoting,
} from '../../api/deceptionApi';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';


export default function DayScreen({
  navigation,
}) {

  const {
    sessionId,
    gamePhase,
    roundNumber,
    yourRole,
    yourUsername,
    players,
    isHost,
    lastEvent,
    fetchGameState,
  } = useGame();

  const {
    user,
  } = useAuth();
  const { showToast } = useToast();


  /*
   * DAY STATE
   */

  const [
    startingVoting,
    setStartingVoting,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    investigation,
    setInvestigation,
  ] = useState(null);


  /*
   * SAFE PLAYERS
   */

  const safePlayers =
    Array.isArray(players)
      ? players
      : [];


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

  const currentDisplayName =
    user?.displayName ??
    user?.user?.displayName ??
    yourUsername ??
    user?.username ??
    user?.user?.username ??
    'Player';


  /*
   * NORMALIZED ROLE
   */

  const normalizedRole =
    String(yourRole || '')
      .trim()
      .toUpperCase();


  /*
   * PLAYER IDENTITY
   *
   * Prefer userId.
   * Display name is fallback.
   */

  const isSamePlayer =
    (player) => {

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


  /*
   * CURRENT PLAYER
   */

  const currentPlayer =
    useMemo(
      () => {

        return safePlayers.find(
          (player) =>
            isSamePlayer(player)
        ) ?? null;

      },
      [
        players,
        currentUserId,
        currentDisplayName,
      ]
    );


  /*
   * ALIVE STATUS
   */

  const isAlive =
    currentPlayer
      ? currentPlayer.alive !== false
      : true;


  /*
   * CHAT EVENTS
   *
   * WebSocket
   *     ↓
   * GameContext
   *     ↓
   * lastEvent
   */

  useEffect(() => {

    if (
      lastEvent?.type !==
      'CHAT_MESSAGE'
    ) {
      return;
    }

    const chat =
      lastEvent.data;

    if (!chat) {
      return;
    }

    setMessages(
      (previous) => {

        const alreadyExists =
          previous.some(
            (item) => {

              if (
                item.messageId &&
                chat.messageId
              ) {
                return (
                  String(
                    item.messageId
                  ) ===
                  String(
                    chat.messageId
                  )
                );
              }

              return (
                String(item.userId) ===
                  String(chat.userId) &&
                item.message ===
                  chat.message
              );
            }
          );

        if (alreadyExists) {
          return previous;
        }

        return [
          ...previous,
          chat,
        ];
      }
    );

  }, [
    lastEvent,
  ]);


  /*
   * DETECTIVE INVESTIGATION
   *
   * Only:
   *
   * - DAY
   * - DETECTIVE
   * - alive
   * - valid session
   */

  useEffect(() => {

    if (
      gamePhase !== 'DAY' ||
      normalizedRole !== 'DETECTIVE' ||
      !sessionId ||
      !isAlive
    ) {
      return;
    }

    let mounted = true;

    async function loadInvestigation() {

      try {

        const result =
          await getInvestigationResult(
            sessionId
          );

        if (
          mounted &&
          result
        ) {
          setInvestigation(
            result
          );
        }

      } catch (error) {

        console.log(
          'Investigation result not available yet.'
        );
      }
    }

    loadInvestigation();

    return () => {
      mounted = false;
    };

  }, [
    gamePhase,
    normalizedRole,
    sessionId,
    roundNumber,
    isAlive,
  ]);


  /*
   * PLAYER ELIMINATION EVENT
   */

  const eliminatedByEvent =
    useMemo(() => {

      if (
        lastEvent?.type ===
        'PLAYER_ELIMINATED'
      ) {
        return lastEvent.data;
      }

      return null;

    }, [
      lastEvent,
    ]);


  /*
   * PLAYER NAME
   */

  const getPlayerName =
    (userId) => {

      const player =
        safePlayers.find(
          (item) =>
            String(item.userId) ===
            String(userId)
        );

      return (
        player?.displayName ??
        'Unknown Player'
      );
    };


  /*
   * HOST:
   * START VOTING
   *
   * Backend:
   *
   *     DAY → VOTING
   *
   * This is the ONLY action that
   * changes the phase from DAY.
   */

  const handleStartVoting =
    async () => {

      if (!isHost) {
        return;
      }

      if (
        startingVoting ||
        !sessionId
      ) {
        return;
      }

      if (
        gamePhase !== 'DAY'
      ) {
        return;
      }

      try {

        setStartingVoting(
          true
        );

        await startVoting(
          sessionId
        );

        /*
         * Host refreshes authoritative
         * game state immediately.
         */

        await fetchGameState(
          sessionId
        );

      } catch (error) {

        console.error(
          'Failed to start voting:',
          error
        );

        showToast(
          getApiErrorMessage(error, 'The voting phase could not be started.')
        );

      } finally {

        setStartingVoting(
          false
        );
      }
    };


  /*
   * VOTING_STARTED EVENT
   *
   * Non-host clients receive this
   * event and refresh their state.
   *
   * Backend remains the source
   * of truth.
   */

  useEffect(() => {

    if (
      lastEvent?.type !==
      'VOTING_STARTED'
    ) {
      return;
    }

    if (
      !sessionId ||
      isHost
    ) {
      return;
    }

    fetchGameState(
      sessionId
    );

  }, [
    lastEvent,
    sessionId,
    isHost,
    fetchGameState,
  ]);


  /*
   * SEND CHAT
   */

  const handleSendMessage =
    async () => {

      const trimmed =
        message.trim();

      if (!trimmed) {
        return;
      }

      if (!sessionId) {

        showToast('The game session is not available.');

        return;
      }

      if (!isAlive) {

        showToast('Dead players cannot send messages.');

        return;
      }

      try {
        await sendGameChatMessage(
          sessionId,
          trimmed
        );
        setMessage('');
      } catch (error) {
        showToast(
          getApiErrorMessage(error, 'Chat message could not be sent.')
        );
      }

    };


  /*
   * PHASE NAVIGATION
   *
   * GameContext's gamePhase is the
   * authoritative navigation state.
   */

  useEffect(() => {

    if (
      gamePhase === 'VOTING'
    ) {

      navigation.replace(
        'Voting'
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
   * SESSION GUARD
   */

  if (!sessionId) {

    return (
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
    );
  }


  /*
   * DAY GUARD
   */

  if (
    gamePhase !== 'DAY'
  ) {
    return null;
  }


  return (
    <View
      style={
        styles.screen
      }
    >

      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =========================
            HEADER
        ========================== */}

        <View
          style={
            styles.header
          }
        >

          <View>

            <Text
              style={
                styles.eyebrow
              }
            >
              ROUND {roundNumber}
            </Text>

            <Text
              style={
                styles.title
              }
            >
              DAY DISCUSSION
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Find the deception before
              it is too late.
            </Text>

          </View>

        </View>


        {/* =========================
            YOUR IDENTITY
        ========================== */}

        <GlassCard
          style={
            !isAlive
              ? styles.deadCard
              : styles.identityCard
          }
        >

          <View
            style={
              styles.identityHeader
            }
          >

            <View>

              <Text
                style={
                  styles.sectionLabel
                }
              >
                YOUR IDENTITY
              </Text>

              <Text
                style={
                  styles.identityName
                }
              >
                {yourUsername ||
                  currentDisplayName ||
                  'YOU'}
              </Text>

            </View>

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


          {!isAlive ? (

            <View
              style={
                styles.statusBox
              }
            >

              <Text
                style={
                  styles.statusIcon
                }
              >
                ☠
              </Text>

              <View>

                <Text
                  style={
                    styles.killedTitle
                  }
                >
                  YOU HAVE BEEN KILLED
                </Text>

                <Text
                  style={
                    styles.killedText
                  }
                >
                  You are now an observer.
                </Text>

              </View>

            </View>

          ) : (

            <View
              style={
                styles.roleBox
              }
            >

              <Text
                style={
                  styles.roleLabel
                }
              >
                YOUR ROLE
              </Text>

              <Text
                style={
                  styles.roleText
                }
              >
                {normalizedRole ||
                  'UNKNOWN'}
              </Text>

              <Text
                style={
                  styles.roleHint
                }
              >
                {normalizedRole ===
                'PREDATOR'
                  ? 'You are a PREDATOR. Stay hidden and eliminate the others.'
                  : normalizedRole ===
                    'DOCTOR'
                  ? 'You are the DOCTOR. Protect the right player at night.'
                  : normalizedRole ===
                    'DETECTIVE'
                  ? 'You are the DETECTIVE. Your investigation result is private.'
                  : 'You are INNOCENT. Work with the others to find the predators.'}
              </Text>

            </View>

          )}

        </GlassCard>


        {/* =========================
            ELIMINATION NOTICE
        ========================== */}

        {eliminatedByEvent != null && (

          <GlassCard
            style={
              styles.eliminationCard
            }
          >

            <Text
              style={
                styles.eliminationTitle
              }
            >
              PLAYER ELIMINATED
            </Text>

            <Text
              style={
                styles.eliminationName
              }
            >
              {getPlayerName(
                eliminatedByEvent
              )}
            </Text>

          </GlassCard>

        )}


        {/* =========================
            DETECTIVE RESULT
        ========================== */}

        {isAlive &&
          normalizedRole ===
            'DETECTIVE' &&
          investigation && (

          <GlassCard
            style={
              styles.investigationCard
            }
          >

            <Text
              style={
                styles.sectionLabel
              }
            >
              PRIVATE INVESTIGATION
            </Text>

            <Text
              style={
                styles.investigationPlayer
              }
            >
              {getPlayerName(
                investigation.investigatedUserId
              )}
            </Text>

            <Text
              style={
                styles.investigationResult
              }
            >
              ROLE:{' '}
              {String(
                investigation.role ||
                'UNKNOWN'
              ).toUpperCase()}
            </Text>

            <Text
              style={
                styles.privateText
              }
            >
              Only you can see this result.
            </Text>

          </GlassCard>

        )}


        {/* =========================
            PLAYERS
        ========================== */}

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
            PLAYERS
          </Text>

          <Text
            style={
              styles.playerCount
            }
          >
            {safePlayers.length} players
          </Text>

        </View>


        <View
          style={
            styles.playersList
          }
        >

          {safePlayers.map(
            (player) => {

              const isYou =
                isSamePlayer(
                  player
                );

              const playerLeft =
                player.left === true;

              const playerEliminated =
                player.alive === false && !playerLeft;

              return (
                <GlassCard
                  key={
                    String(
                      player.userId
                    )
                  }
                  style={[
                    styles.playerCard,
                    isYou &&
                      styles.youPlayerCard,
                    playerEliminated &&
                      styles.deadPlayerCard,
                  ]}
                >

                  <View
                    style={
                      styles.playerInfo
                    }
                  >

                    <View
                      style={
                        styles.avatar
                      }
                    >

                      <Text
                        style={
                          styles.avatarText
                        }
                      >
                        {(
                          player.displayName ||
                          '?'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Text>

                    </View>

                    <View
                      style={
                        styles.playerDetails
                      }
                    >

                      <View
                        style={
                          styles.playerNameRow
                        }
                      >

                        <Text
                          style={[
                            styles.playerName,
                            playerEliminated &&
                              styles.deadName,
                          ]}
                        >
                          {
                            player.displayName ||
                            'Unknown Player'
                          }
                        </Text>

                        {isYou && (

                          <View
                            style={
                              styles.youMiniBadge
                            }
                          >

                            <Text
                              style={
                                styles.youMiniBadgeText
                              }
                            >
                              YOU
                            </Text>

                          </View>

                        )}

                      </View>

                      <Text
                        style={
                          playerLeft
                            ? styles.leftStatus
                            : playerEliminated
                              ? styles.deadStatus
                              : styles.aliveStatus
                        }
                      >
                        {playerLeft
                          ? 'LEFT GAME'
                          : playerEliminated
                            ? 'ELIMINATED'
                            : 'ALIVE'}
                      </Text>

                    </View>

                  </View>

                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          playerLeft
                            ? colors.textMuted
                            : playerEliminated
                              ? colors.danger
                              : colors.success,
                      },
                    ]}
                  />

                </GlassCard>
              );
            }
          )}

        </View>


        {/* =========================
            DISCUSSION CONTROL
        ========================== */}

        <GlassCard
          style={
            styles.discussionCard
          }
        >

          <Text
            style={
              styles.sectionLabel
            }
          >
            DISCUSSION CONTROL
          </Text>


          {isHost ? (

            <>

              <Text
                style={
                  styles.controlText
                }
              >
                You are the host. Start
                voting whenever you are ready.
              </Text>

              <GlassButton
                title={
                  startingVoting
                    ? 'STARTING VOTING...'
                    : 'START VOTING'
                }
                onPress={
                  handleStartVoting
                }
                disabled={
                  startingVoting
                }
              />

            </>

          ) : (

            <View
              style={
                styles.waitingBox
              }
            >

              <Text
                style={
                  styles.waitingTitle
                }
              >
                WAITING FOR HOST
              </Text>

              <Text
                style={
                  styles.waitingText
                }
              >
                The host will start the
                voting phase when ready.
              </Text>

            </View>

          )}

        </GlassCard>


        {/* =========================
            CHAT
        ========================== */}

        <GlassCard
          style={
            styles.chatCard
          }
        >

          <View
            style={
              styles.chatHeader
            }
          >

            <View>

              <Text
                style={
                  styles.sectionLabel
                }
              >
                DISCUSSION CHAT
              </Text>

              <Text
                style={
                  styles.chatSubtitle
                }
              >
                Day chat is active
              </Text>

            </View>

          </View>


          <View
            style={
              styles.messagesContainer
            }
          >

            {messages.length === 0 ? (

              <Text
                style={
                  styles.emptyChat
                }
              >
                No messages yet.
              </Text>

            ) : (

              messages.map(
                (chat, index) => (

                  <View
                    key={
                      chat.messageId
                        ? String(
                            chat.messageId
                          )
                        : `${chat.userId}-${index}`
                    }
                    style={
                      styles.messageRow
                    }
                  >

                    <View
                      style={
                        styles.messageAvatar
                      }
                    >

                      <Text
                        style={
                          styles.messageAvatarText
                        }
                      >
                        {(
                          chat.displayName ||
                          '?'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Text>

                    </View>

                    <View
                      style={
                        styles.messageContent
                      }
                    >

                      <Text
                        style={
                          styles.messageAuthor
                        }
                      >
                        {chat.displayName ||
                          'Player'}
                      </Text>

                      <Text
                        style={
                          styles.messageText
                        }
                      >
                        {chat.message}
                      </Text>

                    </View>

                  </View>

                )
              )

            )}

          </View>


          <View
            style={
              styles.chatInputRow
            }
          >

            <TextInput
              value={
                message
              }
              onChangeText={
                setMessage
              }
              placeholder={
                isAlive
                  ? 'Type a message...'
                  : 'You are an observer'
              }
              placeholderTextColor={
                colors.textMuted
              }
              editable={
                isAlive
              }
              style={[
                styles.chatInput,
                !isAlive &&
                  styles.disabledInput,
              ]}
              maxLength={
                300
              }
              multiline
            />

            <Pressable
              onPress={
                handleSendMessage
              }
              disabled={
                !isAlive
              }
              style={[
                styles.sendButton,
                !isAlive &&
                  styles.disabledSendButton,
              ]}
            >

              <Text
                style={
                  styles.sendButtonText
                }
              >
                SEND
              </Text>

            </Pressable>

          </View>

        </GlassCard>

      </ScrollView>

    </View>
  );
}


/*
 * =============================
 * STYLES
 * =============================
 */

const styles = StyleSheet.create({

  /*
   * DARK SCREEN
   */

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: 20,
    paddingBottom: 50,
  },


  /*
   * HEADER
   */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  eyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 1.5,
  },

  title: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 27,
    marginTop: 4,
  },

  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    marginTop: 6,
    maxWidth: 280,
  },


  /*
   * IDENTITY
   */

  identityCard: {
    marginBottom: 16,
  },

  deadCard: {
    marginBottom: 16,
    borderColor: colors.danger,
  },

  identityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.3,
  },

  identityName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginTop: 5,
  },

  youBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  youBadgeText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },

  roleBox: {
    marginTop: 16,
    padding: 15,
    backgroundColor: colors.surfaceStrong,
    borderRadius: 15,
  },

  roleLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
  },

  roleText: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 23,
    marginTop: 4,
  },

  roleHint: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 7,
    lineHeight: 18,
  },

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 15,
  },

  statusIcon: {
    color: colors.danger,
    fontSize: 25,
    marginRight: 12,
  },

  killedTitle: {
    color: colors.danger,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },

  killedText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 3,
  },


  /*
   * ELIMINATION
   */

  eliminationCard: {
    marginBottom: 16,
    borderColor: colors.danger,
  },

  eliminationTitle: {
    color: colors.danger,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1,
  },

  eliminationName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 19,
    marginTop: 5,
  },


  /*
   * INVESTIGATION
   */

  investigationCard: {
    marginBottom: 16,
    borderColor: colors.primary,
  },

  investigationPlayer: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginTop: 8,
  },

  investigationResult: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    marginTop: 4,
  },

  privateText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    marginTop: 8,
  },


  /*
   * PLAYERS
   */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },

  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },

  playerCount: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
  },

  playersList: {
    marginBottom: 16,
  },

  playerCard: {
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  youPlayerCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },

  deadPlayerCard: {
    opacity: 0.65,
  },

  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },

  playerDetails: {
    marginLeft: 12,
    flex: 1,
  },

  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  playerName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },

  deadName: {
    color: colors.textMuted,
  },

  youMiniBadge: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 7,
  },

  youMiniBadgeText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
  },

  aliveStatus: {
    color: colors.success,
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    marginTop: 3,
  },

  deadStatus: {
    color: colors.danger,
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    marginTop: 3,
  },

  leftStatus: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    marginTop: 3,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },


  /*
   * DISCUSSION CONTROL
   */

  discussionCard: {
    marginBottom: 16,
  },

  controlText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 9,
    marginBottom: 15,
  },

  waitingBox: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 14,
    padding: 15,
    marginTop: 10,
  },

  waitingTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },

  waitingText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },


  /*
   * CHAT
   */

  chatCard: {
    marginBottom: 20,
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  chatSubtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 4,
  },

  messagesContainer: {
    minHeight: 100,
    maxHeight: 300,
    marginTop: 15,
    marginBottom: 12,
  },

  emptyChat: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },

  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },

  messageAvatarText: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },

  messageContent: {
    marginLeft: 9,
    flex: 1,
  },

  messageAuthor: {
    color: colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },

  messageText: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  chatInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
  },

  disabledInput: {
    opacity: 0.5,
  },

  sendButton: {
    minHeight: 48,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  disabledSendButton: {
    opacity: 0.4,
  },

  sendButtonText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },


  /*
   * LOADING
   */

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  errorTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 20,
  },

});