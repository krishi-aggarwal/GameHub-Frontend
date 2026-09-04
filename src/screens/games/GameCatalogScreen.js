
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
import Avatar from '../../components/Avatar';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

import { useAuth } from '../../context/AuthContext';

export default function GameCatalogScreen({ navigation }) {

  const { user } = useAuth();

  /*
   * Beta game.
   *
   * IMPORTANT:
   * Replace 1 with the actual Deception Around Us
   * gameId from PostgreSQL if it is different.
   */
  const deceptionGame = {
    gameId: 1,
    name: 'Deception Around Us',
    description:
      "Trust nobody. Read the room. Find the deception before it's too late.",
    minPlayers: 4,
    maxPlayers: 15,
    type: 'STRATEGY',
    status: 'ACTIVE',
  };

  const handleCreateRoom = () => {

    navigation.navigate('CreateRoom', {
      gameId: deceptionGame.gameId,
      gameName: deceptionGame.name,
    });

  };

  const handleJoinRoom = () => {

    navigation.navigate('JoinRoom');

  };

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={styles.header}>

          <View style={styles.headerContent}>

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
            onPress={() => navigation.navigate('Home')}
          >

            <Avatar
              uri={user?.avatarUrl}
              name={
                user?.displayName ||
                user?.username ||
                'U'
              }
              size={46}
            />

          </Pressable>

        </View>

        {/* FEATURED GAME */}
        <GlassCard style={styles.featuredCard}>

          {/* STATUS */}
          <View style={styles.statusRow}>

            <View style={styles.activeDot} />

            <Text style={styles.activeText}>
              AVAILABLE NOW
            </Text>

          </View>

          {/* GAME TITLE */}
          <Text style={styles.gameTitle}>
            {deceptionGame.name}
          </Text>

          <Text style={styles.gameDescription}>
            {deceptionGame.description}
          </Text>

          {/* GAME INFORMATION */}
          <View style={styles.infoRow}>

            <View style={styles.infoBlock}>

              <Text style={styles.infoLabel}>
                PLAYERS
              </Text>

              <Text style={styles.infoValue}>
                {deceptionGame.minPlayers} —{' '}
                {deceptionGame.maxPlayers}
              </Text>

            </View>

            <View style={styles.infoBlock}>

              <Text style={styles.infoLabel}>
                TYPE
              </Text>

              <Text style={styles.infoValue}>
                Strategy
              </Text>

            </View>

            <View style={styles.infoBlock}>

              <Text style={styles.infoLabel}>
                MODE
              </Text>

              <Text style={styles.infoValue}>
                Multiplayer
              </Text>

            </View>

          </View>

          {/* ACTIONS */}
          <View style={styles.actionRow}>

            <View style={styles.actionButton}>

              <GlassButton
                title="CREATE ROOM"
                onPress={handleCreateRoom}
              />

            </View>

            <View style={styles.actionButton}>

              <GlassButton
                title="JOIN ROOM"
                variant="secondary"
                onPress={handleJoinRoom}
              />

            </View>

          </View>

        </GlassCard>

        {/* TUTORIAL */}
        <GlassCard style={styles.tutorialCard}>

          <View style={styles.tutorialContent}>

            <Text style={styles.tutorialEyebrow}>
              NEW TO GAMEHUB?
            </Text>

            <Text style={styles.tutorialTitle}>
              Learn how it works
            </Text>

            <Text style={styles.tutorialText}>
              Learn the GameHub basics and how
              Deception Around Us is played.
            </Text>

          </View>

          <Pressable
            style={styles.learnButton}
            onPress={() =>
              navigation.navigate('Tutorial')
            }
          >

            <Text style={styles.learnText}>
              HOW TO PLAY →
            </Text>

          </Pressable>

        </GlassCard>

        {/* MORE GAMES */}
        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            More games
          </Text>

          <Text style={styles.sectionCount}>
            COMING SOON
          </Text>

        </View>

        {/* COMING SOON GAME 1 */}
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

        {/* COMING SOON GAME 2 */}
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

    maxWidth: 900,

    width: '100%',

    alignSelf: 'center',
  },

  header: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: spacing.xxl,
  },

  headerContent: {
    flex: 1,
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
    marginLeft: spacing.lg,

    borderRadius: 23,
  },

  featuredCard: {
    marginBottom: spacing.xxl,
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

  infoBlock: {
    flex: 1,
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

  actionRow: {
    flexDirection: 'row',

    gap: spacing.md,
  },

  actionButton: {
    flex: 1,
  },

  tutorialCard: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: spacing.xxxl,

    padding: spacing.lg,
  },

  tutorialContent: {
    flex: 1,

    paddingRight: spacing.md,
  },

  tutorialEyebrow: {
    color: colors.primary,

    fontFamily: 'Inter-SemiBold',

    fontSize: 10,

    letterSpacing: 1.2,

    marginBottom: 5,
  },

  tutorialTitle: {
    color: colors.text,

    fontFamily: 'Inter-Bold',

    fontSize: 16,
  },

  tutorialText: {
    color: colors.textSecondary,

    fontFamily: 'Inter',

    fontSize: 12,

    lineHeight: 18,

    marginTop: 4,
  },

  learnButton: {
    paddingHorizontal: 12,

    paddingVertical: 10,

    borderRadius: 12,

    backgroundColor: colors.surfaceStrong,

    borderWidth: 1,

    borderColor: colors.border,
  },

  learnText: {
    color: colors.primary,

    fontFamily: 'Inter-SemiBold',

    fontSize: 10,

    letterSpacing: 0.7,
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

