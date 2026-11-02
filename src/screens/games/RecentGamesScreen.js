import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '../../api/apiUtils';
import { getRecentMatches } from '../../api/matchApi';
import GlassButton from '../../components/GlassButton';
import GlassCard from '../../components/GlassCard';
import Screen from '../../components/Screen';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { useToast } from '../../context/ToastContext';

function formatDate(value) {
  if (!value) return 'In progress';
  return new Date(value).toLocaleString();
}

export default function RecentGamesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    try {
      setFailed(false);
      setMatches(await getRecentMatches());
    } catch (error) {
      console.error('Could not load recent games:', error);
      setFailed(true);
      showToast(getApiErrorMessage(error, 'Could not load recent games.'));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>YOUR ACTIVITY</Text>
        <Text style={styles.title}>Recent games</Text>
        <Text style={styles.subtitle}>
          Completed matches, player outcomes, earned XP, and key milestones.
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : failed ? (
          <GlassCard style={styles.empty}>
            <Text style={styles.cardTitle}>History unavailable</Text>
            <GlassButton title="TRY AGAIN" variant="secondary" onPress={refresh} />
          </GlassCard>
        ) : matches.length ? (
          <View style={styles.list}>
            {matches.map((match) => (
              <GlassCard key={match.matchId} style={styles.card}>
                <View style={styles.header}>
                  <View style={styles.grow}>
                    <Text style={styles.cardTitle}>{match.gameName}</Text>
                    <Text style={styles.meta}>
                      {match.mode} · {formatDate(match.completedAt || match.startedAt)}
                    </Text>
                  </View>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+{match.xpEarned} XP</Text>
                  </View>
                </View>
                <Text style={styles.result}>
                  {match.status === 'COMPLETED' ? match.result?.replace(/_/g, ' ') : match.status}
                  {match.rounds ? ` · ${match.rounds} rounds` : ''}
                </Text>
                <Text style={styles.meta}>
                  {match.players.length} players: {match.players.map((player) => player.displayName).join(', ')}
                </Text>
                <Text style={styles.sectionLabel}>KEY EVENTS</Text>
                {match.events.length ? (
                  match.events.map((event, index) => (
                    <Text key={`${event.eventType}-${event.occurredAt}-${index}`} style={styles.event}>
                      {event.roundNumber ? `Round ${event.roundNumber} · ` : ''}
                      {event.eventType.replace(/_/g, ' ')} · {formatDate(event.occurredAt)}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.meta}>No milestones recorded.</Text>
                )}
              </GlassCard>
            ))}
          </View>
        ) : (
          <GlassCard style={styles.empty}>
            <Text style={styles.cardTitle}>No matches yet</Text>
            <Text style={styles.meta}>Your completed online and synced local games will appear here.</Text>
          </GlassCard>
        )}
        <GlassButton title="BACK TO HOME" variant="secondary" onPress={() => navigation.navigate('Home')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: spacing.xl,
    paddingBottom: 48,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 30,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
  },
  loading: {
    marginVertical: 32,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 16,
    gap: 9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  grow: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 15,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 17,
  },
  xpBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 231, 117, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  xpText: {
    color: colors.neonLime,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  result: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  sectionLabel: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  event: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 17,
  },
  empty: {
    padding: 18,
    gap: 10,
  },
});
