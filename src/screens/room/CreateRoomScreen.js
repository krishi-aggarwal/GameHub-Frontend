import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

import { createRoom } from '../../api/roomApi';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CreateRoomScreen({
  navigation,
  route,
}) {

  /*
   * Game Catalog passes the selected game.
   *
   * Example:
   * navigation.navigate('CreateRoom', {
   *   gameId: 1,
   *   gameName: 'Deception Around Us',
   * });
   */

  const gameId =
    route?.params?.gameId;

  const gameName =
    route?.params?.gameName ||
    'Selected Game';
  const { setActiveRoomCode } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] =
    useState(false);

  const handleCreateRoom = async () => {

    if (!gameId) {

      showToast('Please select a game before creating a room.');

      return;
    }

    try {

      setLoading(true);

      /*
       * Backend expects ONLY:
       *
       * {
       *   gameId: Long
       * }
       */

      const room =
        await createRoom({
          gameId: Number(gameId),
        });

      if (!room?.roomCode) {

        throw new Error(
          'Room was created but no room code was returned.'
        );
      }

      await setActiveRoomCode(room.roomCode);

      // Open the real lobby.
      navigation.replace(
        'Lobby',
        {
          roomCode: room.roomCode,
        }
      );

    } catch (error) {

      console.error(
        'Create room failed:',
        error
      );

      showToast(
        getApiErrorMessage(error, 'Something went wrong while creating the room.')
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <Screen>

      <View style={styles.container}>

        {/* TOP BAR */}

        <View style={styles.topBar}>

          <Pressable
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
            disabled={loading}
          >

            <Text style={styles.backArrow}>
              ‹
            </Text>

            <Text style={styles.backText}>
              BACK
            </Text>

          </Pressable>

        </View>

        {/* HEADER */}

        <View style={styles.header}>

          <Text style={styles.eyebrow}>
            GAMEHUB
          </Text>

          <Text style={styles.title}>
            Create a Room
          </Text>

          <Text style={styles.subtitle}>
            Start a multiplayer session and
            invite your friends to play.
          </Text>

        </View>

        {/* ROOM CARD */}

        <GlassCard style={styles.card}>

          <Text style={styles.sectionLabel}>
            SELECTED GAME
          </Text>

          <View style={styles.gamePreview}>

            <View style={styles.gameIcon}>

              <Text style={styles.gameIconText}>
                ▶
              </Text>

            </View>

            <View style={styles.gameInfo}>

              <Text style={styles.gameName}>
                {gameName}
              </Text>

              <Text style={styles.gameStatus}>
                READY TO PLAY
              </Text>

            </View>

          </View>

          <View style={styles.divider} />

          <Text style={styles.info}>
            Your room will use the multiplayer
            settings configured for this game.
          </Text>

          <GlassButton
            title={
              loading
                ? 'CREATING ROOM...'
                : 'CREATE ROOM'
            }
            onPress={handleCreateRoom}
            disabled={loading}
          />

          {loading && (
            <ActivityIndicator
              color={colors.primary}
              style={styles.loader}
            />
          )}

        </GlassCard>

      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,

    justifyContent: 'center',

    paddingHorizontal: spacing.xl,

    maxWidth: 520,

    width: '100%',

    alignSelf: 'center',
  },

  /* TOP BAR */

  topBar: {
    marginBottom: spacing.lg,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',

    alignSelf: 'flex-start',

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

    marginTop: 8,
  },

  /* CARD */

  card: {
    padding: spacing.xl,
  },

  sectionLabel: {
    color: colors.textMuted,

    fontFamily: 'Inter-Bold',

    fontSize: 9,

    letterSpacing: 1.3,

    marginBottom: spacing.md,
  },

  /* SELECTED GAME */

  gamePreview: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  gameIcon: {
    width: 50,
    height: 50,

    borderRadius: 15,

    backgroundColor: colors.surfaceStrong,

    borderWidth: 1,

    borderColor: colors.border,

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: spacing.md,
  },

  gameIconText: {
    color: colors.primary,

    fontFamily: 'Inter-Bold',

    fontSize: 17,
  },

  gameInfo: {
    flex: 1,
  },

  gameName: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 19,

    marginBottom: 5,
  },

  gameStatus: {
    color: colors.success,

    fontFamily: 'Inter-Bold',

    fontSize: 8,

    letterSpacing: 1.1,
  },

  divider: {
    height: 1,

    backgroundColor: colors.border,

    marginVertical: spacing.lg,
  },

  /* INFO */

  info: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 12,

    lineHeight: 19,

    marginBottom: spacing.lg,
  },

  /* LOADING */

  loader: {
    marginTop: spacing.md,
  },

});