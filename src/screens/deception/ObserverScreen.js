import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import GameHud from '../../components/GameHud';
import GameChat from '../../components/GameChat';
import colors from '../../theme/colors';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';

export default function ObserverScreen({ navigation }) {
  const {
    gamePhase,
    roundNumber,
    yourRole,
    yourUsername,
    players,
    lastEvent,
  } = useGame();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (gamePhase === 'GAME_OVER') {
      navigation.replace('GameOver');
    }
  }, [gamePhase, navigation]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'CHAT_MESSAGE' && lastEvent.data) {
      const chat = lastEvent.data;
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          userId: chat.userId,
          displayName: chat.displayName || chat.username || 'Crewmate',
          avatarUrl: chat.avatarUrl || null,
          message: chat.message || '',
          timestamp: chat.timestamp || Date.now(),
        },
      ]);
    } else if (lastEvent.type === 'GAME_OVER') {
      navigation.replace('GameOver');
    }
  }, [lastEvent, navigation]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.mobileContainer}>
        <GameHud
          phase={gamePhase}
          roundNumber={roundNumber}
          players={players}
          username={yourUsername}
          displayName={user?.displayName}
          avatarUrl={user?.avatarUrl}
          role={yourRole}
          observer={true}
        />

        <View style={styles.ghostBanner}>
          <Text style={styles.ghostIcon}>👻</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ghostTitle}>GHOST SPECTATOR MODE</Text>
            <Text style={styles.ghostSubtitle}>
              You have been eliminated from the active crew. You can float freely and observe live ship discussions.
            </Text>
          </View>
        </View>

        <View style={styles.chatWrap}>
          <GameChat
            messages={messages}
            isAlive={false}
            maxHeight={260}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    justifyContent: 'space-between',
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  ghostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  ghostIcon: {
    fontSize: 28,
  },
  ghostTitle: {
    color: colors.neonCyan,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  ghostSubtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },
  chatWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
