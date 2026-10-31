import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import GameHud from '../../components/GameHud';
import GameChat from '../../components/GameChat';
import Avatar from '../../components/Avatar';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { getInvestigationResult, sendGameChatMessage, startVoting } from '../../api/deceptionApi';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';
import { playSfx } from '../../utils/soundEffects';

export default function DayScreen({ navigation }) {
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

  const { user } = useAuth();
  const { showToast } = useToast();

  const [startingVoting, setStartingVoting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [investigation, setInvestigation] = useState(null);

  const safePlayers = Array.isArray(players) ? players : [];
  const currentUserId = user?.userId ?? user?.id ?? user?.userID ?? user?.user?.userId ?? null;
  const currentDisplayName = user?.displayName ?? user?.user?.displayName ?? yourUsername ?? 'Player';

  const isSamePlayer = (player) => {
    if (!player) return false;
    if (currentUserId != null && player.userId != null) {
      return String(player.userId) === String(currentUserId);
    }
    return String(player.displayName || '').toLowerCase() === String(currentDisplayName).toLowerCase();
  };

  const currentPlayer = useMemo(() => {
    return safePlayers.find((p) => isSamePlayer(p)) ?? null;
  }, [players, currentUserId, currentDisplayName]);

  const isAlive = currentPlayer ? currentPlayer.alive !== false : true;

  // Sound cue on enter
  useEffect(() => {
    playSfx('emergency');
  }, []);

  // Fetch Detective investigation report if detective
  useEffect(() => {
    if (!sessionId || String(yourRole || '').toUpperCase() !== 'DETECTIVE') return;
    getInvestigationResult(sessionId)
      .then((res) => {
        if (res?.investigatedPlayerName) {
          setInvestigation(res);
        }
      })
      .catch(() => {});
  }, [sessionId, yourRole, roundNumber]);

  // Handle incoming websocket chat & phase change events
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'CHAT_MESSAGE' && lastEvent.data) {
      const chat = lastEvent.data;
      setMessages((prev) => {
        const exists = prev.some((m) => (m.messageId && chat.messageId && String(m.messageId) === String(chat.messageId)) ||
          (String(m.userId) === String(chat.userId) && m.message === chat.message && Math.abs((m.timestamp || 0) - (chat.timestamp || 0)) < 1000));
        if (exists) return prev;
        return [...prev, { ...chat, timestamp: chat.timestamp || Date.now() }];
      });
    }

    if (lastEvent.type === 'PHASE_CHANGED') {
      const newPhase = lastEvent.data?.phase || lastEvent.data;
      if (newPhase === 'VOTING') {
        playSfx('vote');
        navigation.replace('Voting');
      } else if (newPhase === 'GAME_OVER') {
        navigation.replace('GameOver');
      }
    }
  }, [lastEvent, navigation]);

  // Check phase navigation
  useEffect(() => {
    if (gamePhase === 'VOTING') {
      playSfx('vote');
      navigation.replace('Voting');
    } else if (gamePhase === 'GAME_OVER') {
      navigation.replace('GameOver');
    }
  }, [gamePhase, navigation]);

  const handleSendMessage = async (text) => {
    if (!sessionId || !isAlive) return;
    try {
      await sendGameChatMessage(sessionId, text);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to transmit message.'));
    }
  };

  const handleStartVoting = async () => {
    if (!isHost || startingVoting) return;
    try {
      setStartingVoting(true);
      playSfx('emergency');
      await startVoting(sessionId);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not initiate voting phase.'));
      setStartingVoting(false);
    }
  };

  const livingPlayers = safePlayers.filter((p) => p.alive !== false && !p.left);
  const deadPlayers = safePlayers.filter((p) => p.alive === false);

  return (
    <Screen style={styles.screen}>
      <View style={styles.mobileContainer}>
        {/* HUD */}
        <GameHud
          phase={gamePhase || 'DAY'}
          roundNumber={roundNumber}
          players={safePlayers}
          username={yourUsername}
          displayName={currentDisplayName}
          avatarUrl={user?.avatarUrl}
          role={yourRole}
          observer={!isAlive}
        />

        {/* AMONG US EMERGENCY BANNER */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyIconWrap}>
            <Text style={styles.emergencyIcon}>📢</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>EMERGENCY DISCUSSION</Text>
            <Text style={styles.emergencySubtitle}>
              {deadPlayers.length > 0
                ? `${deadPlayers.length} crewmates eliminated. Who is suspicious?`
                : 'All crewmates alive. Question everyone and identify the Impostor!'}
            </Text>
          </View>
        </View>

        {/* DETECTIVE SCAN INTEL (IF AVAILABLE) */}
        {investigation && (
          <View style={styles.intelCard}>
            <Text style={styles.intelKicker}>🔍 SECURITY SCAN RESULT</Text>
            <Text style={styles.intelText}>
              Target <Text style={styles.intelTarget}>{investigation.investigatedPlayerName}</Text> was scanned as{' '}
              <Text style={{ color: investigation.isPredator ? colors.amongRedBright : colors.amongBlueBright, fontFamily: 'Inter-Bold' }}>
                {investigation.isPredator ? 'IMPOSTOR / PREDATOR 🚨' : 'INNOCENT CREWMATE ✓'}
              </Text>
            </Text>
          </View>
        )}

        {/* CREWMATE ROSTER HORIZONTAL CHIPS */}
        <View style={styles.rosterSection}>
          <Text style={styles.rosterKicker}>CREWMATE ROSTER ({livingPlayers.length} ALIVE · {deadPlayers.length} GHOSTS)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rosterScroll}>
            {safePlayers.map((p, idx) => {
              const alive = p.alive !== false && !p.left;
              const isYou = isSamePlayer(p);
              return (
                <View
                  key={p.userId || idx}
                  style={[styles.rosterChip, !alive && styles.rosterChipDead, isYou && styles.rosterChipYou]}
                >
                  <Avatar uri={p.avatarUrl} name={p.displayName || p.username} size={24} />
                  <Text numberOfLines={1} style={[styles.rosterName, !alive && styles.rosterNameDead]}>
                    {p.displayName || p.username}{isYou ? ' (You)' : ''}
                  </Text>
                  {!alive && <Text style={styles.ghostIcon}>👻</Text>}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* SHIP RADIO / GAME CHAT */}
        <View style={styles.chatSection}>
          <GameChat
            messages={messages}
            isAlive={isAlive}
            onSend={handleSendMessage}
            maxHeight={200}
          />
        </View>

        {/* EMERGENCY PROCEED TO VOTING (HOST ACTION) */}
        {isHost && isAlive && (
          <Pressable
            onPress={handleStartVoting}
            disabled={startingVoting}
            style={({ pressed }) => [styles.emergencyVoteBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.emergencyVoteBtnText}>
              {startingVoting ? 'COMMENCING VOTING...' : '🗳️ INITIATE VOTING SESSION'}
            </Text>
          </Pressable>
        )}
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
    paddingBottom: 12,
    justifyContent: 'space-between',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  emergencyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amongRedBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyIcon: {
    fontSize: 18,
  },
  emergencyTitle: {
    color: colors.amongRedBright,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  emergencySubtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 10.5,
    lineHeight: 14,
  },
  intelCard: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  intelKicker: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  intelText: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 11,
    marginTop: 2,
  },
  intelTarget: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
  },
  rosterSection: {
    marginBottom: 8,
  },
  rosterKicker: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 8.5,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  rosterScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  rosterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rosterChipDead: {
    opacity: 0.45,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rosterChipYou: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  rosterName: {
    color: colors.text,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    maxWidth: 90,
  },
  rosterNameDead: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  ghostIcon: {
    fontSize: 10,
  },
  chatSection: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: 180,
    marginBottom: 8,
  },
  emergencyVoteBtn: {
    backgroundColor: colors.amongRedBright,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.amongRedBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  emergencyVoteBtnText: {
    color: colors.white,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
