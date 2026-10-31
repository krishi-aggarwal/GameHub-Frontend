
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import Avatar from '../../components/Avatar';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

import {
  getRoom,
  leaveRoom,
} from '../../api/roomApi';

import {
  getFishpondState,
  getActiveSession,
  startFishpond,
  startGame,
} from '../../api/deceptionApi';

import {
  connectToRoom,
  disconnectFromRoom,
} from '../../api/gameSocket';

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
import { playSfx } from '../../utils/soundEffects';
import PartyDeciderModal from '../../components/PartyDeciderModal';


export default function LobbyScreen({
  navigation,
  route,
}) {

  const roomCode =
    route?.params?.roomCode;

  const {
    user,
    token,
    logout,
    setActiveRoomCode,
  } = useAuth();

  const {
    enterGame,
  } = useGame();
  const { showToast } = useToast();


  const [room, setRoom] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [leaving, setLeaving] =
    useState(false);

  const [deciderVisible, setDeciderVisible] = useState(false);
  const [enteringGame, setEnteringGame] =
    useState(false);

  /*
   * Optional roles selected by host.
   *
   * Predator and Innocent are automatic.
   */
  const [selectedRoles, setSelectedRoles] =
    useState([]);


  /*
   * Prevent multiple game-entry attempts.
   */
  const gameStartingRef =
    useRef(false);

  /*
   * Prevent handling GAME_STARTED
   * more than once.
   */
  const gameStartedRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  /*
   * WebSocket needs access to the
   * latest handleGameStarted function.
   */
  const handleGameStartedRef =
    useRef(null);


  /*
   * ==============================
   * MOUNT / UNMOUNT
   * ==============================
   */

  useEffect(() => {

    mountedRef.current = true;

    return () => {

      mountedRef.current = false;

      disconnectFromRoom();

    };

  }, []);


  /*
   * ==============================
   * LOAD ROOM
   * ==============================
   */

  const loadRoom =
    useCallback(async () => {

      if (!roomCode) {
        return;
      }

      try {

        const data =
          await getRoom(roomCode);

        if (!mountedRef.current) {
          return;
        }

        setRoom(data);

        if (data?.roomStatus === 'CANCELLED') {
          await setActiveRoomCode(null);
          showToast('This room was cancelled.');
          navigation.replace('Home');
          return;
        }

        if (
          ['IN_PROGRESS', 'FINISHED'].includes(data?.roomStatus) &&
          !gameStartedRef.current
        ) {
          try {
            if (data.gameSlug === 'fishpond') {
              await getFishpondState(roomCode);
              await handleGameStartedRef.current?.('fishpond');
              return;
            }

            const activeSession =
              await getActiveSession(roomCode);

            await handleGameStartedRef.current?.(
              activeSession?.sessionId
            );
          } catch (sessionError) {
            if (
              sessionError?.response?.status === 404 &&
              mountedRef.current
            ) {
              await setActiveRoomCode(null);
              showToast('This game session is no longer available.');
              navigation.replace('Home');
              return;
            }

            console.error(
              'Failed to recover active game session:',
              sessionError
            );
          }
        }

      } catch (error) {

        console.error(
          'Failed to load room:',
          error
        );

        if (
          error?.response?.status === 401 &&
          mountedRef.current
        ) {
          await logout();
          showToast('Your session expired. Please sign in again.');
          navigation.replace('Login');
          return;
        }

        if (
          error?.response?.status === 404 &&
          mountedRef.current
        ) {

          await setActiveRoomCode(null);

          showToast('This room is no longer available.');
          navigation.replace('Home');

        }

      } finally {

        if (mountedRef.current) {
          setLoading(false);
        }

      }

    }, [
      roomCode,
      navigation,
      logout,
      setActiveRoomCode,
      showToast,
    ]);


  /*
   * ==============================
   * ENTER GAME
   * ==============================
   *
   * This is the SINGLE place that
   * handles entering a started game.
   *
   * It can be triggered by:
   *
   * 1. Host starting through REST
   * 2. GAME_STARTED WebSocket event
   *
   * IMPORTANT:
   * gameStartedRef is set HERE,
   * not inside handleStartGame().
   */

  const handleGameStarted =
    useCallback(
      async (sessionId) => {

        if (!sessionId) {

          console.error(
            'GAME_STARTED event has no sessionId.'
          );

          return;

        }


        /*
         * Already entered / entering.
         */
        if (gameStartedRef.current) {

          console.log(
            'GAME_STARTED already handled.'
          );

          return;

        }


        /*
         * Prevent two simultaneous
         * entry attempts.
         */
        if (gameStartingRef.current) {

          console.log(
            'Game entry already in progress.'
          );

          return;

        }


        /*
         * Mark immediately before
         * doing async work.
         */
        gameStartingRef.current =
          true;

        gameStartedRef.current =
          true;


        try {

          if (mountedRef.current) {

            setEnteringGame(true);

          }


          console.log(
            'Entering game. Session:',
            sessionId
          );


          /*
           * Lobby WebSocket is no longer
           * needed after the game starts.
           */
          disconnectFromRoom();

          if (sessionId === 'fishpond' || room?.gameSlug === 'fishpond') {
            navigation.replace('Fishpond', {
              roomCode: room.roomCode,
            });
            return;
          }


          /*
           * Store the active game session
           * inside GameContext.
           */
          await enterGame(
            sessionId
          );


          if (!mountedRef.current) {
            return;
          }


          console.log(
            'Game session entered successfully.'
          );


          /*
           * Move from Lobby -> Night.
           */
          navigation.replace(
            'Night'
          );


        } catch (error) {

          console.error(
            'Failed to enter game:',
            error
          );


          /*
           * Allow retry if entering
           * the game failed.
           */
          gameStartingRef.current =
            false;

          gameStartedRef.current =
            false;


          if (mountedRef.current) {

            setEnteringGame(false);

            showToast(
              getApiErrorMessage(error, 'Unable to enter the game.')
            );

          }

        }

      },
      [
        enterGame,
        navigation,
        room,
      ]
    );


  /*
   * Keep WebSocket callback synced
   * with the latest callback.
   */

  useEffect(() => {

    handleGameStartedRef.current =
      handleGameStarted;

  }, [
    handleGameStarted,
  ]);


  /*
   * ==============================
   * ROOM WEBSOCKET
   * ==============================
   */

  useEffect(() => {

    if (
      !roomCode ||
      !token ||
      !mountedRef.current
    ) {
      return;
    }


    console.log(
      'Connecting lobby WebSocket for room:',
      roomCode
    );


    connectToRoom(
      roomCode,

      async (event) => {

        console.log(
          'Lobby received event:',
          event
        );

        if (
          event?.type === 'PLAYER_JOINED' ||
          event?.type === 'PLAYER_LEFT'
        ) {
          if (event.room) {
            setRoom(event.room);
          }
          return;
        }

        if (event?.type === 'ROOM_CLOSED') {
          await setActiveRoomCode(null);
          showToast('The room was closed.');
          navigation.replace('Home');
          return;
        }


        if (
          event?.type !==
            'GAME_STARTED' &&
          event?.type !== 'FISHPOND_STARTED'
        ) {

          return;

        }


        const sessionId = event?.type === 'FISHPOND_STARTED'
          ? 'fishpond'
          : event?.sessionId;


        if (!sessionId) {

          console.error(
            'GAME_STARTED received without sessionId:',
            event
          );

          return;

        }


        console.log(
          'GAME_STARTED detected. Session:',
          sessionId
        );


        await handleGameStartedRef.current?.(
          sessionId
        );

      },

      token
    );


    return () => {

      console.log(
        'Disconnecting lobby WebSocket.'
      );

      disconnectFromRoom();

    };

  }, [
    roomCode,
    token,
      navigation,
      setActiveRoomCode,
      showToast,
  ]);


  /*
   * ==============================
   * ROOM POLLING
   * ==============================
   */

  useEffect(() => {

    loadRoom();

    const interval =
      setInterval(
        loadRoom,
        2000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, [
    loadRoom,
  ]);


  /*
   * ==============================
   * HOST
   * ==============================
   */

  const isHost =
    !!user?.username &&
    room?.hostUsername ===
      user.username;


  /*
   * ==============================
   * ROLE SELECTION
   * ==============================
   */

  const toggleRole =
    (role) => {

      if (
        !isHost ||
        starting ||
        enteringGame
      ) {

        return;

      }


      setSelectedRoles(
        (previous) => {

          if (
            previous.includes(role)
          ) {

            return previous.filter(
              (item) =>
                item !== role
            );

          }


          return [
            ...previous,
            role,
          ];

        }
      );

    };


  const isRoleSelected =
    (role) =>
      selectedRoles.includes(
        role
      );

  const copyRoomCode = async () => {
    try {
      playSfx('coin');
      await Clipboard.setStringAsync(room.roomCode);
      showToast('Room code copied to clipboard.');
    } catch (error) {
      console.error('Failed to copy room code:', error);
      showToast('Unable to copy the room code. Please copy it manually.');
    }
  };


  /*
   * ==============================
   * START GAME
   * ==============================
   *
   * HOST FLOW:
   *
   * Button
   *   ↓
   * POST /start
   *   ↓
   * sessionId
   *   ↓
   * handleGameStarted()
   *   ↓
   * enterGame()
   *   ↓
   * Night
   *
   * IMPORTANT:
   * Do NOT set gameStartedRef here.
   */

  const handleStartGame =
    async () => {

      if (
        !isHost ||
        !room ||
        starting ||
        enteringGame
      ) {

        return;

      }


      if (gameStartedRef.current) {

        return;

      }


      if (
        room.playerCount < (room.gameSlug === 'fishpond' ? 3 : 4)
      ) {

        showToast(
          room.gameSlug === 'fishpond'
            ? 'Fishpond needs at least 3 players.'
            : 'Deception needs at least 4 players.'
        );

        return;

      }


      try {

        setStarting(true);


        console.log(
          'Starting game with roles:',
          selectedRoles
        );


        /*
         * Start game through REST.
         */
        const data = room.gameSlug === 'fishpond'
          ? await startFishpond(room.roomCode)
          : await startGame(room.roomCode, selectedRoles);


        const sessionId = room.gameSlug === 'fishpond'
          ? 'fishpond'
          : data?.sessionId;


        if (!sessionId) {

          throw new Error(
            'Game started but no session ID was returned.'
          );

        }


        console.log(
          'Game started successfully. Session:',
          sessionId
        );


        /*
         * DO NOT DO THIS HERE:
         *
         * gameStartedRef.current = true;
         *
         * handleGameStarted() is responsible
         * for setting it.
         */


        /*
         * Enter the game directly.
         *
         * This is necessary for the host because
         * the REST request already gives us the
         * session ID.
         */
        await handleGameStarted(
          sessionId
        );


      } catch (error) {

        console.error(
          'Start game failed:',
          error
        );


        gameStartingRef.current =
          false;

        gameStartedRef.current =
          false;


        if (mountedRef.current) {

          setEnteringGame(false);

          showToast(
            getApiErrorMessage(error, 'Unable to start the game.')
          );

        }

      } finally {

        if (mountedRef.current) {

          setStarting(false);

        }

      }

    };


  /*
   * ==============================
   * LEAVE ROOM
   * ==============================
   */

  const handleLeaveRoom =
    async () => {

      if (!room?.roomCode) {

        navigation.replace(
          'Home'
        );

        return;

      }


      try {

        setLeaving(true);


        await leaveRoom(
          room.roomCode
        );

        await setActiveRoomCode(null);


        disconnectFromRoom();


        navigation.replace(
          'Home'
        );


      } catch (error) {

        console.error(
          'Leave room failed:',
          error
        );


        showToast(
          getApiErrorMessage(error, 'Unable to leave the room.')
        );


      } finally {

        setLeaving(false);

      }

    };


  /*
   * ==============================
   * LOADING
   * ==============================
   */

  if (
    loading &&
    !room
  ) {

    return (
      <Screen>

        <View
          style={
            styles.loadingContainer
          }
        >

          <View
            style={styles.loadingOrb}
          >

            <ActivityIndicator
              size="small"
              color={colors.primary}
            />

          </View>


          <Text
            style={
              styles.loadingText
            }
          >
            Loading lobby...
          </Text>

        </View>

        </Screen>
    );

  }


  /*
   * ==============================
   * ROOM UNAVAILABLE
   * ==============================
   */

  if (!room) {

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
            Lobby unavailable
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
   * ==============================
   * PLAYER DATA
   * ==============================
   */

  const players =
    Array.isArray(room.players)
      ? room.players
      : [];


  const playerCount =
    players.length;


  const maxPlayers =
    room.maxPlayers || 15;


  const minimumPlayers =
    room.gameSlug === 'fishpond' ? 3 : 4;


  const canStart =
    isHost &&
    playerCount >=
      minimumPlayers &&
    !starting &&
    !enteringGame &&
    !gameStartedRef.current;


  /*
   * ==============================
   * UI
   * ==============================
   */

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

        {/* TOP BAR */}

        <View
          style={styles.topBar}
        >

          <Pressable
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
            disabled={
              starting ||
              enteringGame ||
              leaving
            }
          >

            <Text
              style={styles.backArrow}
            >
              ‹
            </Text>


            <Text
              style={styles.backText}
            >
              BACK
            </Text>

          </Pressable>


          <View
            style={styles.liveBadge}
          >

            <View
              style={styles.liveDot}
            />


            <Text
              style={styles.liveText}
            >
              LIVE LOBBY
            </Text>

          </View>

        </View>


        {/* HEADER */}

        <View
          style={styles.header}
        >

          <Text
            style={styles.eyebrow}
          >
            GAMEHUB
          </Text>


          <Text
            style={styles.title}
          >
            {room.gameName}
          </Text>


          <Text
            style={styles.subtitle}
          >
            Gather your players and get ready.
          </Text>

        </View>


        {/* ROOM CODE */}

        <GlassCard
          style={styles.codeCard}
        >

          <View
            style={styles.codeHeader}
          >

            <Text
              style={styles.codeLabel}
            >
              ROOM CODE
            </Text>


            <Text
              style={styles.codeStatus}
            >
              INVITE FRIENDS
            </Text>

          </View>


          <Text
            style={styles.roomCode}
          >
            {room.roomCode}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy room code"
            style={styles.copyCodeButton}
            onPress={copyRoomCode}
          >
            <Text style={styles.copyCodeText}>
              COPY CODE
            </Text>
          </Pressable>

          <Text
            style={styles.codeHint}
          >
            Share this code with your friends to join.
          </Text>

        </GlassCard>


        {/* PLAYERS HEADER */}

        <View
          style={styles.sectionHeader}
        >

          <View>

            <View
              style={styles.sectionTitleRow}
            >

              <Text
                style={styles.sectionTitle}
              >
                Players
              </Text>


              <View
                style={styles.onlineBadge}
              >

                <View
                  style={styles.onlineDot}
                />


                <Text
                  style={styles.onlineText}
                >
                  ONLINE
                </Text>

              </View>

            </View>


            <Text
              style={styles.sectionSubtitle}
            >
              {playerCount <
              minimumPlayers
                ? `Need ${
                    minimumPlayers -
                    playerCount
                  } more to start`
                : 'Minimum players reached'}
            </Text>

          </View>


          <View
            style={styles.countBadge}
          >

            <Text
              style={styles.count}
            >
              {playerCount}
            </Text>


            <Text
              style={styles.countMax}
            >
              / {maxPlayers}
            </Text>

          </View>

        </View>


        {/* PLAYERS */}

        <GlassCard
          style={styles.playersCard}
        >

          {players.length === 0 ? (

            <View
              style={styles.emptyState}
            >

              <View
                style={styles.emptyIcon}
              >

                <Text
                  style={styles.emptyIconText}
                >
                  +
                </Text>

              </View>


              <Text
                style={styles.emptyTitle}
              >
                Waiting for players
              </Text>


              <Text
                style={styles.emptyText}
              >
                Share the room code to invite players.
              </Text>

            </View>

          ) : (

            players.map(
              (player, index) => {

                const isCurrentUser =
                  player.username ===
                  user?.username;


                const isPlayerHost =
                  player.username ===
                  room.hostUsername;


                return (
                  <View
                    key={
                      player.username ||
                      index
                    }
                    style={[
                      styles.playerRow,

                      index <
                        players.length - 1 &&
                        styles.playerRowBorder,
                    ]}
                  >

                    <View
                      style={[
                        styles.avatarWrap,

                        isPlayerHost &&
                          styles.hostAvatarWrap,
                      ]}
                    >

                      <Avatar
                        uri={
                          player.avatarUrl ||
                          null
                        }
                        name={
                          player.username
                        }
                        size={44}
                      />


                      <View
                        style={
                          styles.playerOnlineDot
                        }
                      />

                    </View>


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
                        {isCurrentUser
                          ? `${player.username} (You)`
                          : player.username}
                      </Text>


                      {isPlayerHost && (

                        <View
                          style={
                            styles.hostBadge
                          }
                        >

                          <Text
                            style={
                              styles.hostBadgeText
                            }
                          >
                            HOST
                          </Text>

                        </View>

                      )}

                    </View>


                    <View
                      style={
                        styles.joinedIndicator
                      }
                    >

                      <View
                        style={
                          styles.readyDot
                        }
                      />


                      <Text
                        style={
                          styles.joinedText
                        }
                      >
                        READY
                      </Text>

                    </View>

                  </View>
                );

              }
            )

          )}

        </GlassCard>

        {/* PARTY LOUNGE TOOLS */}
        <GlassCard glow="cyan" style={styles.partyLoungeCard}>
          <View style={styles.loungeHeader}>
            <Text style={styles.loungeEmoji}>🕹️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.loungeTitle}>PARTY LOUNGE TOOLS</Text>
              <Text style={styles.loungeSubtitle}>Roll dice, toss a coin, or pick turns while waiting!</Text>
            </View>
          </View>
          <GlassButton
            title="PARTY TOOLS: TEAMS, BUZZER & TOSS 👥"
            variant="cyan"
            size="small"
            onPress={() => {
              playSfx('click');
              setDeciderVisible(true);
            }}
          />
        </GlassCard>

        {/* HOST CONTROLS */}

        {isHost && (

          <GlassCard
            style={styles.hostCard}
          >

            <View
              style={styles.hostHeader}
            >

              <View
                style={styles.hostHeaderContent}
              >

                <Text
                  style={
                    styles.hostTitle
                  }
                >
                  Host Controls
                </Text>


                <Text
                  style={
                    styles.hostSubtitle
                  }
                >
                  Configure the game before starting.
                </Text>

              </View>


              <View
                style={
                  styles.hostIndicator
                }
              >

                <Text
                  style={
                    styles.hostIndicatorText
                  }
                >
                  HOST
                </Text>

              </View>

            </View>


            {/* ROLE CONFIGURATION */}

            <View
              style={[
                styles.roleSection,
                room.gameSlug === 'fishpond' && styles.hidden,
              ]}
            >

              <Text
                style={
                  styles.roleSectionTitle
                }
              >
                ROLE CONFIGURATION
              </Text>


              <Text
                style={
                  styles.roleSectionSubtitle
                }
              >
                Choose optional roles for this game.
              </Text>


              {/* DOCTOR */}

              <Pressable
                onPress={() =>
                  toggleRole(
                    'DOCTOR'
                  )
                }
                disabled={
                  starting ||
                  enteringGame
                }
                style={[
                  styles.roleOption,

                  isRoleSelected(
                    'DOCTOR'
                  ) &&
                    styles.roleOptionSelected,

                  (starting ||
                    enteringGame) &&
                    styles.roleOptionDisabled,
                ]}
              >

                <View
                  style={[
                    styles.checkbox,

                    isRoleSelected(
                      'DOCTOR'
                    ) &&
                      styles.checkboxSelected,
                  ]}
                >

                  {isRoleSelected(
                    'DOCTOR'
                  ) && (

                    <Text
                      style={
                        styles.checkmark
                      }
                    >
                      ✓
                    </Text>

                  )}

                </View>


                <View
                  style={
                    styles.roleIconDoctor
                  }
                >

                  <Text
                    style={
                      styles.roleIconText
                    }
                  >
                    +
                  </Text>

                </View>


                <View
                  style={
                    styles.roleInfo
                  }
                >

                  <Text
                    style={
                      styles.roleName
                    }
                  >
                    Doctor
                  </Text>


                  <Text
                    style={
                      styles.roleDescription
                    }
                  >
                    Protect one player during the night.
                  </Text>

                </View>

              </Pressable>


              {/* DETECTIVE */}

              <Pressable
                onPress={() =>
                  toggleRole(
                    'DETECTIVE'
                  )
                }
                disabled={
                  starting ||
                  enteringGame
                }
                style={[
                  styles.roleOption,

                  isRoleSelected(
                    'DETECTIVE'
                  ) &&
                    styles.roleOptionSelected,

                  (starting ||
                    enteringGame) &&
                    styles.roleOptionDisabled,
                ]}
              >

                <View
                  style={[
                    styles.checkbox,

                    isRoleSelected(
                      'DETECTIVE'
                    ) &&
                      styles.checkboxSelected,
                  ]}
                >

                  {isRoleSelected(
                    'DETECTIVE'
                  ) && (

                    <Text
                      style={
                        styles.checkmark
                      }
                    >
                      ✓
                    </Text>

                  )}

                </View>


                <View
                  style={
                    styles.roleIconDetective
                  }
                >

                  <Text
                    style={
                      styles.roleIconText
                    }
                  >
                    ?
                  </Text>

                </View>


                <View
                  style={
                    styles.roleInfo
                  }
                >

                  <Text
                    style={
                      styles.roleName
                    }
                  >
                    Detective
                  </Text>


                  <Text
                    style={
                      styles.roleDescription
                    }
                  >
                    Investigate one player during the night.
                  </Text>

                </View>

              </Pressable>


              {/* AUTOMATIC ROLES */}

              <View
                style={
                  styles.automaticBox
                }
              >

                <View
                  style={styles.automaticHeader}
                >

                  <Text
                    style={
                      styles.automaticTitle
                    }
                  >
                    AUTOMATIC ROLES
                  </Text>


                  <Text
                    style={
                      styles.automaticBadge
                    }
                  >
                    SYSTEM
                  </Text>

                </View>


                <Text
                  style={
                    styles.automaticText
                  }
                >
                  Predator count is determined automatically
                  based on player count. Remaining players
                  become Innocents.
                </Text>

              </View>


              {/* SELECTED SUMMARY */}

              <View
                style={
                  styles.selectedBox
                }
              >

                <View>

                  <Text
                    style={
                      styles.selectedLabel
                    }
                  >
                    SELECTED ROLES
                  </Text>


                  <Text
                    style={
                      styles.selectedText
                    }
                  >
                    {selectedRoles.length === 0
                      ? 'No optional roles'
                      : selectedRoles
                          .map(
                            (role) =>
                              role ===
                              'DOCTOR'
                                ? 'Doctor'
                                : 'Detective'
                          )
                          .join(' + ')}
                  </Text>

                </View>


                <Text
                  style={
                    styles.selectedCount
                  }
                >
                  {selectedRoles.length}
                </Text>

              </View>

            </View>


            {/* HOST DESCRIPTION */}

            <Text
              style={
                styles.hostDescription
              }
            >
              {playerCount <
              minimumPlayers
                ? `Waiting for ${
                    minimumPlayers -
                    playerCount
                  } more player${
                    minimumPlayers -
                      playerCount ===
                    1
                      ? ''
                      : 's'
                  }.`
                : 'All required players are here. You can start the game.'}
            </Text>


            {/* START GAME */}

            <GlassButton
              title={
                starting ||
                enteringGame
                  ? 'STARTING GAME...'
                  : 'START GAME'
              }
              onPress={
                handleStartGame
              }
              disabled={!canStart}
            />

          </GlassCard>

        )}


        {/* NON-HOST WAITING */}

        {!isHost && (

          <GlassCard
            style={styles.waitCard}
          >

            <View
              style={
                styles.waitIndicator
              }
            >

              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

            </View>


            <View
              style={
                styles.waitContent
              }
            >

              <View
                style={styles.waitTitleRow}
              >

                <Text
                  style={
                    styles.waitTitle
                  }
                >
                  {enteringGame
                    ? 'Entering game...'
                    : 'Waiting for host'}
                </Text>


                <View
                  style={styles.waitPulse}
                />

              </View>


              <Text
                style={
                  styles.waitText
                }
              >
                {enteringGame
                  ? 'The game is starting. Get ready.'
                  : 'The host will configure the roles and start the game.'}
              </Text>

            </View>

          </GlassCard>

        )}


        {/* LEAVE */}

        <GlassButton
          title={
            leaving
              ? 'LEAVING...'
              : 'LEAVE ROOM'
          }
          variant="secondary"
          onPress={
            handleLeaveRoom
          }
          disabled={
            leaving ||
            starting ||
            enteringGame
          }
        />

      </ScrollView>

      <PartyDeciderModal visible={deciderVisible} onClose={() => setDeciderVisible(false)} />
    </Screen>
  );
}


const styles = StyleSheet.create({
  partyLoungeCard: {
    marginBottom: spacing.xl,
    padding: 16,
  },
  loungeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loungeEmoji: {
    fontSize: 24,
  },
  loungeTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  loungeSubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
  },


  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 48,

    maxWidth: 700,

    width: '100%',

    alignSelf: 'center',
  },


  /* TOP BAR */

  topBar: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: spacing.xl,
  },


  backButton: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingVertical: 8,

    paddingRight: 12,
  },


  backArrow: {
    color: colors.text,

    fontFamily: 'Inter',

    fontSize: 28,

    lineHeight: 28,

    marginRight: 6,
  },


  backText: {
    color: colors.textSecondary,

    fontFamily: 'Inter-Bold',

    fontSize: 9,

    letterSpacing: 1.2,
  },


  liveBadge: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: 10,

    backgroundColor:
      'rgba(34, 197, 94, 0.08)',

    borderWidth: 1,

    borderColor:
      'rgba(34, 197, 94, 0.20)',
  },


  liveDot: {
    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: colors.success,

    marginRight: 6,
  },


  liveText: {
    color: colors.success,

    fontFamily: 'Inter-Bold',

    fontSize: 8,

    letterSpacing: 0.9,
  },


  /* HEADER */

  header: {
    marginBottom: spacing.xl,
  },


  eyebrow: {
    color: colors.primary,

    fontFamily: 'Inter-Bold',

    fontSize: 10,

    letterSpacing: 2,

    marginBottom: 6,
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

    marginTop: 7,
  },


  /* ROOM CODE */

  codeCard: {
    alignItems: 'center',

    paddingVertical: spacing.xl,

    marginBottom: spacing.xxl,

    borderColor:
      'rgba(139, 92, 246, 0.22)',
  },


  codeHeader: {
    width: '100%',

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    paddingHorizontal: spacing.md,
  },


  codeLabel: {
    color: colors.textMuted,

    fontFamily: 'Inter-Bold',

    fontSize: 9,

    letterSpacing: 1.8,
  },


  codeStatus: {
    color: colors.primary,

    fontFamily: 'Inter-Bold',

    fontSize: 8,

    letterSpacing: 1,
  },


  roomCode: {
    color: colors.text,

    fontFamily: 'Inter-ExtraBold',

    fontSize: 38,

    letterSpacing: 7,

    marginTop: 9,
  },

  copyCodeButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },

  copyCodeText: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
  },


  codeHint: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 11,

    marginTop: 8,
  },


  /* SECTION */

  sectionHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: spacing.md,
  },


  sectionTitleRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },


  sectionTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 19,
  },


  onlineBadge: {
    flexDirection: 'row',

    alignItems: 'center',

    marginLeft: 9,

    paddingHorizontal: 7,

    paddingVertical: 4,

    borderRadius: 7,

    backgroundColor:
      'rgba(34, 197, 94, 0.07)',
  },


  onlineDot: {
    width: 5,

    height: 5,

    borderRadius: 3,

    backgroundColor: colors.success,

    marginRight: 4,
  },


  onlineText: {
    color: colors.success,

    fontFamily: 'Inter-Bold',

    fontSize: 7,

    letterSpacing: 0.7,
  },


  sectionSubtitle: {
    color: colors.textMuted,

    fontFamily: 'Inter',

    fontSize: 11,

    marginTop: 4,
  },


  countBadge: {
    flexDirection: 'row',

    alignItems: 'baseline',

    paddingHorizontal: 13,

    paddingVertical: 8,

    borderRadius: 12,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },


  count: {
    color: colors.primary,

    fontFamily: 'Inter-Bold',

    fontSize: 17,
  },


  countMax: {
    color: colors.textMuted,

    fontFamily: 'Inter-Medium',

    fontSize: 13,
  },


  /* PLAYERS */

  playersCard: {
    paddingHorizontal: 16,

    paddingVertical: 6,

    marginBottom: spacing.lg,
  },


  playerRow: {
    flexDirection: 'row',

    alignItems: 'center',

    minHeight: 68,
  },


  playerRowBorder: {
    borderBottomWidth: 1,

    borderBottomColor: colors.border,
  },


  avatarWrap: {
    position: 'relative',

    borderRadius: 23,
  },


  hostAvatarWrap: {
    borderWidth: 1,

    borderColor:
      'rgba(139, 92, 246, 0.55)',

    padding: 2,
  },


  playerOnlineDot: {
    position: 'absolute',

    right: 0,

    bottom: 1,

    width: 9,

    height: 9,

    borderRadius: 5,

    backgroundColor: colors.success,

    borderWidth: 2,

    borderColor: colors.surface,
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


  hostBadge: {
    alignSelf: 'flex-start',

    marginTop: 4,

    paddingHorizontal: 6,

    paddingVertical: 2,

    borderRadius: 5,

    backgroundColor:
      'rgba(139, 92, 246, 0.12)',
  },


  hostBadgeText: {
    color: colors.primary,

    fontFamily: 'Inter-Bold',

    fontSize: 7,

    letterSpacing: 0.9,
  },


  joinedIndicator: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 7,

    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor:
      'rgba(34, 197, 94, 0.06)',
  },


  readyDot: {
    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: colors.success,

    marginRight: 5,
  },


  joinedText: {
    color: colors.textMuted,

    fontFamily: 'Inter-Bold',

    fontSize: 7,

    letterSpacing: 0.8,
  },


  /* EMPTY */

  emptyState: {
    alignItems: 'center',

    paddingVertical: 30,
  },


  emptyIcon: {
    width: 46,

    height: 46,

    borderRadius: 14,

    backgroundColor: colors.surfaceStrong,

    borderWidth: 1,

    borderColor: colors.border,

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 10,
  },


  emptyIconText: {
    color: colors.primary,

    fontFamily: 'Inter-Bold',

    fontSize: 22,
  },


  emptyTitle: {
    color: colors.text,

    fontFamily: 'Inter-SemiBold',

    fontSize: 15,
  },


  emptyText: {
    color: colors.textMuted,

    fontFamily: 'Inter',

    fontSize: 11,

    marginTop: 6,

    textAlign: 'center',
  },


  /* HOST */

  hostCard: {
    marginBottom: spacing.lg,

    borderColor:
      'rgba(139, 92, 246, 0.20)',
  },


  hostHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },


  hostHeaderContent: {
    flex: 1,
  },


  hostTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 18,
  },


  hostSubtitle: {
    color: colors.textMuted,

    fontFamily: 'Inter',

    fontSize: 11,

    marginTop: 4,
  },


  hostIndicator: {
    paddingHorizontal: 9,

    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor:
      'rgba(139, 92, 246, 0.10)',

    borderWidth: 1,

    borderColor:
      'rgba(139, 92, 246, 0.22)',
  },


  hostIndicatorText: {
    color: colors.primary,

    fontFamily: 'Inter-Bold',

    fontSize: 8,

    letterSpacing: 1,
  },


  /* ROLE CONFIGURATION */

  roleSection: {
    marginTop: 24,
  },

  hidden: {
    display: 'none',
  },


  roleSectionTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 10,

    letterSpacing: 1.5,
  },


  roleSectionSubtitle: {
    color: colors.textMuted,

    fontFamily: 'Inter',

    fontSize: 11,

    marginTop: 5,

    marginBottom: 12,
  },


  roleOption: {
    flexDirection: 'row',

    alignItems: 'center',

    padding: 13,

    borderRadius: 14,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    marginBottom: 10,
  },


  roleOptionSelected: {
    borderColor:
      'rgba(139, 92, 246, 0.65)',

    backgroundColor:
      'rgba(139, 92, 246, 0.09)',
  },


  roleOptionDisabled: {
    opacity: 0.5,
  },


  checkbox: {
    width: 23,

    height: 23,

    borderRadius: 7,

    borderWidth: 1,

    borderColor: colors.borderStrong,

    justifyContent: 'center',

    alignItems: 'center',
  },


  checkboxSelected: {
    backgroundColor: colors.primary,

    borderColor: colors.primary,
  },


  checkmark: {
    color: colors.white,

    fontFamily: 'Inter-Bold',

    fontSize: 14,
  },


  roleIconDoctor: {
    width: 30,

    height: 30,

    borderRadius: 9,

    backgroundColor:
      'rgba(34, 197, 94, 0.10)',

    justifyContent: 'center',

    alignItems: 'center',

    marginLeft: 10,
  },


  roleIconDetective: {
    width: 30,

    height: 30,

    borderRadius: 9,

    backgroundColor:
      'rgba(59, 130, 246, 0.10)',

    justifyContent: 'center',

    alignItems: 'center',

    marginLeft: 10,
  },


  roleIconText: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 14,
  },


  roleInfo: {
    flex: 1,

    marginLeft: 10,
  },


  roleName: {
    color: colors.text,

    fontFamily: 'Inter-SemiBold',

    fontSize: 14,
  },


  roleDescription: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 10,

    lineHeight: 15,

    marginTop: 3,
  },


  /* AUTOMATIC */

  automaticBox: {
    marginTop: 4,

    padding: 13,

    borderRadius: 12,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },


  automaticHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },


  automaticTitle: {
    color: colors.textMuted,

    fontFamily: 'Inter-Bold',

    fontSize: 8,

    letterSpacing: 1.2,
  },


  automaticBadge: {
    color: colors.textMuted,

    fontFamily: 'Inter-Bold',

    fontSize: 7,

    letterSpacing: 0.8,
  },


  automaticText: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 10,

    lineHeight: 16,

    marginTop: 5,
  },


  /* SELECTED */

  selectedBox: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: 10,

    paddingHorizontal: 13,

    paddingVertical: 11,

    borderRadius: 12,

    backgroundColor: colors.surfaceStrong,

    borderWidth: 1,

    borderColor: colors.border,
  },


  selectedLabel: {
    color: colors.textMuted,

    fontFamily: 'Inter-Bold',

    fontSize: 8,

    letterSpacing: 1.2,
  },


  selectedText: {
    color: colors.text,

    fontFamily: 'Inter-SemiBold',

    fontSize: 12,

    marginTop: 4,
  },


  selectedCount: {
    color: colors.primary,

    fontFamily: 'Inter-Bold',

    fontSize: 16,
  },


  hostDescription: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 12,

    lineHeight: 19,

    marginTop: 18,

    marginBottom: 18,
  },


  /* WAITING */

  waitCard: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: spacing.lg,

    borderColor:
      'rgba(139, 92, 246, 0.16)',
  },


  waitIndicator: {
    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor:
      'rgba(139, 92, 246, 0.10)',

    justifyContent: 'center',

    alignItems: 'center',
  },


  waitContent: {
    flex: 1,

    marginLeft: 12,
  },


  waitTitleRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },


  waitTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 15,
  },


  waitPulse: {
    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: colors.primary,

    marginLeft: 7,
  },


  waitText: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 11,

    lineHeight: 17,

    marginTop: 4,
  },


  /* LOADING */

  loadingContainer: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    paddingHorizontal: 24,
  },


  loadingOrb: {
    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor:
      'rgba(139, 92, 246, 0.10)',

    justifyContent: 'center',

    alignItems: 'center',
  },


  loadingText: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 13,

    marginTop: 12,
  },


  errorTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 20,

    marginBottom: 20,
  },

});
