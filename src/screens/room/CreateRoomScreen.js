
import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';

import colors from '../../theme/colors';

import { createRoom } from '../../api/roomApi';
import { getApiErrorMessage } from '../../api/apiUtils';

export default function CreateRoomScreen({ navigation, route }) {

  /*
   * Game Catalog should pass the selected gameId.
   *
   * Example:
   * navigation.navigate('CreateRoom', {
   *   gameId: 1,
   *   gameName: 'Deception Around Us',
   * });
   */
  const gameId = route?.params?.gameId;
  const gameName =
    route?.params?.gameName || 'Selected Game';

  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {

    if (!gameId) {
      Alert.alert(
        'Game Not Selected',
        'Please select a game before creating a room.'
      );

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
      const room = await createRoom({
        gameId: Number(gameId),
      });

      if (!room?.roomCode) {
        throw new Error(
          'Room was created but no room code was returned.'
        );
      }

      // Open the real lobby
      navigation.replace('Lobby', {
        roomCode: room.roomCode,
      });

    } catch (error) {

      console.error(
        'Create room failed:',
        error
      );

      Alert.alert(
        'Could Not Create Room',
        getApiErrorMessage(
          error,
          'Something went wrong while creating the room.'
        )
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <Screen>

      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>

          <Text style={styles.eyebrow}>
            GAME ROOM
          </Text>

          <Text style={styles.title}>
            Create Room
          </Text>

          <Text style={styles.subtitle}>
            Start a multiplayer session and invite your friends.
          </Text>

        </View>

        <GlassCard style={styles.card}>

          <Text style={styles.label}>
            SELECTED GAME
          </Text>

          <Text style={styles.gameName}>
            {gameName}
          </Text>

          <Text style={styles.info}>
            Your room will use the multiplayer settings
            configured for this game.
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

          <GlassButton
            title="BACK"
            variant="secondary"
            onPress={() => navigation.goBack()}
            disabled={loading}
          />

        </GlassCard>

      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,

    justifyContent: 'center',

    paddingHorizontal: 24,

    maxWidth: 520,

    width: '100%',

    alignSelf: 'center',
  },

  header: {
    marginBottom: 28,
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

    fontSize: 30,
  },

  subtitle: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 14,

    lineHeight: 21,

    marginTop: 8,
  },

  card: {
    padding: 24,
  },

  label: {
    color: colors.textMuted,

    fontFamily: 'Inter-SemiBold',

    fontSize: 11,

    letterSpacing: 1.2,
  },

  gameName: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 21,

    marginTop: 8,
  },

  info: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 13,

    lineHeight: 20,

    marginTop: 12,

    marginBottom: 24,
  },

  loader: {
    marginTop: 12,
  },

});

