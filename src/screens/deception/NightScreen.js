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
import { submitNightAction } from '../../api/deceptionApi';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { playSfx } from '../../utils/soundEffects';

export default function NightScreen({ navigation }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    sessionId,
    gamePhase,
    roundNumber,
    yourRole,
    yourUsername,
    players,
    lastEvent,
    fetchGameState,
  } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = user?.userId ?? user?.id ?? user?.userID ?? user?.user?.userId ?? null;
  const currentDisplayName = user?.displayName ?? user?.user?.displayName ?? yourUsername ?? 'Player';
  const normalizedRole = String(yourRole || '').toUpperCase();

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

  // Sound cue on night start
  useEffect(() => {
    playSfx('start');
  }, []);

  // Eligible targets
  const targetPlayers = useMemo(() => {
    return (players || []).filter((p) => {
      if (p.alive === false || p.left) return false;
      // Impostor cannot target fellow alive impostors or self
      if (normalizedRole === 'PREDATOR' && isSamePlayer(p)) return false;
      return true;
    });
  }, [players, normalizedRole, currentUserId]);

  // Phase transition
  useEffect(() => {
    if (gamePhase === 'DAY') {
      navigation.replace('Day');
    } else if (gamePhase === 'VOTING') {
      navigation.replace('Voting');
    } else if (gamePhase === 'GAME_OVER') {
      navigation.replace('GameOver');
    }
  }, [gamePhase, navigation]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'PHASE_CHANGED') {
      const nextPhase = lastEvent.data?.phase || lastEvent.data;
      if (nextPhase === 'DAY') navigation.replace('Day');
      else if (nextPhase === 'VOTING') navigation.replace('Voting');
      else if (nextPhase === 'GAME_OVER') navigation.replace('GameOver');
    }
  }, [lastEvent, navigation]);

  const handleSelect = (playerId) => {
    if (submitted || !isAlive) return;
    playSfx('click');
    setSelectedPlayer(playerId);
  };

  const handleActionSubmit = async () => {
    if (!sessionId || !selectedPlayer || submitted || submitting) return;

    try {
      setSubmitting(true);
      if (normalizedRole === 'PREDATOR') {
        playSfx('kill');
      } else {
        playSfx('click');
      }

      await submitNightAction(sessionId, selectedPlayer);
      setSubmitted(true);
      showToast('Action confirmed. Awaiting night resolution.', 'success');
      await fetchGameState(sessionId);
    } catch (err) {
      playSfx('error');
      showToast(getApiErrorMessage(err, 'Could not complete stealth action.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isActionRole = normalizedRole === 'PREDATOR' || normalizedRole === 'DOCTOR' || normalizedRole === 'DETECTIVE';

  return (
    <Screen style={styles.screen}>
      <View style={styles.mobileContainer}>
        <GameHud
          phase="NIGHT"
          roundNumber={roundNumber}
          players={players}
          username={yourUsername}
          displayName={currentDisplayName}
          avatarUrl={user?.avatarUrl}
          role={yourRole}
          observer={!isAlive}
        />

        {/* AMONG US SABOTAGE BANNER */}
        <View style={[styles.nightBanner, normalizedRole === 'PREDATOR' && styles.nightBannerImpostor]}>
          <Text style={styles.nightIcon}>{normalizedRole === 'PREDATOR' ? '🔪' : normalizedRole === 'DOCTOR' ? '🩺' : normalizedRole === 'DETECTIVE' ? '🔍' : '🌙'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nightKicker, normalizedRole === 'PREDATOR' && styles.kickerRed]}>
              {normalizedRole === 'PREDATOR' ? 'SABOTAGE PROTOCOL' : 'SHIP LIGHTS OUT'}
            </Text>
            <Text style={styles.nightTitle}>
              {normalizedRole === 'PREDATOR'
                ? 'Eliminate a Target'
                : normalizedRole === 'DOCTOR'
                ? 'Shield a Crewmate'
                : normalizedRole === 'DETECTIVE'
                ? 'Investigate a Suspect'
                : 'Sleep Tight, Crewmate'}
            </Text>
            <Text style={styles.nightSubtitle}>
              {normalizedRole === 'PREDATOR'
                ? 'Choose a crewmate to secretly eliminate in the dark.'
                : normalizedRole === 'DOCTOR'
                ? 'Select one player to shield from tonight\'s attack.'
                : normalizedRole === 'DETECTIVE'
                ? 'Scan one crewmate to learn their secret identity.'
                : 'Stay hidden while the ship life support runs.'}
            </Text>
          </View>
        </View>

        {/* TARGET SELECTION LIST */}
        {isActionRole && isAlive ? (
          <ScrollView contentContainerStyle={styles.targetsList} showsVerticalScrollIndicator={false}>
            {targetPlayers.map((target) => {
              const isSelected = String(selectedPlayer) === String(target.userId);
              const isSelf = isSamePlayer(target);

              return (
                <Pressable
                  key={target.userId}
                  disabled={submitted}
                  onPress={() => handleSelect(target.userId)}
                  style={({ pressed }) => [
                    styles.targetCard,
                    isSelected && (normalizedRole === 'PREDATOR' ? styles.targetSelectedKill : styles.targetSelected),
                    pressed && styles.cardPressed,
                  ]}
                >
                  <Avatar uri={target.avatarUrl} name={target.displayName || target.username} size={36} />

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.targetName}>
                      {target.displayName || target.username}{isSelf ? ' (You)' : ''}
                    </Text>
                    <Text style={styles.targetDesc}>
                      {normalizedRole === 'PREDATOR' ? 'Vulnerable crewmate' : 'Ship occupant'}
                    </Text>
                  </View>

                  <View style={[styles.radioCircle, isSelected && styles.radioActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.innocentSleepBox}>
            <Text style={styles.innocentEmoji}>💤</Text>
            <Text style={styles.innocentTitle}>Waiting for Dawn...</Text>
            <Text style={styles.innocentText}>
              You have no night abilities. Watch ship status and wait for emergency discussion at daybreak.
            </Text>
          </View>
        )}

        {/* CONFIRM BUTTON */}
        {isActionRole && isAlive && !submitted && (
          <Pressable
            onPress={handleActionSubmit}
            disabled={!selectedPlayer || submitting}
            style={({ pressed }) => [
              styles.actionBtn,
              normalizedRole === 'PREDATOR' ? styles.actionBtnKill : styles.actionBtnNormal,
              !selectedPlayer && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.actionBtnText}>
              {submitting
                ? 'EXECUTING...'
                : normalizedRole === 'PREDATOR'
                ? 'EXECUTE ELIMINATION 🔪'
                : normalizedRole === 'DOCTOR'
                ? 'ACTIVATE MEDICAL SHIELD 🛡️'
                : 'COMMENCE SECURITY SCAN 🔍'}
            </Text>
          </Pressable>
        )}

        {submitted && (
          <View style={styles.lockedBox}>
            <Text style={styles.lockedText}>✓ STEALTH ACTION RECORDED FOR TONIGHT</Text>
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
  nightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 27, 75, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  nightBannerImpostor: {
    backgroundColor: 'rgba(69, 10, 10, 0.75)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  nightIcon: {
    fontSize: 26,
  },
  nightKicker: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  kickerRed: {
    color: colors.amongRedBright,
  },
  nightTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 16,
    marginTop: 1,
  },
  nightSubtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2,
  },
  targetsList: {
    gap: 8,
    paddingBottom: 6,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  targetSelected: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  targetSelectedKill: {
    borderColor: colors.amongRedBright,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  targetName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  targetDesc: {
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
  radioActive: {
    borderColor: colors.neonCyan,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neonCyan,
  },
  innocentSleepBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  innocentEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  innocentTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 16,
    marginBottom: 4,
  },
  innocentText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
  },
  actionBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  actionBtnKill: {
    backgroundColor: colors.amongRedBright,
    shadowColor: colors.amongRedBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  actionBtnNormal: {
    backgroundColor: colors.primary,
  },
  actionBtnText: {
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
  lockedBox: {
    backgroundColor: 'rgba(16, 231, 117, 0.12)',
    borderWidth: 1,
    borderColor: colors.neonLime,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  lockedText: {
    color: colors.neonLime,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
