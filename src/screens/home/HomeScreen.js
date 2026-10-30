
import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import Avatar from '../../components/Avatar';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

import {
  getGames,
} from '../../api/gameApi';

import {
  useAuth,
} from '../../context/AuthContext';

export default function HomeScreen({
  navigation,
}) {

  const {
    user,
    isAdmin,
  } = useAuth();

  const [featuredGame, setFeaturedGame] =
    useState(null);

  const [activeGameCount, setActiveGameCount] =
    useState(0);

  const [loadingGame, setLoadingGame] =
    useState(true);

  useEffect(() => {
    loadFeaturedGame();
  }, []);

  async function loadFeaturedGame() {

    try {

      setLoadingGame(true);

      const response =
        await getGames();

      const games =
        Array.isArray(response)
          ? response
          : response?.data || [];

      const activeGames =
        games.filter(
          (game) =>
            game.status === 'ACTIVE'
        );

      setActiveGameCount(
        activeGames.length
      );

      setFeaturedGame(
        activeGames.length > 0
          ? activeGames[0]
          : null
      );

    } catch (error) {

      console.error(
        'Failed to load featured game:',
        error
      );

      setFeaturedGame(null);
      setActiveGameCount(0);

    } finally {

      setLoadingGame(false);

    }
  }

  const displayName =
    user?.displayName ||
    user?.username ||
    'Player';

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.brand}>

            <Text style={styles.logo}>
              GAMEHUB
            </Text>

            <View style={styles.onlineRow}>

              <View style={styles.onlineDot} />

              <Text style={styles.onlineText}>
                MULTIPLAYER PLATFORM
              </Text>

            </View>

          </View>

          <Avatar
            name={displayName}
            size={46}
            avatarUrl={user?.avatarUrl}
          />

        </View>

        {/* WELCOME */}

        <GlassCard style={styles.welcomeCard}>

          <Text style={styles.welcomeEyebrow}>
            WELCOME BACK
          </Text>

          <Text style={styles.welcomeTitle}>
            Hey, {displayName}.
          </Text>

          <Text style={styles.welcomeText}>
            Your next multiplayer session is
            waiting. Pick a game or join your
            friends.
          </Text>

        </GlassCard>

        {/* PLAY SECTION */}

        <View style={styles.sectionHeader}>

          <View>

            <Text style={styles.sectionEyebrow}>
              PLAY
            </Text>

            <Text style={styles.sectionTitle}>
              Jump into a game
            </Text>

          </View>

          <Text style={styles.sectionMeta}>
            {activeGameCount}{' '}
            {activeGameCount === 1
              ? 'GAME'
              : 'GAMES'} AVAILABLE
          </Text>

        </View>

        {/* FEATURED GAME */}

        <GlassCard style={styles.featuredCard}>

          {loadingGame ? (

            <View style={styles.loadingContainer}>

              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

              <Text style={styles.loadingText}>
                Finding available games...
              </Text>

            </View>

          ) : featuredGame ? (

            <>

              <View style={styles.featuredHeader}>

                <View style={styles.featuredBadge}>

                  <Text style={styles.featuredBadgeText}>
                    FEATURED
                  </Text>

                </View>

                <Text style={styles.featuredType}>
                  {formatGameType(
                    featuredGame.type
                  )}
                </Text>

              </View>

              <Text style={styles.gameName}>
                {featuredGame.name}
              </Text>

              <Text
                numberOfLines={3}
                style={styles.gameDescription}
              >
                {featuredGame.description ||
                  'A multiplayer GameHub experience.'}
              </Text>

              <View style={styles.gameStats}>

                <View style={styles.stat}>

                  <Text style={styles.statValue}>
                    {featuredGame.minPlayers}–
                    {featuredGame.maxPlayers}
                  </Text>

                  <Text style={styles.statLabel}>
                    PLAYERS
                  </Text>

                </View>

                <View style={styles.statDivider} />

                <View style={styles.stat}>

                  <Text style={styles.statValue}>
                    LIVE
                  </Text>

                  <Text style={styles.statLabel}>
                    MULTIPLAYER
                  </Text>

                </View>

                <View style={styles.statDivider} />

                <View style={styles.stat}>

                  <Text style={styles.statValue}>
                    READY
                  </Text>

                  <Text style={styles.statLabel}>
                    TO PLAY
                  </Text>

                </View>

              </View>

              <GlassButton
                title="EXPLORE GAMES"
                onPress={() =>
                  navigation.navigate(
                    'GameCatalog'
                  )
                }
              />

            </>

          ) : (

            <View style={styles.emptyContainer}>

              <Text style={styles.emptyTitle}>
                No games available yet
              </Text>

              <Text style={styles.emptyText}>
                New multiplayer games will appear
                here when they are ready to play.
              </Text>

              <GlassButton
                title="OPEN GAME LIBRARY"
                variant="secondary"
                onPress={() =>
                  navigation.navigate(
                    'GameCatalog'
                  )
                }
              />

            </View>

          )}

        </GlassCard>

        {/* QUICK PLAY */}

        <View style={styles.sectionHeader}>

          <View>

            <Text style={styles.sectionEyebrow}>
              QUICK PLAY
            </Text>

            <Text style={styles.sectionTitle}>
              Start something
            </Text>

          </View>

        </View>

        <View style={styles.quickActions}>

          <GlassCard style={styles.quickCard}>

            <View style={styles.quickIcon}>
              <Text style={styles.quickIconText}>
                +
              </Text>
            </View>

            <Text style={styles.quickTitle}>
              Create a room
            </Text>

            <Text style={styles.quickText}>
              Choose a game and host your own
              multiplayer session.
            </Text>

            <GlassButton
              title="CREATE ROOM"
              onPress={() =>
                navigation.navigate(
                  'GameCatalog'
                )
              }
            />

          </GlassCard>

          <GlassCard style={styles.quickCard}>

            <View style={styles.quickIcon}>
              <Text style={styles.quickIconText}>
                #
              </Text>
            </View>

            <Text style={styles.quickTitle}>
              Join a room
            </Text>

            <Text style={styles.quickText}>
              Have a room code? Jump straight
              into your friend's game.
            </Text>

            <GlassButton
              title="JOIN ROOM"
              variant="secondary"
              onPress={() =>
                navigation.navigate(
                  'JoinRoom'
                )
              }
            />

          </GlassCard>

        </View>

        {/* GAME LIBRARY */}

        <GlassCard style={styles.libraryCard}>

          <View style={styles.libraryContent}>

            <Text style={styles.libraryEyebrow}>
              GAME LIBRARY
            </Text>

            <Text style={styles.libraryTitle}>
              Explore GameHub
            </Text>

            <Text style={styles.libraryText}>
              Browse available games, discover
              what's coming next and find your
              next multiplayer experience.
            </Text>

          </View>

          <GlassButton
            title="VIEW ALL GAMES"
            variant="secondary"
            onPress={() =>
              navigation.navigate(
                'GameCatalog'
              )
            }
          />

        </GlassCard>

        {/* ADMIN */}

        {isAdmin && (

          <View style={styles.adminSection}>

            <Text style={styles.sectionEyebrow}>
              ADMIN
            </Text>

            <GlassCard style={styles.adminCard}>

              <View style={styles.adminHeader}>

                <View>

                  <Text style={styles.adminTitle}>
                    Game Management
                  </Text>

                  <Text style={styles.adminText}>
                    Manage the games available
                    across GameHub.
                  </Text>

                </View>

                <View style={styles.adminBadge}>

                  <Text style={styles.adminBadgeText}>
                    ADMIN
                  </Text>

                </View>

              </View>

              <GlassButton
                title="MANAGE GAMES"
                onPress={() =>
                  navigation.navigate(
                    'AdminGames'
                  )
                }
              />

            </GlassCard>

          </View>

        )}

        {/* HELP */}

        <GlassCard style={styles.helpCard}>

          <View style={styles.helpContent}>

            <Text style={styles.helpEyebrow}>
              NEED A HAND?
            </Text>

            <Text style={styles.helpTitle}>
              New to GameHub?
            </Text>

            <Text style={styles.helpText}>
              Learn how rooms work, how multiplayer
              games are structured and how to get
              started.
            </Text>

          </View>

          <GlassButton
            title="HOW IT WORKS"
            variant="secondary"
            onPress={() =>
              navigation.navigate(
                'Tutorial'
              )
            }
          />

        </GlassCard>

      </ScrollView>

    </Screen>
  );
}

function formatGameType(type) {

  if (!type) {
    return 'GAME';
  }

  return type
    .toLowerCase()
    .replace(
      /^\w/,
      (character) =>
        character.toUpperCase()
    );
}

const styles = StyleSheet.create({

  container: {
    padding: spacing.xl,
    paddingBottom: 50,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },

  brand: {
    flex: 1,
  },

  logo: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 25,
    letterSpacing: 2,
  },

  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },

  onlineText: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 8,
    letterSpacing: 1,
  },

  /* WELCOME */

  welcomeCard: {
    marginBottom: spacing.xxl,
  },

  welcomeEyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  welcomeTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 27,
  },

  welcomeText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  /* SECTION */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },

  sectionEyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },

  sectionMeta: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 8,
    letterSpacing: 0.8,
  },

  /* FEATURED */

  featuredCard: {
    marginBottom: spacing.xxl,
  },

  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  featuredBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor:
      'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: colors.primary,
  },

  featuredBadgeText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    letterSpacing: 1,
  },

  featuredType: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    letterSpacing: 0.8,
  },

  gameName: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 23,
    marginBottom: 7,
  },

  gameDescription: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  gameStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  stat: {
    flex: 1,
  },

  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
  },

  statValue: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    marginBottom: 3,
  },

  statLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 7,
    letterSpacing: 0.7,
  },

  /* LOADING */

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 25,
  },

  loadingText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    marginTop: 8,
  },

  /* EMPTY */

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  emptyTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 6,
  },

  emptyText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  /* QUICK PLAY */

  quickActions: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },

  quickCard: {
    padding: spacing.lg,
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  quickIconText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },

  quickTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 5,
  },

  quickText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },

  /* LIBRARY */

  libraryCard: {
    marginBottom: spacing.xxl,
  },

  libraryContent: {
    marginBottom: spacing.lg,
  },

  libraryEyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  libraryTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    marginBottom: 6,
  },

  libraryText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
  },

  /* ADMIN */

  adminSection: {
    marginBottom: spacing.xxl,
  },

  adminCard: {
    marginTop: spacing.md,
  },

  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },

  adminTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 5,
  },

  adminText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
  },

  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },

  adminBadgeText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    letterSpacing: 0.8,
  },

  /* HELP */

  helpCard: {
    marginBottom: spacing.xl,
  },

  helpContent: {
    marginBottom: spacing.lg,
  },

  helpEyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  helpTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 5,
  },

  helpText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
  },

});
