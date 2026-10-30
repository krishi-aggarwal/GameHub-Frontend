
import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassInput from '../../components/GlassInput';
import GlassButton from '../../components/GlassButton';

import colors from '../../theme/colors';

import { joinRoom } from '../../api/roomApi';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function JoinRoomScreen({ navigation }) {

  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { setActiveRoomCode } = useAuth();
  const { showToast } = useToast();

  const handleJoinRoom = async () => {

    const code = roomCode.trim().toUpperCase();

    if (!code) {
      showToast('Enter the room code to join a game.');

      return;
    }

    try {

      setLoading(true);

      const room = await joinRoom(code);

      if (!room?.roomCode) {
        throw new Error(
          'Room was joined but room information was not returned.'
        );
      }

      await setActiveRoomCode(room.roomCode);

      navigation.replace('Lobby', {
        roomCode: room.roomCode,
      });

    } catch (error) {

      console.error(
        'Join room failed:',
        error
      );

      showToast(
        getApiErrorMessage(error, 'Unable to join this room.')
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <Screen>

      <View style={styles.container}>

        <View style={styles.header}>

          <Text style={styles.eyebrow}>
            MULTIPLAYER
          </Text>

          <Text style={styles.title}>
            Join Room
          </Text>

          <Text style={styles.subtitle}>
            Enter the room code shared by the host.
          </Text>

        </View>

        <GlassCard style={styles.card}>

          <GlassInput
            label="Room Code"
            placeholder="e.g. X7K2P9"
            value={roomCode}
            onChangeText={(value) =>
              setRoomCode(value.toUpperCase())
            }
            autoCapitalize="characters"
            editable={!loading}
          />

          <GlassButton
            title={
              loading
                ? 'JOINING ROOM...'
                : 'JOIN ROOM'
            }
            onPress={handleJoinRoom}
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

  loader: {
    marginTop: 12,
  },

});

