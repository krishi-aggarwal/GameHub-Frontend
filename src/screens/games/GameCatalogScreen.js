import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import Avatar from '../../components/Avatar';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';
import { getGames } from '../../api/gameApi';
import { getApiErrorMessage } from '../../api/apiUtils';
import { useToast } from '../../context/ToastContext';
import { playSfx } from '../../utils/soundEffects';

const CATEGORIES = [
  { id: 'ALL', label: '✦ All Games', icon: '🎮' },
  { id: 'DEDUCTION', label: '🕵️ Social Deduction', icon: '🕵️' },
  { id: 'PARTY', label: '🌊 Chill & Party', icon: '🎉' },
  { id: 'LOCAL', label: '📱 Pass & Play', icon: '📱' },
];

export default function GameCatalogScreen({ navigation }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGames();
      const gameList = Array.isArray(data) ? data : data?.data || [];
      setGames(gameList);
    } catch (error) {
      console.error('Failed to load games:', error);
      showToast(getApiErrorMessage(error, 'Could not load the GameHub catalog.'));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const q = search.trim().toLowerCase();
      const name = (game.name || '').toLowerCase();
      const desc = (game.description || '').toLowerCase();
      const type = (game.type || game.gameType || '').toUpperCase();

      const matchesQuery = !q || name.includes(q) || desc.includes(q);
      if (!matchesQuery) return false;

      if (activeCategory === 'DEDUCTION') {
        return type.includes('DECEPTION') || type.includes('MAFIA') || type.includes('DEDUCTION');
      }
      if (activeCategory === 'PARTY') {
        return type.includes('FISHPOND') || type.includes('PARTY') || type.includes('CASUAL');
      }
      return true;
    });
  }, [games, search, activeCategory]);

  const handleCreateRoom = (game) => {
    playSfx('start');
    navigation.navigate('CreateRoom', {
      gameId: game.gameId || game._id,
      gameName: game.name,
    });
  };

  const handlePassAndPlay = (slug = 'deception-around-us') => {
    playSfx('click');
    navigation.navigate('PassAndPlay', { gameSlug: slug });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => { playSfx('click'); navigation.goBack(); }}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backLabel}>HOME</Text>
          </Pressable>

          <View style={styles.topRight}>
            <Pressable
              onPress={() => navigation.navigate('JoinRoom')}
              style={styles.joinCodeBtn}
            >
              <Text style={styles.joinCodeText}>🎟️ ENTER CODE</Text>
            </Pressable>

            <Avatar
              uri={user?.avatarUrl}
              name={user?.displayName || user?.username || 'You'}
              size={36}
            />
          </View>
        </View>

        {/* HERO TITLE */}
        <View style={styles.header}>
          <View style={styles.kickerBadge}>
            <Text style={styles.kickerText}>ARCADE REPERTOIRE</Text>
          </View>
          <Text style={styles.title}>Game Catalog 🕹️</Text>
          <Text style={styles.subtitle}>
            Explore our roster of multiplayer party, bluffing, and social deduction games.
          </Text>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by game name, genre..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.clearSearch}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* CATEGORY TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => { playSfx('click'); setActiveCategory(cat.id); }}
                style={[styles.tabChip, active && styles.activeTabChip]}
              >
                <Text style={[styles.tabChipText, active && styles.activeTabChipText]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* GAMES LIST */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching available game arenas...</Text>
          </View>
        ) : filteredGames.length > 0 ? (
          <View style={styles.cardsGrid}>
            {filteredGames.map((game, index) => {
              const isActive = game.status === 'ACTIVE';
              const isDeception = (game.name || '').toLowerCase().includes('deception');

              return (
                <GlassCard
                  key={game.gameId || game._id || index}
                  glow={isDeception ? 'purple' : 'cyan'}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardStatusBadge}>
                      <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotInactive]} />
                      <Text style={[styles.statusText, isActive ? styles.textActive : styles.textInactive]}>
                        {isActive ? 'AVAILABLE NOW' : 'COMING SOON'}
                      </Text>
                    </View>
                    <Text style={styles.gameCategory}>
                      {String(game.type || 'PARTY').replace(/_/g, ' ')}
                    </Text>
                  </View>

                  <Text style={styles.gameTitle}>{game.name}</Text>
                  <Text style={styles.gameDesc} numberOfLines={3}>
                    {game.description || 'Entertaining multiplayer game mode.'}
                  </Text>

                  {/* Gamer Stats Meta */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>
                        👥 {game.minPlayers || 2}–{game.maxPlayers || 15} PLAYERS
                      </Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>
                        ⏱️ ~15 MIN
                      </Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>
                        🎯 {isDeception ? 'BLUFFING' : 'CHILL'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.cardButtonsRow}>
                    <GlassButton
                      title="CREATE ROOM 🚀"
                      variant="primary"
                      disabled={!isActive}
                      onPress={() => handleCreateRoom(game)}
                      style={{ flex: 1 }}
                    />
                    {isDeception && (
                      <GlassButton
                        title="PASS & PLAY 📱"
                        variant="secondary"
                        onPress={() => handlePassAndPlay('deception-around-us')}
                        style={{ flex: 1 }}
                      />
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>👾</Text>
            <Text style={styles.emptyTitle}>No matching games found</Text>
            <Text style={styles.emptySubtitle}>Try selecting "All Games" or clear your search.</Text>
            <GlassButton
              title="SHOW ALL GAMES"
              variant="secondary"
              size="small"
              onPress={() => { setSearch(''); setActiveCategory('ALL'); }}
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backArrow: {
    color: colors.neonCyan,
    fontSize: 22,
    fontWeight: '800',
  },
  backLabel: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  joinCodeBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.neonCyan,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  joinCodeText: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  kickerText: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
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
  clearSearch: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  tabsRow: {
    paddingBottom: 14,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTabChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  activeTabChipText: {
    color: colors.white,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 10,
  },
  cardsGrid: {
    gap: 16,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.neonLime,
  },
  dotInactive: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  textActive: {
    color: colors.neonLime,
  },
  textInactive: {
    color: colors.textMuted,
  },
  gameCategory: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  gameTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 22,
    marginBottom: 6,
  },
  gameDesc: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  metaPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaPillText: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  cardButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 36,
    backgroundColor: colors.surfaceCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
  },
});
