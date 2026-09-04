import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

export default function GameCatalogScreen({ navigation }) {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              GAMEHUB
            </Text>

            <Text style={styles.title}>
              Choose your game
            </Text>

            <Text style={styles.subtitle}>
              Pick a game and enter the room.
            </Text>
          </View>

          <Pressable
            style={styles.profileButton}
            onPress={() => {}}
          >
            <Text style={styles.profileText}>
              U
            </Text>
          </Pressable>
        </View>

        {/* Featured Game */}
        <GlassCard style={styles.featuredCard}>
          <View style={styles.statusRow}>
            <View style={styles.activeDot} />

            <Text style={styles.activeText}>
              AVAILABLE NOW
            </Text>
          </View>

          <Text style={styles.gameTitle}>
            Deception Around Us
          </Text>

          <Text style={styles.gameDescription}>
            Trust nobody. Read the room. Find the
            deception before it's too late.
          </Text>

          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>
                PLAYERS
              </Text>

              <Text style={styles.infoValue}>
                4 — 15
              </Text>
            </View>

            <View>
              <Text style={styles.infoLabel}>
                TYPE
              </Text>

              <Text style={styles.infoValue}>
                Strategy
              </Text>
            </View>

            <View>
              <Text style={styles.infoLabel}>
                MODE
              </Text>

              <Text style={styles.infoValue}>
                Multiplayer
              </Text>
            </View>
          </View>

          <GlassButton
            title="PLAY DECEPTION"
            onPress={() =>
              navigation.navigate('CreateRoom')
            }
          />
        </GlassCard>

        {/* Coming Soon */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            More games
          </Text>

          <Text style={styles.sectionCount}>
            COMING SOON
          </Text>
        </View>

        <GlassCard style={styles.lockedCard}>
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>
              🔒
            </Text>
          </View>

          <View style={styles.lockedContent}>
            <Text style={styles.lockedTitle}>
              Game Coming Soon
            </Text>

            <Text style={styles.lockedDescription}>
              New multiplayer experiences are being
              prepared for GameHub.
            </Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.lockedCard}>
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>
              🔒
            </Text>
          </View>

          <View style={styles.lockedContent}>
            <Text style={styles.lockedTitle}>
              More Games
            </Text>

            <Text style={styles.lockedDescription}>
              Stay tuned for the next challenge.
            </Text>
          </View>
        </GlassCard>
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
    marginBottom: spacing.xxl,
  },

  eyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },

  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 28,
  },

  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    marginTop: spacing.xs,
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileText: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },

  featuredCard: {
    marginBottom: spacing.xxxl,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },

  activeText: {
    color: colors.success,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
  },

  gameTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 26,
    marginBottom: spacing.sm,
  },

  gameDescription: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },

  infoLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },

  infoValue: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },

  sectionCount: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1,
  },

  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: 16,
    opacity: 0.7,
  },

  lockIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  lockText: {
    fontSize: 18,
  },

  lockedContent: {
    flex: 1,
  },

  lockedTitle: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },

  lockedDescription: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
  },
});