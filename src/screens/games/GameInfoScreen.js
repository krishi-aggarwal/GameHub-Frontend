import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GlassButton from '../../components/GlassButton';
import GlassCard from '../../components/GlassCard';
import Screen from '../../components/Screen';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { supportsPassAndPlay } from '../../utils/gameCatalog';

const GAME_GUIDES = {
  'deception-around-us': {
    tagline: 'A hidden-role game of teamwork, deduction, and bluffing.',
    objective: 'Crewmates win by eliminating every Predator. Predators win when they equal or outnumber the other living players.',
    howToPlay: [
      'Join or create an online room, or choose Pass & Play to share one device. Deception supports 4–15 players.',
      'Roles are dealt secretly. Predators know their team; other roles must work out who to trust.',
      'At night, living Predators choose a target. If enabled, the Doctor protects one player and the Detective investigates one player.',
      'During the day, discuss the clues and decide who seems suspicious. The host opens voting; living players vote to eliminate someone.',
      'Night and day repeat until one team meets its win condition. Eliminated players can observe but cannot take actions.',
    ],
    roles: [
      'Predator: coordinate secretly and avoid suspicion.',
      'Doctor: protect a likely target; protection can prevent a night elimination.',
      'Detective: investigate a player and use the private result to guide discussion.',
      'Innocent: compare stories, discuss evidence, and vote strategically.',
    ],
    tips: 'A tied Predator target or tied vote does not eliminate anyone. The number of Predators scales with player count; Doctor and Detective are optional roles.',
  },
  fishpond: {
    tagline: 'A relaxed group game of anonymous messages, guessing, and reveal.',
    objective: 'Write a message, read the shuffled messages together, and discover who wrote each one when the host reveals the authors.',
    howToPlay: [
      'Join or create an online room, or choose Pass & Play to share one device. Fishpond supports 3–12 online players.',
      'Each player submits one short message (up to 280 characters). The author stays hidden while everyone is submitting.',
      'When all active players have submitted, messages appear in a shuffled order. The host moves through them while the group discusses and guesses.',
      'At the final message, the host reveals the authors to finish the round. Online chat is available during the game.',
    ],
    roles: [
      'Host: start the room, move between messages, and reveal authors at the end.',
      'Players: submit one appropriate message and join the discussion.',
    ],
    tips: 'Keep messages friendly and suitable for the whole group. The server stores match milestones and results, not message text or chat.',
  },
};

export default function GameInfoScreen({ navigation, route }) {
  const game = route?.params?.game || {};
  const slug = String(game.slug || route?.params?.gameSlug || '').toLowerCase();
  const guide = GAME_GUIDES[slug];
  const title = game.name || (slug === 'fishpond' ? 'Fishpond' : 'Game guide');
  const onlineGameId = game.gameId || game.id;
  const canPlayLocally = supportsPassAndPlay({ ...game, slug });

  function createRoom() {
    if (!onlineGameId) {
      navigation.navigate('GameCatalog');
      return;
    }
    navigation.navigate('CreateRoom', { gameId: onlineGameId, gameName: title });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>GAME GUIDE</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {guide?.tagline || game.description || 'Learn the basics, then jump into a match.'}
        </Text>

        <View style={styles.actions}>
          <GlassButton
            title="FIND ONLINE PLAYERS"
            onPress={() => navigation.navigate('OnlineMatchmaking', { game })}
            style={styles.actionButton}
          />
          <GlassButton
            title="CREATE ROOM"
            variant="secondary"
            onPress={createRoom}
            style={styles.actionButton}
          />
          {canPlayLocally && (
            <GlassButton
              title="OFFLINE · PASS & PLAY"
              variant="cyan"
              onPress={() => navigation.navigate('PassAndPlay', { gameSlug: slug })}
              style={styles.actionButton}
            />
          )}
        </View>

        <GuideSection title="Objective">
          <Text style={styles.body}>
            {guide?.objective || game.description || 'Follow the game instructions and work with your group.'}
          </Text>
        </GuideSection>

        <GuideSection title="How to play">
          {(guide?.howToPlay || [
            'Create an online room or join a public room from the matchmaking list.',
            'Read the room instructions and follow the in-game prompts.',
          ]).map((step, index) => (
            <View key={step} style={styles.listRow}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={[styles.body, styles.listText]}>{step}</Text>
            </View>
          ))}
        </GuideSection>

        {guide?.roles && (
          <GuideSection title="Players and roles">
            {guide.roles.map((role) => (
              <Text key={role} style={[styles.body, styles.roleText]}>• {role}</Text>
            ))}
          </GuideSection>
        )}

        <GuideSection title="Helpful notes">
          <Text style={styles.body}>
            {guide?.tips || 'Use the room lobby to check player count and readiness before the host starts.'}
          </Text>
          <Text style={[styles.body, styles.modeNote]}>
            Online play uses an account and room. Pass & Play is local to one device and requires supported game rules.
          </Text>
        </GuideSection>

        <GlassButton title="BACK TO GAMES" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}

function GuideSection({ title, children }) {
  return (
    <GlassCard glow="cyan" style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </GlassCard>
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
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: 8,
    marginBottom: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  section: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    width: 18,
  },
  listText: {
    flex: 1,
  },
  roleText: {
    marginBottom: 6,
  },
  modeNote: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
});
