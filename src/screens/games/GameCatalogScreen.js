import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
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

import {
  getGames,
} from '../../api/gameApi';

import {
  getApiErrorMessage,
} from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';

export default function GameCatalogScreen({
  navigation,
}) {

  const { user } = useAuth();
  const { showToast } = useToast();

  const [games, setGames] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadGames = useCallback(
    async (isRefresh = false) => {

      try {

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data =
          await getGames();

        const gameList =
          Array.isArray(data)
            ? data
            : data?.data || [];

        setGames(gameList);

      } catch (error) {

        console.error(
          'Failed to load games:',
          error
        );

        showToast(
          getApiErrorMessage(error, 'Could not load the GameHub catalog.')
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }
    },
    []
  );

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const activeGames =
    games.filter(
      (game) =>
        game.status === 'ACTIVE'
    );

  const comingSoonGames =
    games.filter(
      (game) =>
        game.status === 'COMING_SOON'
    );

  const disabledGames =
    games.filter(
      (game) =>
        game.status === 'DISABLED'
    );

  const handleCreateRoom = (
    game
  ) => {

    navigation.navigate(
      'CreateRoom',
      {
        gameId: game.gameId,
        gameName: game.name,
      }
    );
  };

  const handleJoinRoom = () => {
    navigation.navigate('JoinRoom');
  };

  const renderGameCard = (
    game,
    featured = false
  ) => {

    const isActive =
      game.status === 'ACTIVE';

    const isDisabled =
      game.status === 'DISABLED';

    return (
      <GlassCard
        key={game.gameId}
        style={
          featured
            ? styles.featuredCard
            : styles.gameCard
        }
      >

        {/* GAME HEADER */}

        <View style={styles.gameHeader}>

          <View style={styles.gameHeaderLeft}>

            <View
              style={[
                styles.statusDot,
                isActive
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                isActive
                  ? styles.activeText
                  : styles.inactiveText,
              ]}
            >
              {isActive
                ? 'AVAILABLE'
                : game.status === 'COMING_SOON'
                  ? 'COMING SOON'
                  : 'UNAVAILABLE'}
            </Text>

          </View>

          <Text style={styles.gameType}>
            {formatGameType(game.gameType || game.type)}
          </Text>

        </View>

        {/* TITLE */}

        <Text
          style={
            featured
              ? styles.gameTitle
              : styles.gameCardTitle
          }
        >
          {game.name}
        </Text>

        <Text
          numberOfLines={featured ? 3 : 2}
          style={
            featured
              ? styles.gameDescription
              : styles.gameCardDescription
          }
        >
          {game.description}
        </Text>

        {/* GAME STATS */}

        <View style={styles.statsContainer}>

          <View style={styles.stat}>

            <Text style={styles.statValue}>
              {game.minPlayers}–{game.maxPlayers}
            </Text>

            <Text style={styles.statLabel}>
              PLAYERS
            </Text>

          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>

            <Text style={styles.statValue}>
              {formatGameType(game.gameType || game.type)}
            </Text>

            <Text style={styles.statLabel}>
              CATEGORY
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

        </View>

        {/* ACTION */}

        {isActive ? (
          <View style={styles.gameActions}>
            <GlassButton
              title={
                featured
                  ? 'CREATE A ROOM'
                  : 'PLAY ONLINE'
              }
              onPress={() =>
                handleCreateRoom(game)
              }
            />
            <GlassButton
              title="PASS & PLAY"
              variant="secondary"
              onPress={() => navigation.navigate('PassAndPlay', {
                gameSlug: game.slug,
              })}
            />
          </View>

        ) : (

          <View style={styles.unavailableBadge}>

            <Text style={styles.unavailableText}>
              {isDisabled
                ? 'CURRENTLY UNAVAILABLE'
                : 'COMING SOON'}
            </Text>

          </View>

        )}

      </GlassCard>
    );
  };

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.headerTop}>

            <Pressable
              style={styles.backButton}
              onPress={() =>
                navigation.goBack()
              }
            >

              <Text style={styles.backArrow}>
                ‹
              </Text>

              <Text style={styles.backText}>
                BACK
              </Text>

            </Pressable>

            <Pressable
              style={styles.profileButton}
              onPress={() =>
                navigation.navigate('Home')
              }
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

          <View style={styles.headerContent}>

            <Text style={styles.eyebrow}>
              GAMEHUB
            </Text>

            <Text style={styles.title}>
              Game Library
            </Text>

            <Text style={styles.subtitle}>
              Discover games, create a room,
              and play together.
            </Text>

          </View>

        </View>

        {/* LOADING */}

        {loading ? (

          <View style={styles.loadingContainer}>

            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading GameHub...
            </Text>

          </View>

        ) : (

          <>

            {/* QUICK ACTIONS */}

            <View style={styles.quickActions}>

              <Pressable
                style={styles.quickAction}
                onPress={handleJoinRoom}
              >

                <Text style={styles.quickActionLabel}>
                  JOIN
                </Text>

                <Text style={styles.quickActionTitle}>
                  Enter a room
                </Text>

                <Text style={styles.quickActionArrow}>
                  →
                </Text>

              </Pressable>

              <Pressable
                style={styles.quickAction}
                onPress={() =>
                  navigation.navigate('Tutorial')
                }
              >

                <Text style={styles.quickActionLabel}>
                  GUIDE
                </Text>

                <Text style={styles.quickActionTitle}>
                  How GameHub works
                </Text>

                <Text style={styles.quickActionArrow}>
                  →
                </Text>

              </Pressable>

            </View>

            {/* ACTIVE GAMES */}

            {activeGames.length > 0 && (

              <View style={styles.gamesSection}>

                <View style={styles.sectionHeader}>

                  <View>

                    <Text style={styles.sectionEyebrow}>
                      PLAY NOW
                    </Text>

                    <Text style={styles.sectionTitle}>
                      Available games
                    </Text>

                  </View>

                  <Text style={styles.gameCount}>
                    {activeGames.length}{' '}
                    {activeGames.length === 1
                      ? 'GAME'
                      : 'GAMES'}
                  </Text>

                </View>

                {activeGames.map(
                  (game, index) =>
                    renderGameCard(
                      game,
                      index === 0
                    )
                )}

              </View>
            )}

            {/* COMING SOON */}

            {comingSoonGames.length > 0 && (

              <View style={styles.gamesSection}>

                <View style={styles.sectionHeader}>

                  <View>

                    <Text style={styles.sectionEyebrow}>
                      ON THE WAY
                    </Text>

                    <Text style={styles.sectionTitle}>
                      More games
                    </Text>

                  </View>

                  <Text style={styles.gameCount}>
                    {comingSoonGames.length}{' '}
                    COMING
                  </Text>

                </View>

                {comingSoonGames.map(
                  (game) => (

                    <GlassCard
                      key={game.gameId}
                      style={styles.lockedCard}
                    >

                      <View style={styles.lockIcon}>

                        <Text style={styles.lockText}>
                          +
                        </Text>

                      </View>

                      <View style={styles.lockedContent}>

                        <Text style={styles.lockedTitle}>
                          {game.name}
                        </Text>

                        <Text
                          numberOfLines={2}
                          style={styles.lockedDescription}
                        >
                          {game.description}
                        </Text>

                      </View>

                      <Text style={styles.comingSoonLabel}>
                        SOON
                      </Text>

                    </GlassCard>

                  )
                )}

              </View>
            )}

            {/* DISABLED */}

            {disabledGames.length > 0 && (

              <View style={styles.gamesSection}>

                <View style={styles.sectionHeader}>

                  <View>

                    <Text style={styles.sectionEyebrow}>
                      GAME STATUS
                    </Text>

                    <Text style={styles.sectionTitle}>
                      Unavailable
                    </Text>

                  </View>

                </View>

                {disabledGames.map(
                  (game) => (

                    <GlassCard
                      key={game.gameId}
                      style={styles.lockedCard}
                    >

                      <View style={styles.lockIcon}>

                        <Text style={styles.lockText}>
                          —
                        </Text>

                      </View>

                      <View style={styles.lockedContent}>

                        <Text style={styles.lockedTitle}>
                          {game.name}
                        </Text>

                        <Text style={styles.lockedDescription}>
                          This game is currently unavailable.
                        </Text>

                      </View>

                    </GlassCard>

                  )
                )}

              </View>
            )}

            {/* EMPTY */}

            {games.length === 0 && (

              <GlassCard style={styles.emptyCard}>

                <Text style={styles.emptyEyebrow}>
                  GAME LIBRARY
                </Text>

                <Text style={styles.emptyTitle}>
                  Your library is empty
                </Text>

                <Text style={styles.emptyText}>
                  Games added to GameHub will appear
                  here.
                </Text>

                <GlassButton
                  title={
                    refreshing
                      ? 'REFRESHING...'
                      : 'REFRESH LIBRARY'
                  }
                  onPress={() =>
                    loadGames(true)
                  }
                  disabled={refreshing}
                />

              </GlassCard>

            )}

          </>

        )}

      </ScrollView>

    </Screen>
  );
}

function formatGameType(type) {

  if (!type) {
    return 'Game';
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
    marginBottom: spacing.xl,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  headerContent: {
    flex: 1,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
  },

  backArrow: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 28,
    marginRight: 6,
  },

  backText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
  },

  eyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 6,
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
    lineHeight: 19,
    marginTop: 6,
  },

  profileButton: {
    borderRadius: 23,
  },

  /* LOADING */

  loadingContainer: {
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: spacing.md,
  },

  /* QUICK ACTIONS */

  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },

  quickAction: {
    flex: 1,
    minHeight: 88,

    padding: spacing.md,

    borderRadius: 16,

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,

    justifyContent: 'space-between',
  },

  quickActionLabel: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
  },

  quickActionTitle: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    marginTop: 7,
    paddingRight: 18,
  },

  quickActionArrow: {
    position: 'absolute',
    right: 14,
    bottom: 12,

    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },

  /* SECTIONS */

  gamesSection: {
    marginBottom: spacing.xxl,
  },

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
    fontSize: 19,
  },

  gameCount: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    letterSpacing: 1,
  },

  /* GAME CARDS */

  featuredCard: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },

  gameCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },

  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  gameActions: {
    gap: spacing.sm,
  },

  gameHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  activeDot: {
    backgroundColor: colors.success,
  },

  inactiveDot: {
    backgroundColor: colors.textMuted,
  },

  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
  },

  activeText: {
    color: colors.success,
  },

  inactiveText: {
    color: colors.textMuted,
  },

  gameType: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    letterSpacing: 0.8,
  },

  gameTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 26,
    marginBottom: spacing.sm,
  },

  gameCardTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: spacing.xs,
  },

  gameDescription: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  gameCardDescription: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },

  /* GAME STATS */

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,

    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  stat: {
    flex: 1,
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },

  statValue: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    marginBottom: 3,
  },

  statLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 8,
    letterSpacing: 0.8,
  },

  /* UNAVAILABLE */

  unavailableBadge: {
    alignSelf: 'flex-start',

    paddingHorizontal: 11,
    paddingVertical: 8,

    borderRadius: 10,

    backgroundColor: colors.surfaceStrong,

    borderWidth: 1,
    borderColor: colors.border,
  },

  unavailableText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },

  /* LOCKED GAMES */

  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: spacing.md,
    marginBottom: spacing.sm,

    opacity: 0.78,
  },

  lockIcon: {
    width: 44,
    height: 44,

    borderRadius: 13,

    backgroundColor: colors.surfaceStrong,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: spacing.md,
  },

  lockText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },

  lockedContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  lockedTitle: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 3,
  },

  lockedDescription: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 17,
  },

  comingSoonLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    letterSpacing: 0.8,
  },

  /* EMPTY */

  emptyCard: {
    marginTop: spacing.md,
  },

  emptyEyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.3,
    marginBottom: 6,
  },

  emptyTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 6,
  },

  emptyText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },

});