import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import GamerHudHeader from '../../components/GamerHudHeader';
import GamerProfileModal from '../../components/GamerProfileModal';
import PartyDeciderModal from '../../components/PartyDeciderModal';
import ConfettiOverlay from '../../components/ConfettiOverlay';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { getGames } from '../../api/gameApi';
import { useAuth } from '../../context/AuthContext';
import { playSfx } from '../../utils/soundEffects';
import {
  getGamerStats,
  calculateLevel,
  getRankTitle,
  recordRoomHosted,
} from '../../utils/gamerProgression';

const FILTER_ALL = 'ALL';
const FILTER_DEDUCTION = 'SOCIAL_DEDUCTION';
const FILTER_PARTY = 'PARTY';
const FILTER_LOCAL = 'LOCAL';

export default function HomeScreen({ navigation }) {
  const { user, isAdmin } = useAuth();

  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [featuredGame, setFeaturedGame] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

  // Modals & Celebrations
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [deciderModalVisible, setDeciderModalVisible] = useState(false);
  const [deciderTab, setDeciderTab] = useState('dice');
  const [confettiActive, setConfettiActive] = useState(false);

  // Gamer stats
  const [gamerStats, setGamerStats] = useState(getGamerStats());

  useEffect(() => {
    loadGamesList();
  }, []);

  async function loadGamesList() {
    try {
      setLoadingGames(true);
      const response = await getGames();
      const list = Array.isArray(response) ? response : response?.data || [];
      const activeOnly = list.filter((g) => g.status === 'ACTIVE');

      setGames(activeOnly);
      if (activeOnly.length > 0) {
        setFeaturedGame(activeOnly[0]);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
      setGames([]);
      setFeaturedGame(null);
    } finally {
      setLoadingGames(false);
    }
  }

  const displayName = user?.displayName || user?.username || 'Player';
  const { level, progressPercent, currentLevelXp } = calculateLevel(gamerStats.xp);
  const rankTitle = getRankTitle(level);

  // Filtered games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const name = (game.name || '').toLowerCase();
      const desc = (game.description || '').toLowerCase();
      const type = (game.type || '').toUpperCase();
      const q = search.trim().toLowerCase();

      const matchesSearch = !q || name.includes(q) || desc.includes(q);
      if (!matchesSearch) return false;

      if (activeFilter === FILTER_DEDUCTION) {
        return type.includes('DECEPTION') || type.includes('MAFIA') || type.includes('DEDUCTION');
      }
      if (activeFilter === FILTER_PARTY) {
        return type.includes('FISHPOND') || type.includes('PARTY') || type.includes('CASUAL');
      }
      if (activeFilter === FILTER_LOCAL) {
        return true; // Pass and play applies to all
      }
      return true;
    });
  }, [games, search, activeFilter]);

  const handleOpenCreateRoom = (game) => {
    playSfx('start');
    recordRoomHosted();
    if (game?.gameId) {
      navigation.navigate('CreateRoom', {
        gameId: game.gameId,
        gameName: game.name,
      });
    } else {
      navigation.navigate('GameCatalog');
    }
  };

  const handleOpenJoinRoom = () => {
    playSfx('click');
    navigation.navigate('JoinRoom');
  };

  const handleOpenPassAndPlay = (slug = 'deception-around-us') => {
    playSfx('start');
    navigation.navigate('PassAndPlay', { gameSlug: slug });
  };

  const openDecider = (tab = 'teams') => {
    setDeciderTab(tab);
    setDeciderModalVisible(true);
  };

  const triggerCelebration = () => {
    setConfettiActive(true);
    playSfx('fanfare');
  };

  return (
    <Screen>
      <ConfettiOverlay active={confettiActive} onFinished={() => setConfettiActive(false)} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* GAMER HUD HEADER */}
        <GamerHudHeader
          user={user}
          onOpenProfile={() => setProfileModalVisible(true)}
          onOpenDecider={() => openDecider('dice')}
        />

        {/* HERO ARENA BANNER */}
        <View style={styles.heroBanner}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <View style={styles.heroKickerRow}>
              <View style={styles.livePulseDot} />
              <Text style={styles.heroKicker}>MULTIPLAYER ARENA ONLINE</Text>
            </View>

            <Text style={styles.heroTitle}>
              Welcome, <Text style={styles.heroTitleHighlight}>{displayName}</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Assemble your crew, dive into social deduction, or settle friendly rivalries.
            </Text>

            {/* Mini XP Quick Bar */}
            <Pressable
              onPress={() => setProfileModalVisible(true)}
              style={styles.heroXpBar}
            >
              <View style={styles.heroXpInfo}>
                <Text style={styles.heroXpLabel}>{rankTitle}</Text>
                <Text style={styles.heroXpVal}>LVL {level} · {currentLevelXp}/250 XP</Text>
              </View>
              <View style={styles.heroXpTrack}>
                <View style={[styles.heroXpFill, { width: `${progressPercent}%` }]} />
              </View>
            </Pressable>

            {/* Hero Quick CTA */}
            <View style={styles.heroButtonsRow}>
              <GlassButton
                title="HOST A ROOM 🚀"
                variant="primary"
                size="medium"
                onPress={() => handleOpenCreateRoom(featuredGame)}
                style={styles.heroMainBtn}
              />
              <GlassButton
                title="ENTER CODE 🎟️"
                variant="secondary"
                size="medium"
                onPress={handleOpenJoinRoom}
                style={styles.heroSecBtn}
              />
            </View>
          </View>

          {/* Playful Floating Game Elements */}
          <View style={styles.heroArtSide}>
            <Text style={styles.heroBigEmoji}>👾</Text>
            <View style={styles.heroSparkleOne}><Text style={styles.sparkleText}>✨</Text></View>
            <View style={styles.heroSparkleTwo}><Text style={styles.sparkleText}>⚡</Text></View>
          </View>
        </View>

        {/* ARCADE PARTY UTILITIES ROW */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PARTY TOOLBOX 🕹️</Text>
          <Text style={styles.sectionMeta}>INSTANT UTILITIES</Text>
        </View>

        <View style={styles.toolboxGrid}>
          <Pressable
            onPress={() => openDecider('teams')}
            style={({ pressed }) => [styles.toolboxCard, styles.teamsCard, pressed && styles.cardPressed]}
          >
            <Text style={styles.toolboxEmoji}>👥</Text>
            <Text style={styles.toolboxTitle}>Divide Teams</Text>
            <Text style={styles.toolboxDesc}>Random squad shuffler</Text>
          </Pressable>

          <Pressable
            onPress={() => openDecider('buzzer')}
            style={({ pressed }) => [styles.toolboxCard, styles.buzzerCard, pressed && styles.cardPressed]}
          >
            <Text style={styles.toolboxEmoji}>🚨</Text>
            <Text style={styles.toolboxTitle}>Team Buzzer</Text>
            <Text style={styles.toolboxDesc}>First to buzz lockout</Text>
          </Pressable>

          <Pressable
            onPress={() => openDecider('coin')}
            style={({ pressed }) => [styles.toolboxCard, styles.coinCard, pressed && styles.cardPressed]}
          >
            <Text style={styles.toolboxEmoji}>🪙</Text>
            <Text style={styles.toolboxTitle}>Coin Toss</Text>
            <Text style={styles.toolboxDesc}>Heads or Tails</Text>
          </Pressable>

          <Pressable
            onPress={() => openDecider('picker')}
            style={({ pressed }) => [styles.toolboxCard, styles.pickerCard, pressed && styles.cardPressed]}
          >
            <Text style={styles.toolboxEmoji}>🎯</Text>
            <Text style={styles.toolboxTitle}>Turn Picker</Text>
            <Text style={styles.toolboxDesc}>Select who starts</Text>
          </Pressable>
        </View>

        {/* FEATURED GAME SPOTLIGHT */}
        {featuredGame && (
          <View style={styles.spotlightSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>GAME OF THE DAY ⭐</Text>
              <Pressable onPress={() => navigation.navigate('GameCatalog')}>
                <Text style={styles.seeAllText}>All Games ↗</Text>
              </Pressable>
            </View>

            <GlassCard glow="purple" style={styles.featuredGameCard}>
              <View style={styles.featuredTopRow}>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>FEATURED SHOWDOWN</Text>
                </View>
                <Text style={styles.featuredCapacity}>
                  👥 {featuredGame.minPlayers || 4}–{featuredGame.maxPlayers || 15} Players
                </Text>
              </View>

              <Text style={styles.featuredGameTitle}>{featuredGame.name}</Text>
              <Text style={styles.featuredGameDesc} numberOfLines={3}>
                {featuredGame.description || 'A tense multiplayer experience of deduction and survival.'}
              </Text>

              {/* Roles Spotlight Pills */}
              <View style={styles.roleBadgesRow}>
                <View style={[styles.roleBadge, { borderColor: colors.neonPink }]}>
                  <Text style={[styles.roleBadgeText, { color: colors.neonPink }]}>🐺 PREDATOR</Text>
                </View>
                <View style={[styles.roleBadge, { borderColor: colors.neonCyan }]}>
                  <Text style={[styles.roleBadgeText, { color: colors.neonCyan }]}>🕵️ DETECTIVE</Text>
                </View>
                <View style={[styles.roleBadge, { borderColor: colors.neonLime }]}>
                  <Text style={[styles.roleBadgeText, { color: colors.neonLime }]}>🩺 DOCTOR</Text>
                </View>
                <View style={[styles.roleBadge, { borderColor: colors.primary }]}>
                  <Text style={[styles.roleBadgeText, { color: colors.primary }]}>🕊️ INNOCENT</Text>
                </View>
              </View>

              <View style={styles.featuredActionsRow}>
                <GlassButton
                  title="START ROOM 🎮"
                  variant="primary"
                  onPress={() => handleOpenCreateRoom(featuredGame)}
                  style={styles.featuredActionBtn}
                />
                <GlassButton
                  title="PASS & PLAY 📱"
                  variant="secondary"
                  onPress={() => handleOpenPassAndPlay('deception-around-us')}
                  style={styles.featuredActionBtn}
                />
              </View>
            </GlassCard>
          </View>
        )}

        {/* GAME LIBRARY & LIVE FILTERS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>GAME CORNER 🎲</Text>
          <Text style={styles.sectionMeta}>{filteredGames.length} GAMES READY</Text>
        </View>

        {/* Live Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search games, genres, roles..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.clearSearchText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: FILTER_ALL, label: '✦ All Games' },
            { id: FILTER_DEDUCTION, label: '🕵️ Social Deduction' },
            { id: FILTER_PARTY, label: '🌊 Chill & Party' },
            { id: FILTER_LOCAL, label: '📱 Pass & Play' },
          ].map((cat) => {
            const active = activeFilter === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => { playSfx('click'); setActiveFilter(cat.id); }}
                style={[styles.filterChip, active && styles.activeFilterChip]}
              >
                <Text style={[styles.filterChipText, active && styles.activeFilterChipText]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Games List */}
        {loadingGames ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Summoning games...</Text>
          </View>
        ) : filteredGames.length > 0 ? (
          <View style={styles.gamesList}>
            {filteredGames.map((game, index) => {
              const emojis = ['🕵️', '🐟', '🎲', '🧩', '🏆', '🎯'];
              const emoji = emojis[index % emojis.length];

              return (
                <GlassCard key={game.gameId || game._id || index} style={styles.gameRowCard}>
                  <View style={styles.gameCardTop}>
                    <View style={styles.gameAvatar}>
                      <Text style={styles.gameAvatarEmoji}>{emoji}</Text>
                    </View>
                    <View style={styles.gameDetails}>
                      <Text style={styles.gameName}>{game.name}</Text>
                      <Text numberOfLines={2} style={styles.gameDesc}>
                        {game.description || 'Fast-paced multiplayer entertainment.'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gameCardBottom}>
                    <View style={styles.gamePillsRow}>
                      <View style={styles.gameMetaPill}>
                        <Text style={styles.gameMetaText}>👥 {game.minPlayers || 2}–{game.maxPlayers || 15}P</Text>
                      </View>
                      <View style={styles.gameMetaPill}>
                        <Text style={styles.gameMetaText}>⚡ LIVE</Text>
                      </View>
                    </View>

                    <View style={styles.gameCardButtons}>
                      <GlassButton
                        title="HOST"
                        variant="cyan"
                        size="small"
                        onPress={() => handleOpenCreateRoom(game)}
                      />
                    </View>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyGamesBox}>
            <Text style={styles.emptyGamesEmoji}>🛸</Text>
            <Text style={styles.emptyGamesTitle}>No games found</Text>
            <Text style={styles.emptyGamesSubtitle}>Try adjusting your search terms or filters.</Text>
            <GlassButton
              title="CLEAR FILTERS"
              variant="secondary"
              size="small"
              onPress={() => { setSearch(''); setActiveFilter(FILTER_ALL); }}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* ADMIN PANEL SHORTCUT */}
        {isAdmin && (
          <Pressable
            onPress={() => navigation.navigate('AdminGames')}
            style={({ pressed }) => [styles.adminCard, pressed && styles.cardPressed]}
          >
            <Text style={styles.adminIcon}>🛠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>GameHub Admin Studio</Text>
              <Text style={styles.adminDesc}>Create and manage games in the catalog</Text>
            </View>
            <Text style={styles.adminArrow}>→</Text>
          </Pressable>
        )}

        {/* COMMUNITY & LORE GUIDE */}
        <Pressable
          onPress={() => navigation.navigate('Tutorial')}
          style={styles.guideCard}
        >
          <Text style={styles.guideIcon}>📜</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideTitle}>GameHub Rules & Strategies</Text>
            <Text style={styles.guideDesc}>Learn how to master Deception, bluff as Predator, and host rooms</Text>
          </View>
          <Text style={styles.guideArrow}>↗</Text>
        </Pressable>

        <Text style={styles.footerNote}>GAMEHUB · MULTIPLAYER ARENA ✦ READY PLAYER ONE</Text>
      </ScrollView>

      {/* GAMER PROFILE PASSPORT MODAL */}
      <GamerProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        user={user}
        onTriggerConfetti={triggerCelebration}
      />

      {/* PARTY UTILITIES (DICE / COIN / PICKER) MODAL */}
      <PartyDeciderModal
        visible={deciderModalVisible}
        onClose={() => setDeciderModalVisible(false)}
        initialTab={deciderTab}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },

  /* HERO BANNER */
  heroBanner: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#4338CA',
    padding: 20,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    flexDirection: 'row',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neonLime,
  },
  heroKicker: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 24,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroTitleHighlight: {
    color: colors.neonLime,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  heroXpBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroXpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroXpLabel: {
    color: colors.neonAmber,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  heroXpVal: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
  },
  heroXpTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceHighlight,
    overflow: 'hidden',
  },
  heroXpFill: {
    height: '100%',
    backgroundColor: colors.neonAmber,
    borderRadius: 3,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMainBtn: {
    flex: 1,
  },
  heroSecBtn: {
    flex: 1,
  },
  heroArtSide: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroBigEmoji: {
    fontSize: 48,
  },
  heroSparkleOne: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  heroSparkleTwo: {
    position: 'absolute',
    bottom: 4,
    left: 2,
  },
  sparkleText: {
    fontSize: 16,
  },

  /* SECTION HEADINGS */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  seeAllText: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },

  /* TOOLBOX GRID */
  toolboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  toolboxCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    alignItems: 'flex-start',
  },
  teamsCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  buzzerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  coinCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pickerCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  passPlayCard: {
    backgroundColor: '#122D25',
    borderColor: '#059669',
  },
  toolboxEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  toolboxTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 13,
    marginBottom: 2,
  },
  toolboxDesc: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  /* SPOTLIGHT */
  spotlightSection: {
    marginBottom: 24,
  },
  featuredGameCard: {
    padding: 18,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  featuredCapacity: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  featuredGameTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 20,
    marginBottom: 6,
  },
  featuredGameDesc: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  roleBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  roleBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  featuredActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  featuredActionBtn: {
    flex: 1,
  },

  /* SEARCH & FILTERS */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
  },
  clearSearchText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  filterScroll: {
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  activeFilterChipText: {
    color: colors.white,
  },

  /* GAMES LIST */
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 8,
  },
  gamesList: {
    gap: 10,
    marginBottom: 20,
  },
  gameRowCard: {
    padding: 14,
  },
  gameCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gameAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameAvatarEmoji: {
    fontSize: 22,
  },
  gameDetails: {
    flex: 1,
  },
  gameName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    marginBottom: 3,
  },
  gameDesc: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 16,
  },
  gameCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  gamePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gameMetaPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameMetaText: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  gameCardButtons: {
    minWidth: 80,
  },
  emptyGamesBox: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: colors.surfaceCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  emptyGamesEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyGamesTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    marginBottom: 4,
  },
  emptyGamesSubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
  },

  /* ADMIN CARD */
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261B3B',
    borderWidth: 1,
    borderColor: '#6B21A8',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  adminIcon: {
    fontSize: 22,
  },
  adminTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  adminDesc: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  adminArrow: {
    color: colors.neonCyan,
    fontSize: 16,
    fontWeight: '700',
  },

  /* GUIDE CARD */
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  guideIcon: {
    fontSize: 22,
  },
  guideTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  guideDesc: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  guideArrow: {
    color: colors.neonLime,
    fontSize: 14,
    fontWeight: '700',
  },

  footerNote: {
    textAlign: 'center',
    color: colors.textDim,
    fontFamily: 'Inter-Bold',
    fontSize: 8.5,
    letterSpacing: 1.5,
    marginTop: 8,
  },
});
