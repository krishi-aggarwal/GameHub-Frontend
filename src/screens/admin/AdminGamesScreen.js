import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassButton from '../../components/GlassButton';
import GlassCard from '../../components/GlassCard';
import GlassInput from '../../components/GlassInput';
import { getApiErrorMessage } from '../../api/apiUtils';
import { deleteGame, getGames, updateGame } from '../../api/gameApi';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { useToast } from '../../context/ToastContext';

const STATUSES = ['ACTIVE', 'COMING_SOON', 'DISABLED'];
const GAME_TYPES = ['PARTY', 'QUIZ', 'SINGLE', 'STRATEGY'];

function toForm(game) {
  return {
    name: game.name || '',
    slug: game.slug || '',
    description: game.description || '',
    minPlayers: String(game.minPlayers ?? 2),
    maxPlayers: String(game.maxPlayers ?? 12),
    gameType: game.gameType || 'PARTY',
    status: game.status || 'COMING_SOON',
    thumbnailUrl: game.thumbnailUrl || '',
  };
}

export default function AdminGamesScreen({ navigation }) {
  const [games, setGames] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { showToast } = useToast();
  const { width } = useWindowDimensions();

  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGames();
      const list = Array.isArray(data) ? data : data?.data || [];
      setGames(list);
      if (selectedId != null && !list.some((game) => game.gameId === selectedId)) {
        setSelectedId(null);
        setForm(null);
        setConfirmDelete(false);
      }

      if (selectedId != null) {
        const selected = list.find((game) => game.gameId === selectedId);
        if (selected) setForm(toForm(selected));
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Could not load games.'));
    } finally {
      setLoading(false);
    }
  }, [selectedId, showToast]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function saveGame() {
    const minPlayers = Number(form.minPlayers);
    const maxPlayers = Number(form.maxPlayers);

    if (!form.name.trim() || !form.slug.trim()) {
      showToast('Game name and slug are required.');
      return;
    }
    if (!Number.isInteger(minPlayers) || !Number.isInteger(maxPlayers)
        || minPlayers < 2 || minPlayers > maxPlayers) {
      showToast('Enter a valid player range.');
      return;
    }

    try {
      setSaving(true);
      await updateGame(selectedId, {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        minPlayers,
        maxPlayers,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
      });
      showToast('Game details saved.', 'success');
      await loadGames();
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Could not save this game.'));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status) {
    try {
      setSaving(true);
      await updateGame(selectedId, { status });
      setField('status', status);
      showToast(`Game marked ${status.toLowerCase().replace('_', ' ')}.`, 'success');
      await loadGames();
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Could not update game status.'));
    } finally {
      setSaving(false);
    }
  }

  async function removeGame() {
    try {
      setSaving(true);
      await deleteGame(selectedId);
      showToast('Game removed from the catalog.', 'success');
      setSelectedId(null);
      setForm(null);
      setConfirmDelete(false);
      await loadGames();
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Could not delete this game.'));
    } finally {
      setSaving(false);
    }
  }

  function selectGame(game) {
    setSelectedId(game.gameId);
    setForm(toForm(game));
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ADMIN · CATALOG</Text>
            <Text style={styles.title}>Game management</Text>
          </View>
          <GlassButton title="ADD GAME" onPress={() => navigation.navigate('AdminCreateGame')} />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.secondaryText}>Loading catalog</Text>
          </View>
        ) : (
          <View style={[styles.layout, width < 760 && styles.layoutStacked]}>
            <View style={styles.list}>
              {games.map((game) => (
                <Pressable key={game.gameId} onPress={() => selectGame(game)}>
                  <GlassCard style={[
                    styles.gameRow,
                    selectedId === game.gameId && styles.selectedRow,
                  ]}>
                    <View style={styles.rowTop}>
                      <Text style={styles.gameName}>{game.name}</Text>
                      <Text style={styles.status}>{game.status?.replace('_', ' ')}</Text>
                    </View>
                    <Text style={styles.secondaryText}>{game.slug}</Text>
                    <Text style={styles.secondaryText}>
                      {game.minPlayers}–{game.maxPlayers} players · {game.gameType || game.type || 'GAME'}
                    </Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>

            {form && (
              <GlassCard style={styles.editor}>
                <Text style={styles.sectionTitle}>EDIT GAME</Text>
                <GlassInput label="NAME" value={form.name} onChangeText={(value) => setField('name', value)} />
                <GlassInput label="SLUG" value={form.slug} onChangeText={(value) => setField('slug', value)} />
                <GlassInput label="DESCRIPTION" value={form.description} onChangeText={(value) => setField('description', value)} />
                <View style={styles.range}>
                  <View style={styles.rangeInput}>
                    <GlassInput label="MIN PLAYERS" value={form.minPlayers} keyboardType="numeric" onChangeText={(value) => setField('minPlayers', value)} />
                  </View>
                  <View style={styles.rangeInput}>
                    <GlassInput label="MAX PLAYERS" value={form.maxPlayers} keyboardType="numeric" onChangeText={(value) => setField('maxPlayers', value)} />
                  </View>
                </View>
                <GlassInput label="THUMBNAIL URL" value={form.thumbnailUrl} onChangeText={(value) => setField('thumbnailUrl', value)} />
                <Text style={styles.label}>GAME TYPE</Text>
                <View style={styles.statusOptions}>
                  {GAME_TYPES.map((gameType) => (
                    <Pressable
                      key={gameType}
                      onPress={() => setField('gameType', gameType)}
                      style={[styles.statusOption, form.gameType === gameType && styles.statusSelected]}
                    >
                      <Text style={styles.statusOptionText}>{gameType}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>AVAILABILITY</Text>
                <View style={styles.statusOptions}>
                  {STATUSES.map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => setStatus(status)}
                      disabled={saving}
                      style={[styles.statusOption, form.status === status && styles.statusSelected]}
                    >
                      <Text style={styles.statusOptionText}>{status.replace('_', ' ')}</Text>
                    </Pressable>
                  ))}
                </View>
                <GlassButton title={saving ? 'SAVING...' : 'SAVE DETAILS'} onPress={saveGame} disabled={saving} />
                <View style={styles.deleteArea}>
                  {confirmDelete ? (
                    <View style={styles.deleteConfirm}>
                      <Text style={styles.deletePrompt}>Delete {form.name} permanently?</Text>
                      <View style={styles.deleteActions}>
                        <Pressable onPress={() => setConfirmDelete(false)} disabled={saving}>
                          <Text style={styles.cancelText}>CANCEL</Text>
                        </Pressable>
                        <Pressable onPress={removeGame} disabled={saving}>
                          <Text style={styles.deleteText}>{saving ? 'DELETING...' : 'CONFIRM DELETE'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => setConfirmDelete(true)} disabled={saving}>
                      <Text style={styles.deleteText}>DELETE GAME</Text>
                    </Pressable>
                  )}
                </View>
              </GlassCard>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: spacing.xl,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 26,
    marginTop: 6,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  layoutStacked: {
    flexDirection: 'column',
  },
  list: {
    flex: 1,
    gap: spacing.sm,
  },
  gameRow: {
    padding: spacing.md,
    borderRadius: 10,
  },
  selectedRow: {
    borderColor: colors.primary,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  gameName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    flex: 1,
  },
  status: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  secondaryText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    marginTop: 6,
  },
  editor: {
    flex: 1,
    minWidth: 320,
    borderRadius: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    marginBottom: spacing.md,
  },
  range: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rangeInput: {
    flex: 1,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  statusSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceStrong,
  },
  statusOptionText: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  loading: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  deleteArea: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  deleteConfirm: {
    gap: spacing.sm,
  },
  deletePrompt: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  deleteText: {
    color: colors.danger,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
});