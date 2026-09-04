import React from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

export default function ObserverScreen({
  navigation,
  route,
}) {

  const {
    roundNumber = 2,
    sessionId = 'demo-session',
  } = route?.params || {};

  const messages = [
    {
      id: 1,
      name: 'Player 02',
      message: 'I think Player 04 is suspicious.',
    },
    {
      id: 2,
      name: 'Player 04',
      message: 'That makes no sense.',
    },
    {
      id: 3,
      name: 'Player 03',
      message: 'We need to look at the voting pattern.',
    },
  ];

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={styles.header}>

          <View>
            <Text style={styles.eyebrow}>
              DECEPTION AROUND US
            </Text>

            <Text style={styles.title}>
              OBSERVER
            </Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              DEAD
            </Text>
          </View>

        </View>

        {/* ELIMINATION */}
        <GlassCard style={styles.eliminatedCard}>

          <Text style={styles.icon}>
            ◈
          </Text>

          <Text style={styles.eliminatedTitle}>
            YOU HAVE BEEN ELIMINATED
          </Text>

          <Text style={styles.eliminatedText}>
            Your role remains hidden from the other
            players. You can continue observing the game.
          </Text>

        </GlassCard>

        {/* NIGHT ACTIVITY */}
        <GlassCard style={styles.activityCard}>

          <Text style={styles.sectionLabel}>
            NIGHT {String(roundNumber).padStart(2, '0')}
          </Text>

          <Text style={styles.activityTitle}>
            NIGHT ACTIVITY
          </Text>

          <View style={styles.activityRow}>
            <View style={styles.dot} />

            <Text style={styles.activityText}>
              A player has completed their night action.
            </Text>
          </View>

          <View style={styles.activityRow}>
            <View style={styles.dot} />

            <Text style={styles.activityText}>
              Waiting for morning...
            </Text>
          </View>

        </GlassCard>

        {/* DISCUSSION */}
        <View style={styles.sectionHeader}>

          <View>
            <Text style={styles.sectionTitle}>
              DISCUSSION
            </Text>

            <Text style={styles.sectionSubtitle}>
              You can read, but cannot participate.
            </Text>
          </View>

        </View>

        <GlassCard>

          {messages.map((item) => (
            <View
              key={item.id}
              style={styles.messageRow}
            >

              <Avatar
                name={item.name}
                size={38}
              />

              <View style={styles.messageContent}>

                <Text style={styles.messageName}>
                  {item.name}
                </Text>

                <Text style={styles.messageText}>
                  {item.message}
                </Text>

              </View>

            </View>
          ))}

        </GlassCard>

        {/* DISABLED CHAT */}
        <View style={styles.disabledChat}>

          <Text style={styles.disabledText}>
            Chat disabled — you are observing the game.
          </Text>

        </View>

      </ScrollView>

    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    padding: spacing.xl,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  eyebrow: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 28,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: colors.danger,
  },

  badgeText: {
    color: colors.danger,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },

  eliminatedCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  icon: {
    color: colors.danger,
    fontSize: 26,
    marginBottom: 10,
  },

  eliminatedTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 8,
  },

  eliminatedText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  activityCard: {
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  activityTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 8,
  },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
    marginRight: 10,
  },

  activityText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
  },

  sectionHeader: {
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 4,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },

  messageContent: {
    flex: 1,
    marginLeft: 12,
  },

  messageName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    marginBottom: 4,
  },

  messageText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
  },

  disabledChat: {
    marginTop: spacing.md,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  disabledText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    textAlign: 'center',
  },

});