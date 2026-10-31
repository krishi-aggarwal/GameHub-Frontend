import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import colors from '../theme/colors';
import Logo from './Logo';
import Avatar from './Avatar';
import { playSfx, isSoundEnabled, toggleSound, subscribeSoundChange } from '../utils/soundEffects';
import {
  getGamerStats,
  calculateLevel,
  subscribeProgression,
} from '../utils/gamerProgression';

export default function GamerHudHeader({ user, onOpenProfile, onOpenDecider }) {
  const [stats, setStats] = useState(getGamerStats());
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  useEffect(() => {
    const unsubProgression = subscribeProgression((newStats) => setStats({ ...newStats }));
    const unsubSound = subscribeSoundChange((enabled) => setSoundOn(enabled));
    return () => {
      unsubProgression();
      unsubSound();
    };
  }, []);

  const { level } = calculateLevel(stats.xp);
  const displayName = user?.displayName || user?.username || 'Player';

  const handleToggleSound = async () => {
    const res = await toggleSound();
    setSoundOn(res);
  };

  return (
    <View style={styles.container}>
      <Logo size="medium" />

      <View style={styles.rightGroup}>
        {/* Sound FX Toggle Pill */}
        <Pressable
          onPress={handleToggleSound}
          style={[styles.pill, soundOn && styles.pillSoundOn]}
          hitSlop={6}
          accessibilityLabel="Toggle Sound Effects"
        >
          <Text style={styles.soundIcon}>{soundOn ? '🔊' : '🔇'}</Text>
        </Pressable>

        {/* Party Decider Mini Pill */}
        {onOpenDecider && (
          <Pressable
            onPress={() => { playSfx('click'); onOpenDecider(); }}
            style={[styles.pill, styles.pillDecider]}
            hitSlop={6}
            accessibilityLabel="Party Tools: Teams & Buzzer"
          >
            <Text style={styles.pillText}>👥</Text>
          </Pressable>
        )}

        {/* Gamer Status Pill (Level & Streak) */}
        <Pressable
          onPress={() => { playSfx('click'); if (onOpenProfile) onOpenProfile(); }}
          style={({ pressed }) => [styles.profilePill, pressed && styles.pressed]}
        >
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>L{level}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥{stats.streak || 1}</Text>
          </View>
          <View style={styles.avatarWrap}>
            <Avatar uri={user?.avatarUrl} name={displayName} size={34} />
            <View style={styles.onlineDot} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingTop: 4,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSoundOn: {
    borderColor: colors.neonLime,
    backgroundColor: 'rgba(16, 231, 117, 0.1)',
  },
  pillDecider: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  soundIcon: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 16,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 3,
    gap: 6,
  },
  levelBadge: {
    backgroundColor: colors.neonAmber,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelText: {
    color: '#1A1000',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 9,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 46, 147, 0.18)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streakText: {
    color: colors.neonPink,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neonLime,
    borderWidth: 2,
    borderColor: colors.surfaceStrong,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
