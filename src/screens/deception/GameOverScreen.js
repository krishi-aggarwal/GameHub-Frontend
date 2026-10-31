import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import ConfettiOverlay from '../../components/ConfettiOverlay';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { getGameResult } from '../../api/deceptionApi';
import { playSfx } from '../../utils/soundEffects';

const ROLE_DISPLAY = {
  PREDATOR: { label: 'IMPOSTOR', color: colors.amongRedBright },
  DOCTOR: { label: 'MEDIC', color: colors.neonLime },
  DETECTIVE: { label: 'SECURITY', color: colors.neonCyan },
  INNOCENT: { label: 'CREWMATE', color: colors.amongBlueBright },
};

export default function GameOverScreen({ navigation, route }) {
  const { result: routeResult } = route?.params || {};
  const { sessionId, players: contextPlayers, exitGame } = useGame();
  const { activeRoomCode, user } = useAuth();

  const [gameResult, setGameResult] = useState(routeResult ?? null);
  const [confettiActive, setConfettiActive] = useState(false);

  const players = useMemo(() => {
    return Array.isArray(contextPlayers) ? contextPlayers : [];
  }, [contextPlayers]);

  useEffect(() => {
    if (gameResult || !sessionId) return;
    getGameResult(sessionId)
      .then((data) => {
        const res = data?.result ?? data?.gameResult ?? data?.winner ?? null;
        setGameResult(res);
      })
      .catch(() => {});
  }, [sessionId, gameResult]);

  const innocentsWon = gameResult === 'INNOCENTS_WIN';

  useEffect(() => {
    if (innocentsWon) {
      playSfx('fanfare');
      setConfettiActive(true);
    } else {
      playSfx('kill');
    }
  }, [innocentsWon]);

  const returnToLobby = () => {
    playSfx('click');
    exitGame();
    if (activeRoomCode) {
      navigation.replace('Lobby', { roomCode: activeRoomCode });
    } else {
      navigation.replace('Home');
    }
  };

  return (
    <Screen style={styles.screen}>
      <ConfettiOverlay active={confettiActive} onFinished={() => setConfettiActive(false)} />

      <View style={styles.mobileContainer}>
        {/* AMONG US VICTORY / DEFEAT BANNER */}
        <View style={[styles.resultBanner, innocentsWon ? styles.bannerVictory : styles.bannerDefeat]}>
          <Text style={styles.resultEmoji}>{innocentsWon ? '🏆' : '💀'}</Text>
          <Text style={[styles.resultTitle, innocentsWon ? styles.titleVictory : styles.titleDefeat]}>
            {innocentsWon ? 'VICTORY' : 'DEFEAT'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {innocentsWon
              ? 'Crewmates successfully purged all Impostors from the ship!'
              : 'The Impostors sabotaged and overwhelmed the crew.'}
          </Text>
        </View>

        {/* FULL ROSTER IDENTITY REVEAL */}
        <View style={styles.rosterCard}>
          <Text style={styles.rosterHeader}>CREW DOSSIER REVEALED</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rosterList}>
            {players.map((p, idx) => {
              const roleKey = String(p.role || '').toUpperCase();
              const roleInfo = ROLE_DISPLAY[roleKey] || { label: roleKey || 'CREWMATE', color: colors.textSecondary };
              const alive = p.alive !== false;

              return (
                <View key={p.userId || idx} style={styles.playerRow}>
                  <Avatar uri={p.avatarUrl} name={p.displayName || p.username} size={32} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text numberOfLines={1} style={styles.playerName}>
                      {p.displayName || p.username} {!alive && '(Ghost 👻)'}
                    </Text>
                  </View>
                  <View style={[styles.roleBadge, { borderColor: roleInfo.color }]}>
                    <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>
                      {roleInfo.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* RETURN BUTTON */}
        <Pressable
          onPress={returnToLobby}
          style={({ pressed }) => [styles.returnBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.returnBtnText}>RETURN TO LOBBY 🚀</Text>
        </Pressable>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    justifyContent: 'space-between',
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  resultBanner: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
  },
  bannerVictory: {
    backgroundColor: 'rgba(38, 115, 255, 0.12)',
    borderColor: colors.amongBlueBright,
    shadowColor: colors.amongBlueBright,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  bannerDefeat: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: colors.amongRedBright,
    shadowColor: colors.amongRedBright,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 6,
  },
  resultTitle: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 34,
    letterSpacing: 2,
  },
  titleVictory: {
    color: colors.amongBlueBright,
  },
  titleDefeat: {
    color: colors.amongRedBright,
  },
  resultSubtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  rosterCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 14,
    marginVertical: 14,
  },
  rosterHeader: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 9.5,
    letterSpacing: 1,
    marginBottom: 10,
  },
  rosterList: {
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  playerName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 12.5,
  },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  roleBadgeText: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  returnBtn: {
    backgroundColor: colors.primary,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  returnBtnText: {
    color: colors.white,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
