import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import GameHud from '../../components/GameHud';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { submitVote, getGameResult } from '../../api/deceptionApi';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';
import { playSfx } from '../../utils/soundEffects';

export default function VotingScreen({ navigation }) {
  const {
    sessionId,
    gamePhase,
    roundNumber,
    players,
    yourUsername,
    yourRole,
    lastEvent,
    fetchGameState,
  } = useGame();

  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedPlayer, setSelectedPlayer] = useState(null); // userId or 'SKIP'
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    return (players || []).find((p) => isSamePlayer(p));
  }, [players, currentUserId, currentDisplayName]);

  const isAlive = currentPlayer ? currentPlayer.alive !== false : true;

  // Living eligible target players
  const targetPlayers = useMemo(() => {
    return (players || []).filter((p) => p.alive !== false && !p.left);
  }, [players]);

  // Phase transition listener
  useEffect(() => {
    if (gamePhase === 'NIGHT') {
      navigation.replace('Night');
    } else if (gamePhase === 'DAY') {
      navigation.replace('Day');
    } else if (gamePhase === 'GAME_OVER') {
      navigation.replace('GameOver');
    }
  }, [gamePhase, navigation]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'PHASE_CHANGED') {
      const nextPhase = lastEvent.data?.phase || lastEvent.data;
      if (nextPhase === 'NIGHT') navigation.replace('Night');
      else if (nextPhase === 'DAY') navigation.replace('Day');
      else if (nextPhase === 'GAME_OVER') navigation.replace('GameOver');
    }
  }, [lastEvent, navigation]);

  const handleSelect = (playerId) => {
    if (submitted || !isAlive) return;
    playSfx('click');
    setSelectedPlayer(playerId);
  };

  const handleVoteSubmit = async () => {
    if (!sessionId || !isAlive || !selectedPlayer || submitted || submitting) return;

    try {
      setSubmitting(true);
      playSfx('vote');

      // Submit vote (pass selectedPlayer or null if skip)
      const voteTarget = selectedPlayer === 'SKIP' ? null : selectedPlayer;
      await submitVote(sessionId, voteTarget);

      setSubmitted(true);
      showToast('Your vote has been locked in.', 'success');
      await fetchGameState(sessionId);
    } catch (err) {
      playSfx('error');
      showToast(getApiErrorMessage(err, 'Could not cast vote.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.mobileContainer}>
        {/* HUD */}
        <GameHud
          phase="VOTING"
          roundNumber={roundNumber}
          players={players}
          username={yourUsername}
          displayName={currentDisplayName}
          avatarUrl={user?.avatarUrl}
          role={yourRole}
          observer={!isAlive}
        />

        {/* AMONG US TABLET HEADER */}
        <View style={styles.tabletBanner}>
          <Text style={styles.tabletKicker}>EMERGENCY VOTING SYSTEM 🗳️</Text>
          <Text style={styles.tabletTitle}>Who is the Impostor?</Text>
          <Text style={styles.tabletSubtitle}>
            {submitted
              ? 'Vote confirmed! Awaiting remaining crewmates...'
              : isAlive
              ? 'Select a suspect to eject, or choose to skip vote.'
              : 'Ghost spectator mode: you cannot vote.'}
          </Text>
        </View>

        {/* CREWMATE CARDS GRID (COMPACT SINGLE SCREEN) */}
        <ScrollView contentContainerStyle={styles.crewGrid} showsVerticalScrollIndicator={false}>
          {targetPlayers.map((target) => {
            const isSelected = String(selectedPlayer) === String(target.userId);
            const isSelf = isSamePlayer(target);

            return (
              <Pressable
                key={target.userId}
                disabled={submitted || !isAlive}
                onPress={() => handleSelect(target.userId)}
                style={({ pressed }) => [
                  styles.crewCard,
                  isSelected && styles.crewCardSelected,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.crewAvatarWrap}>
                  <Avatar uri={target.avatarUrl} name={target.displayName || target.username} size={38} />
                  {target.hasVoted && (
                    <View style={styles.votedBadge}>
                      <Text style={styles.votedBadgeText}>VOTED ✓</Text>
                    </View>
                  )}
                </View>

                <View style={styles.crewInfo}>
                  <Text numberOfLines={1} style={styles.crewName}>
                    {target.displayName || target.username}
                  </Text>
                  <Text style={styles.crewStatus}>
                    {isSelf ? 'You' : 'Living Crewmate'}
                  </Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}

          {/* SKIP VOTE CARD */}
          <Pressable
            disabled={submitted || !isAlive}
            onPress={() => handleSelect('SKIP')}
            style={({ pressed }) => [
              styles.skipCard,
              selectedPlayer === 'SKIP' && styles.skipCardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.skipIcon}>❌</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.skipTitle}>SKIP VOTE</Text>
              <Text style={styles.skipSubtitle}>Not enough proof to eject anyone</Text>
            </View>
            <View style={[styles.radioCircle, selectedPlayer === 'SKIP' && styles.radioCircleActive]}>
              {selectedPlayer === 'SKIP' && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        </ScrollView>

        {/* VOTE CONFIRM BUTTON */}
        {isAlive && !submitted && (
          <Pressable
            onPress={handleVoteSubmit}
            disabled={!selectedPlayer || submitting}
            style={({ pressed }) => [
              styles.castVoteBtn,
              !selectedPlayer && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.castVoteText}>
              {submitting
                ? 'RECORDING BALLOT...'
                : selectedPlayer === 'SKIP'
                ? 'CONFIRM: SKIP VOTE ❌'
                : 'CONFIRM: VOTE SUSPECT 🗳️'}
            </Text>
          </Pressable>
        )}

        {submitted && (
          <View style={styles.submittedBox}>
            <Text style={styles.submittedText}>✓ YOUR BALLOT IS LOCKED IN</Text>
          </View>
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
    paddingBottom: 14,
    justifyContent: 'space-between',
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  tabletBanner: {
    backgroundColor: 'rgba(19, 28, 48, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  tabletKicker: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  tabletTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 16,
  },
  tabletSubtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 10.5,
    marginTop: 2,
  },
  crewGrid: {
    gap: 8,
    paddingBottom: 6,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  crewCardSelected: {
    borderColor: colors.amongRedBright,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  crewAvatarWrap: {
    position: 'relative',
  },
  votedBadge: {
    position: 'absolute',
    bottom: -3,
    right: -4,
    backgroundColor: colors.neonLime,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  votedBadgeText: {
    color: '#000',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 7,
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  crewStatus: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  skipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    marginTop: 2,
  },
  skipCardSelected: {
    borderColor: colors.neonAmber,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  skipIcon: {
    fontSize: 20,
  },
  skipTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  skipSubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 9.5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.amongRedBright,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amongRedBright,
  },
  castVoteBtn: {
    backgroundColor: colors.amongRedBright,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: colors.amongRedBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  castVoteText: {
    color: colors.white,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    opacity: 0.85,
  },
  submittedBox: {
    backgroundColor: 'rgba(16, 231, 117, 0.12)',
    borderWidth: 1,
    borderColor: colors.neonLime,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  submittedText: {
    color: colors.neonLime,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
