import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import Avatar from './Avatar';
import { playSfx, isSoundEnabled, toggleSound, subscribeSoundChange } from '../utils/soundEffects';
import {
  getGamerStats,
  calculateLevel,
  getRankTitle,
  claimDailyBonus,
  BADGES_CATALOG,
  subscribeProgression,
} from '../utils/gamerProgression';

export default function GamerProfileModal({ visible, onClose, user, onTriggerConfetti }) {
  const [stats, setStats] = useState(getGamerStats());
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const unsubProgression = subscribeProgression((newStats) => setStats({ ...newStats }));
    const unsubSound = subscribeSoundChange((enabled) => setSoundOn(enabled));
    return () => {
      unsubProgression();
      unsubSound();
    };
  }, []);

  const { level, currentLevelXp, xpToNext, progressPercent } = calculateLevel(stats.xp);
  const rankTitle = getRankTitle(level);
  const displayName = user?.displayName || user?.username || 'Player One';

  const handleClaimBonus = async () => {
    if (stats.dailyClaimed || claiming) return;
    setClaiming(true);
    const result = await claimDailyBonus();
    setClaiming(false);
    if (result.claimed && onTriggerConfetti) {
      onTriggerConfetti();
    }
  };

  const handleToggleSound = async () => {
    const res = await toggleSound();
    setSoundOn(res);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.kicker}>GAMER PASSPORT</Text>
              <Text style={styles.title}>Player Profile</Text>
            </View>
            <Pressable onPress={() => { playSfx('click'); onClose(); }} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Player Hero Info */}
            <View style={styles.playerCard}>
              <View style={styles.avatarRing}>
                <Avatar uri={user?.avatarUrl} name={displayName} size={64} />
                <View style={styles.levelBadgeMini}>
                  <Text style={styles.levelBadgeMiniText}>{level}</Text>
                </View>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>{displayName}</Text>
                <Text style={styles.playerRank}>{rankTitle}</Text>
                <View style={styles.statsInlineRow}>
                  <View style={styles.streakPill}>
                    <Text style={styles.streakPillText}>🔥 {stats.streak || 1} Day Streak</Text>
                  </View>
                  <View style={styles.gamesPill}>
                    <Text style={styles.gamesPillText}>🕹️ {stats.gamesPlayed || 0} Matches</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Level & XP Progression */}
            <View style={styles.progressionCard}>
              <View style={styles.xpHeader}>
                <Text style={styles.levelLabel}>LEVEL {level}</Text>
                <Text style={styles.xpCount}>{currentLevelXp} / 250 XP ({xpToNext} to next)</Text>
              </View>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* Daily Login Reward Quest */}
            <View style={styles.rewardCard}>
              <View style={styles.rewardLeft}>
                <Text style={styles.rewardIcon}>🎁</Text>
                <View>
                  <Text style={styles.rewardTitle}>Daily Gamer Bonus</Text>
                  <Text style={styles.rewardSubtitle}>
                    {stats.dailyClaimed ? 'Claimed for today! Come back tomorrow' : '+50 XP for daily check-in!'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleClaimBonus}
                disabled={stats.dailyClaimed || claiming}
                style={[styles.claimBtn, stats.dailyClaimed && styles.claimedBtn]}
              >
                <Text style={[styles.claimBtnText, stats.dailyClaimed && styles.claimedBtnText]}>
                  {stats.dailyClaimed ? 'CLAIMED' : 'CLAIM'}
                </Text>
              </Pressable>
            </View>

            {/* Preferences (Sound FX) */}
            <View style={styles.preferenceRow}>
              <View style={styles.prefLeft}>
                <Text style={styles.prefIcon}>{soundOn ? '🔊' : '🔇'}</Text>
                <View>
                  <Text style={styles.prefTitle}>Sound Effects (SFX)</Text>
                  <Text style={styles.prefSubtitle}>Arcade synthesized game audio</Text>
                </View>
              </View>
              <Pressable onPress={handleToggleSound} style={[styles.toggleBtn, soundOn && styles.toggleBtnActive]}>
                <Text style={[styles.toggleBtnText, soundOn && styles.toggleBtnTextActive]}>
                  {soundOn ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
            </View>

            {/* Achievements Grid */}
            <View style={styles.badgesSection}>
              <View style={styles.badgesHeader}>
                <Text style={styles.badgesTitle}>ARCADE TROPHIES</Text>
                <Text style={styles.badgesCount}>
                  {stats.unlockedBadges.length} / {BADGES_CATALOG.length} Unlocked
                </Text>
              </View>
              <View style={styles.badgesGrid}>
                {BADGES_CATALOG.map((badge) => {
                  const unlocked = stats.unlockedBadges.includes(badge.id);
                  return (
                    <View
                      key={badge.id}
                      style={[
                        styles.badgeItem,
                        unlocked ? { borderColor: badge.color } : styles.lockedBadgeItem,
                      ]}
                    >
                      <Text style={[styles.badgeEmoji, !unlocked && styles.lockedEmoji]}>
                        {unlocked ? badge.emoji : '🔒'}
                      </Text>
                      <Text numberOfLines={1} style={[styles.badgeName, !unlocked && styles.lockedText]}>
                        {badge.title}
                      </Text>
                      <Text numberOfLines={2} style={styles.badgeDesc}>
                        {badge.description}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: colors.surfaceStrong,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {},
  kicker: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  avatarRing: {
    position: 'relative',
  },
  levelBadgeMini: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  levelBadgeMiniText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 16,
  },
  playerRank: {
    color: colors.neonCyan,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  statsInlineRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  streakPill: {
    backgroundColor: 'rgba(255, 46, 147, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  streakPillText: {
    color: colors.neonPink,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  gamesPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gamesPillText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  progressionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelLabel: {
    color: colors.neonAmber,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  xpCount: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  xpTrack: {
    height: 8,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.neonAmber,
    borderRadius: 4,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.25)',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  rewardIcon: {
    fontSize: 24,
  },
  rewardTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  rewardSubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
    marginTop: 2,
  },
  claimBtn: {
    backgroundColor: colors.neonAmber,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
  },
  claimBtnText: {
    color: '#1A1000',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 11,
  },
  claimedBtn: {
    backgroundColor: colors.surfaceHighlight,
  },
  claimedBtnText: {
    color: colors.textMuted,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prefIcon: {
    fontSize: 20,
  },
  prefTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  prefSubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(16, 231, 117, 0.16)',
    borderColor: colors.neonLime,
  },
  toggleBtnText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  toggleBtnTextActive: {
    color: colors.neonLime,
  },
  badgesSection: {
    marginTop: spacing.sm,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgesTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  badgesCount: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgeItem: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    marginBottom: 6,
  },
  lockedBadgeItem: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  lockedEmoji: {
    opacity: 0.6,
  },
  badgeName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    marginBottom: 2,
  },
  lockedText: {
    color: colors.textMuted,
  },
  badgeDesc: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
  },
});
