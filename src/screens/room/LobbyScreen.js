
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import Avatar from '../../components/Avatar';

import colors from '../../theme/colors';

import {
  getRoom,
  leaveRoom,
} from '../../api/roomApi';

import {
  startGame,
} from '../../api/deceptionApi';

import {
  getApiErrorMessage,
} from '../../api/apiUtils';

import {
  useAuth,
} from '../../context/AuthContext';

export default function LobbyScreen({
  navigation,
  route,
}) {

  const roomCode = route?.params?.roomCode;

  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  /*
   * Fetch current room state.
   */
  const loadRoom = useCallback(async () => {

    if (!roomCode) {
      return;
    }

    try {

      const data = await getRoom(roomCode);

      setRoom(data);

    } catch (error) {

      console.error(
        'Failed to load room:',
        error
      );

      /*
       * If the room disappears, return to GameHub.
       */
      if (error?.response?.status === 404) {

        Alert.alert(
          'Room Closed',
          'This room is no longer available.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.replace('Home'),
            },
          ]
        );

      }

    } finally {

      setLoading(false);

    }
  }, [roomCode, navigation]);

  /*
   * Initial room load + polling.
   *
   * Later WebSocket events will replace this.
   */
  useEffect(() => {

    loadRoom();

    const interval = setInterval(
      loadRoom,
      2000
    );

    return () => {
      clearInterval(interval);
    };

  }, [loadRoom]);

  /*
   * Determine host using backend data.
   */
  const isHost =
    !!user?.username &&
    room?.hostUsername === user.username;

  /*
   * Leave the room.
   */
  const handleLeaveRoom = async () => {

    if (!room?.roomCode) {
      navigation.replace('Home');
      return;
    }

    try {

      setLeaving(true);

      await leaveRoom(room.roomCode);

      navigation.replace('Home');

    } catch (error) {

      console.error(
        'Leave room failed:',
        error
      );

      Alert.alert(
        'Could Not Leave',
        getApiErrorMessage(
          error,
          'Unable to leave the room.'
        )
      );

    } finally {

      setLeaving(false);

    }
  };

  /*
   * Start Deception Around Us.
   *
   * Backend currently accepts selected roles.
   *
   * Beta default:
   * Doctor + Detective enabled.
   */
  const handleStartGame = async () => {

    if (!isHost) {
      return;
    }

    if (!room) {
      return;
    }

    if (room.playerCount < 4) {

      Alert.alert(
        'Not Enough Players',
        'At least 4 players are required to start the game.'
      );

      return;
    }

    try {

      setStarting(true);

      const data = await startGame(
        room.roomCode,
        [
          'DOCTOR',
          'DETECTIVE',
        ]
      );

      /*
       * startGame should return the GameSession data.
       */
      const sessionId =
        data?.sessionId ||
        data?.id;

      if (!sessionId) {

        throw new Error(
          'Game started but no session ID was returned.'
        );

      }

      navigation.replace('Night', {
        sessionId,
        roundNumber: data?.roundNumber || 1,
        role: data?.yourRole || null,
      });

    } catch (error) {

      console.error(
        'Start game failed:',
        error
      );

      Alert.alert(
        'Could Not Start Game',
        getApiErrorMessage(
          error,
          'Unable to start the game.'
        )
      );

    } finally {

      setStarting(false);

    }
  };

  if (loading && !room) {

    return (
      <Screen>

        <View style={styles.loadingContainer}>

          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading lobby...
          </Text>

        </View>

      </Screen>
    );
  }

  if (!room) {

    return (
      <Screen>

        <View style={styles.loadingContainer}>

          <Text style={styles.errorTitle}>
            Lobby unavailable
          </Text>

          <GlassButton
            title="BACK TO GAMEHUB"
            onPress={() =>
              navigation.replace('Home')
            }
          />

        </View>

      </Screen>
    );
  }

  const players = room.players || [];

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
      >

        {/* HEADER */}
        <View style={styles.header}>

          <Text style={styles.eyebrow}>
            GAME LOBBY
          </Text>

          <Text style={styles.title}>
            {room.gameName}
          </Text>

          <Text style={styles.subtitle}>
            Waiting for players to join.
          </Text>

        </View>

        {/* ROOM CODE */}
        <GlassCard style={styles.codeCard}>

          <Text style={styles.codeLabel}>
            ROOM CODE
          </Text>

          <Text style={styles.roomCode}>
            {room.roomCode}
          </Text>

          <Text style={styles.codeHint}>
            Share this code with your friends.
          </Text>

        </GlassCard>

        {/* PLAYER COUNT */}
        <View style={styles.countRow}>

          <Text style={styles.sectionTitle}>
            Players
          </Text>

          <Text style={styles.count}>
            {room.playerCount} / {room.maxPlayers}
          </Text>

        </View>

        {/* PLAYERS */}
        <GlassCard style={styles.playersCard}>

          {players.map((player) => {

            const isCurrentUser =
              player.username === user?.username;

            const isPlayerHost =
              player.username === room.hostUsername;

            return (
              <View
                key={player.username}
                style={styles.playerRow}
              >

                <Avatar
                  uri={null}
                  name={player.username}
                  size={44}
                />

                <View style={styles.playerInfo}>

                  <Text style={styles.playerName}>
                    {isCurrentUser
                      ? `${player.username} (You)`
                      : player.username}
                  </Text>

                  {isPlayerHost && (
                    <Text style={styles.hostBadge}>
                      HOST
                    </Text>
                  )}

                </View>

                <View style={styles.readyDot} />

              </View>
            );

          })}

          {/* EMPTY SLOTS */}
          {Array.from({
            length: Math.max(
              0,
              room.maxPlayers - players.length
            ),
          }).map((_, index) => (

            <View
              key={`empty-${index}`}
              style={[
                styles.playerRow,
                styles.emptyRow,
              ]}
            >

              <View style={styles.emptyAvatar}>
                <Text style={styles.emptyAvatarText}>
                  +
                </Text>
              </View>

              <Text style={styles.emptyText}>
                Waiting for player...
              </Text>

            </View>

          ))}

        </GlassCard>

        {/* HOST CONTROLS */}
        {isHost && (
          <GlassCard style={styles.hostCard}>

            <Text style={styles.hostTitle}>
              Host Controls
            </Text>

            <Text style={styles.hostDescription}>
              Start the game when at least 4 players
              are ready.
            </Text>

            <GlassButton
              title={
                starting
                  ? 'STARTING GAME...'
                  : 'START GAME'
              }
              onPress={handleStartGame}
              disabled={
                starting ||
                room.playerCount < 4
              }
            />

          </GlassCard>
        )}

        {/* NON-HOST MESSAGE */}
        {!isHost && (
          <GlassCard style={styles.waitCard}>

            <Text style={styles.waitTitle}>
              Waiting for host
            </Text>

            <Text style={styles.waitText}>
              The host will start the game when
              everyone is ready.
            </Text>

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
          onPress={handleLeaveRoom}
          disabled={leaving || starting}
        />

      </ScrollView>

    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,

    maxWidth: 700,

    width: '100%',

    alignSelf: 'center',
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    color: colors.primary,

    fontFamily: 'Inter-SemiBold',

    fontSize: 12,

    letterSpacing: 1.5,

    marginBottom: 8,
  },

  title: {
    color: colors.text,

    fontFamily: 'Inter-ExtraBold',

    fontSize: 28,
  },

  subtitle: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 14,

    marginTop: 6,
  },

  codeCard: {
    alignItems: 'center',

    paddingVertical: 24,

    marginBottom: 24,
  },

  codeLabel: {
    color: colors.textMuted,

    fontFamily: 'Inter-SemiBold',

    fontSize: 11,

    letterSpacing: 1.5,
  },

  roomCode: {
    color: colors.text,

    fontFamily: 'Inter-ExtraBold',

    fontSize: 34,

    letterSpacing: 6,

    marginTop: 8,
  },

  codeHint: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 12,

    marginTop: 8,
  },

  countRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 10,
  },

  sectionTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 18,
  },

  count: {
    color: colors.primary,

    fontFamily: 'Inter-SemiBold',

    fontSize: 14,
  },

  playersCard: {
    padding: 16,

    marginBottom: 20,
  },

  playerRow: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingVertical: 10,
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
    color: colors.primary,

    fontFamily: 'Inter-SemiBold',

    fontSize: 10,

    letterSpacing: 1,

    marginTop: 3,
  },

  readyDot: {
    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: colors.success,
  },

  emptyRow: {
    opacity: 0.45,
  },

  emptyAvatar: {
    width: 44,

    height: 44,

    borderRadius: 22,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: 'center',

    justifyContent: 'center',
  },

  emptyAvatarText: {
    color: colors.textMuted,

    fontFamily: 'Inter-Bold',

    fontSize: 18,
  },

  emptyText: {
    color: colors.textMuted,

    fontFamily: 'Inter',

    fontSize: 13,

    marginLeft: 12,
  },

  hostCard: {
    marginBottom: 20,
  },

  hostTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 18,
  },

  hostDescription: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 13,

    lineHeight: 20,

    marginTop: 6,

    marginBottom: 18,
  },

  waitCard: {
    marginBottom: 20,
  },

  waitTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 17,
  },

  waitText: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 13,

    lineHeight: 20,

    marginTop: 6,
  },

  loadingContainer: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    paddingHorizontal: 24,
  },

  loadingText: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 14,

    marginTop: 12,
  },

  errorTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 20,

    marginBottom: 20,
  },

});

