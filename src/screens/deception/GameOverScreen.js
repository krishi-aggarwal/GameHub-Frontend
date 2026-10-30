import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

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

import {
  useGame,
} from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';

import {
  getGameResult,
} from '../../api/deceptionApi';

export default function GameOverScreen({
  navigation,
  route,
}) {

  const {
    result: routeResult,
  } = route?.params || {};

  const {
    sessionId,
    gameState,
    players: contextPlayers,
    exitGame,
  } = useGame();
  const { activeRoomCode } = useAuth();

  const returnToLobby = () => {
    exitGame();
    if (activeRoomCode) {
      navigation.replace('Lobby', { roomCode: activeRoomCode });
    } else {
      navigation.replace('GameCatalog');
    }
  };

  const [gameResult, setGameResult] =
    useState(routeResult ?? null);

  /*
   * Use players from GameContext.
   */
  const players = useMemo(() => {

    if (!Array.isArray(contextPlayers)) {
      return [];
    }

    return contextPlayers;

  }, [contextPlayers]);

  /*
   * If result was not passed through navigation,
   * get it from the backend.
   */
  useEffect(() => {

    if (gameResult || !sessionId) {
      return;
    }

    const fetchResult = async () => {

      try {

        const data =
          await getGameResult(sessionId);

        /*
         * Support either:
         * data.result
         * data.gameResult
         * data.winner
         */
        const resolvedResult =
          data?.result ??
          data?.gameResult ??
          data?.winner ??
          null;

        if (resolvedResult) {
          setGameResult(resolvedResult);
        }

      } catch (error) {

        console.error(
          'Failed to fetch game result:',
          error
        );

      }
    };

    fetchResult();

  }, [
    gameResult,
    sessionId,
  ]);

  /*
   * Backend game state may already contain
   * the final result.
   */
  const finalResult =
    gameResult ??
    gameState?.result ??
    gameState?.gameResult ??
    gameState?.winner ??
    'INNOCENTS_WIN';

  const predatorsWon =
    finalResult === 'PREDATORS_WIN';

  /*
   * Get player display name safely.
   */
  const getPlayerName = (player) => {

    return (
      player?.username ??
      player?.displayName ??
      player?.name ??
      player?.user?.username ??
      player?.user?.displayName ??
      player?.user?.name ??
      'Unknown Player'
    );
  };

  /*
   * Get a stable key.
   */
  const getPlayerId = (player, index) => {

    return (
      player?.userId ??
      player?.id ??
      player?.user?.userId ??
      player?.user?.id ??
      `player-${index}`
    );
  };

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

          {players.length > 0 ? (

            players.map((player, index) => {

              const playerName =
                getPlayerName(player);

              const playerId =
                getPlayerId(player, index);

              const isAlive =
                player?.alive !== false;
              const hasLeft = player?.left === true;

              return (
                <View
                  key={String(playerId)}
                  style={styles.playerRow}
                >

                  <Avatar
                    name={playerName}
                    size={42}
                  />

                  <View style={styles.playerInfo}>

                    <Text style={styles.playerName}>
                      {playerName}
                    </Text>

                    <Text
                      style={[
                        styles.status,
                        hasLeft
                          ? styles.left
                          : isAlive
                            ? styles.alive
                            : styles.dead,
                      ]}
                    >
                      {hasLeft
                        ? 'LEFT GAME'
                        : isAlive
                          ? 'ALIVE'
                          : 'ELIMINATED'}
                    </Text>

                  </View>

                </View>
              );
            })

          ) : (

            <Text style={styles.noPlayers}>
              No player data available.
            </Text>

          )}

        </GlassCard>

        {/* ACTIONS */}
        <View style={styles.actions}>

          <GlassButton
            title="BACK TO LOBBY"
            onPress={returnToLobby}
          />

          <View style={styles.secondaryAction}>

            <GlassButton
              title="PLAY AGAIN"
              variant="secondary"
              onPress={returnToLobby}
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

  left: {
    color: colors.textMuted,
  },

  noPlayers: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 13,
  },

  actions: {
    width: '100%',
  },

  secondaryAction: {
    marginTop: spacing.sm,
  },

});