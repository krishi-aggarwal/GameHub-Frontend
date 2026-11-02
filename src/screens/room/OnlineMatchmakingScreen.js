import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getGames } from '../../api/gameApi';
import { getApiErrorMessage } from '../../api/apiUtils';
import { getAllRooms, joinRoom } from '../../api/roomApi';
import GlassButton from '../../components/GlassButton';
import GlassCard from '../../components/GlassCard';
import Screen from '../../components/Screen';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supportsPassAndPlay } from '../../utils/gameCatalog';

export default function OnlineMatchmakingScreen({ navigation, route }) {
  const [games, setGames] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedGame, setSelectedGame] = useState(route?.params?.game || null);
  const [loading, setLoading] = useState(true);
  const [joiningCode, setJoiningCode] = useState(null);
  const [error, setError] = useState(false);
  const { setActiveRoomCode } = useAuth();
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    try {
      setError(false);
      const [gameResponse, roomResponse] = await Promise.all([getGames(), getAllRooms()]);
      const gameList = Array.isArray(gameResponse) ? gameResponse : gameResponse?.data || [];
      const roomList = Array.isArray(roomResponse) ? roomResponse : roomResponse?.data || [];
      setGames(gameList.filter((game) => game.status === 'ACTIVE'));
      setRooms(roomList.filter((room) => (
        room.roomStatus === 'WAITING' && room.playerCount < room.maxPlayers
      )));
    } catch (requestError) {
      console.error('Failed to search online rooms:', requestError);
      setError(true);
      showToast(getApiErrorMessage(requestError, 'Could not search public rooms.'));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  const availableRooms = useMemo(() => (
    selectedGame
      ? rooms.filter((room) => (
        String(room.gameId) === String(selectedGame.gameId)
        || room.gameSlug === selectedGame.slug
      ))
      : rooms
  ), [rooms, selectedGame]);

  async function handleJoin(room) {
    try {
      setJoiningCode(room.roomCode);
      const joinedRoom = await joinRoom(room.roomCode);
      if (!joinedRoom?.roomCode) throw new Error('Room details were not returned.');
      await setActiveRoomCode(joinedRoom.roomCode);
      navigation.replace('Lobby', { roomCode: joinedRoom.roomCode });
    } catch (joinError) {
      showToast(getApiErrorMessage(joinError, 'This room may have filled. Refresh and try another.'));
      await refresh();
    } finally {
      setJoiningCode(null);
    }
  }

  function handleCreate() {
    if (!selectedGame) {
      showToast('Choose a game before creating a room.');
      return;
    }
    navigation.navigate('CreateRoom', {
      gameId: selectedGame.gameId,
      gameName: selectedGame.name,
    });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>ONLINE MATCHMAKING</Text>
        <Text style={styles.title}>Find players</Text>
        <Text style={styles.subtitle}>
          Browse open rooms with strangers or friends, or create a room that other players can join.
        </Text>

        <View style={styles.modeRow}>
          <View style={[styles.modePill, styles.onlinePill]}>
            <Text style={styles.onlineText}>ONLINE · PUBLIC ROOMS</Text>
          </View>
          {supportsPassAndPlay(selectedGame) && (
            <Pressable onPress={() => navigation.navigate('PassAndPlay', { gameSlug: selectedGame.slug })}>
              <Text style={styles.offlineLink}>OFFLINE · PASS & PLAY</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.label}>SELECT A GAME</Text>
        <View style={styles.gameList}>
          {games.map((game) => {
            const active = String(selectedGame?.gameId) === String(game.gameId);
            return (
              <Pressable
                key={game.gameId}
                onPress={() => setSelectedGame(game)}
                style={[styles.gameChoice, active && styles.gameChoiceActive]}
              >
                <Text style={[styles.gameName, active && styles.gameNameActive]}>{game.name}</Text>
                <Text style={styles.gameMeta}>
                  {game.minPlayers}–{game.maxPlayers} players · {game.gameType || game.type}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <GlassButton
          title={selectedGame ? `CREATE ${selectedGame.name.toUpperCase()} ROOM` : 'SELECT A GAME'}
          onPress={handleCreate}
          disabled={!selectedGame}
        />

        <View style={styles.roomsHeader}>
          <View>
            <Text style={styles.sectionTitle}>OPEN ROOMS</Text>
            <Text style={styles.roomsHint}>Refreshes automatically every few seconds</Text>
          </View>
          <Pressable onPress={refresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>REFRESH</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error && rooms.length === 0 ? (
          <GlassCard style={styles.empty}>
            <Text style={styles.emptyTitle}>Room search unavailable</Text>
            <Text style={styles.emptyText}>Check your connection and try again.</Text>
            <GlassButton title="TRY AGAIN" variant="secondary" onPress={refresh} />
          </GlassCard>
        ) : availableRooms.length ? (
          <View style={styles.roomList}>
            {availableRooms.map((room) => (
              <GlassCard key={room.roomCode} style={styles.roomCard}>
                <View style={styles.roomTop}>
                  <Text style={styles.roomName}>{room.gameName}</Text>
                  <Text style={styles.roomCount}>{room.playerCount}/{room.maxPlayers}</Text>
                </View>
                <Text style={styles.roomHost}>HOST · {room.hostUsername}</Text>
                <GlassButton
                  title={joiningCode === room.roomCode ? 'JOINING...' : 'JOIN ROOM'}
                  size="small"
                  disabled={Boolean(joiningCode)}
                  onPress={() => handleJoin(room)}
                />
              </GlassCard>
            ))}
          </View>
        ) : (
          <GlassCard style={styles.empty}>
            <Text style={styles.emptyTitle}>No open rooms right now</Text>
            <Text style={styles.emptyText}>
              Create a room and it will appear here for other players to join.
            </Text>
          </GlassCard>
        )}

        <GlassButton title="BACK TO GAMES" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: spacing.xl,
    paddingBottom: 48,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.4,
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
    marginBottom: 4,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  onlinePill: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.neonCyan,
  },
  onlineText: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  offlineLink: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  label: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  gameList: {
    flexDirection: 'row',
    gap: 8,
  },
  gameChoice: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  gameChoiceActive: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  gameName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  gameNameActive: {
    color: colors.neonCyan,
  },
  gameMeta: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
    marginTop: 4,
  },
  roomsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 17,
  },
  roomsHint: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
    marginTop: 3,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  refreshText: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  loader: {
    marginVertical: 28,
  },
  roomList: {
    gap: 10,
  },
  roomCard: {
    gap: 8,
    padding: 14,
  },
  roomTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roomName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  roomCount: {
    color: colors.neonLime,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  roomHost: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  empty: {
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
  },
});
