import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Avatar from './Avatar';
import colors from '../theme/colors';

const phaseLabels = {
  NIGHT: 'SABOTAGE / LIGHTS OUT 🌙',
  DAY: 'EMERGENCY DISCUSSION 📢',
  VOTING: 'VOTING TERMINAL 🗳️',
  GAME_OVER: 'MISSION OUTCOME 🏁',
};

const roleColors = {
  PREDATOR: { border: colors.amongRedBright, bg: 'rgba(255, 51, 68, 0.15)', text: colors.amongRedBright, label: 'IMPOSTOR' },
  DOCTOR: { border: colors.neonLime, bg: 'rgba(16, 231, 117, 0.15)', text: colors.neonLime, label: 'MEDIC' },
  DETECTIVE: { border: colors.neonCyan, bg: 'rgba(0, 240, 255, 0.15)', text: colors.neonCyan, label: 'SECURITY' },
  INNOCENT: { border: colors.amongBlueBright, bg: 'rgba(38, 115, 255, 0.15)', text: colors.amongBlueBright, label: 'CREWMATE' },
};

export default function GameHud({
  phase,
  roundNumber,
  players = [],
  username,
  displayName,
  avatarUrl,
  role,
  observer = false,
}) {
  const aliveCount = players.filter(
    (player) => player?.alive !== false && player?.left !== true
  ).length;
  const totalCount = players.filter(
    (player) => player?.left !== true
  ).length;

  const normalizedRole = String(role || '').toUpperCase();
  const roleConfig = roleColors[normalizedRole] || {
    border: colors.primary,
    bg: 'rgba(139, 92, 246, 0.15)',
    text: colors.primary,
    label: normalizedRole || 'PLAYER',
  };

  const shownName = displayName || username || 'Player';

  return (
    <View style={styles.tabletCard}>
      {/* Top Status Bar */}
      <View style={styles.topRow}>
        <View style={styles.phaseBlock}>
          <View style={[styles.pulseLight, phase === 'NIGHT' ? styles.pulseRed : styles.pulseGreen]} />
          <Text style={styles.phaseTitle}>
            {phaseLabels[phase] || 'SHIP STATUS: ACTIVE'}
          </Text>
        </View>

        <View style={styles.roundBadge}>
          <Text style={styles.roundBadgeText}>CYCLE {String(roundNumber || 1).padStart(2, '0')}</Text>
        </View>
      </View>

      {/* Identity & Alive Roster */}
      <View style={styles.bottomRow}>
        <View style={styles.identityWrap}>
          <View style={[styles.visorAvatarBorder, { borderColor: roleConfig.border }]}>
            <Avatar uri={avatarUrl} name={shownName} size={36} />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.roleSubtext}>
              {observer ? 'GHOST SPECTATOR 👻' : `YOUR ROLE: ${roleConfig.label}`}
            </Text>
            <Text numberOfLines={1} style={styles.crewName}>
              {shownName}
            </Text>
          </View>
        </View>

        <View style={styles.statsWrap}>
          <View style={styles.crewPill}>
            <View style={styles.crewDot} />
            <Text style={styles.crewText}>
              {aliveCount}/{totalCount} ALIVE
            </Text>
          </View>

          {!observer && (
            <View style={[styles.roleBadge, { borderColor: roleConfig.border, backgroundColor: roleConfig.bg }]}>
              <Text style={[styles.roleBadgeText, { color: roleConfig.text }]}>
                {roleConfig.label}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabletCard: {
    backgroundColor: 'rgba(13, 19, 34, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  phaseBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseLight: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pulseGreen: {
    backgroundColor: colors.neonLime,
  },
  pulseRed: {
    backgroundColor: colors.amongRedBright,
  },
  phaseTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  roundBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roundBadgeText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  visorAvatarBorder: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 1,
  },
  nameBlock: {
    flex: 1,
  },
  roleSubtext: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  crewName: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 13,
  },
  statsWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  crewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  crewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonLime,
  },
  crewText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 9,
    letterSpacing: 0.6,
  },
});
