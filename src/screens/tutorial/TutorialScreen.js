import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { unlockCustomBadge } from '../../utils/gamerProgression';
import { playSfx } from '../../utils/soundEffects';

const sections = [
  {
    title: 'GameHub Platform',
    content: [
      {
        heading: 'What is GameHub?',
        text:
          'GameHub is an interactive multiplayer gaming platform where players can discover games, create rooms, invite friends, use party tools (dice & coin flip), and play together in real time.',
      },
      {
        heading: 'How it works',
        text:
          'Choose a game from the catalog, create a room, or join an existing room using its room code. Once everyone is ready in the lobby, the host kicks off the match.',
      },
      {
        heading: 'Party Toolbox',
        text:
          'Need to decide who goes first or settle a quick bet? Use the party dice roller (d6 & d20) and coin flipper right from the Home Screen or Lobby.',
      },
    ],
  },
  {
    title: 'Deception Around Us',
    content: [
      {
        heading: 'The Game',
        text:
          'Deception Around Us is a tense social deduction game where players work together to uncover hidden Predators among them. Everyone has a secret identity, but only Predators know each other.',
      },
      {
        heading: 'Your Objective',
        text:
          'If you are an Innocent, identify and vote out the Predators before it is too late. If you are a Predator, deceive the crew, eliminate players in the night, and conquer the room.',
      },
      {
        heading: 'Roles',
        text:
          '🐺 PREDATOR — secretly eliminates players during the Night phase.\n\n🩺 DOCTOR — shields one player from elimination during the Night.\n\n🕵️ DETECTIVE — investigates one player each night to uncover their role.\n\n🕊️ INNOCENT — must deduce, observe, and vote out the imposters.',
      },
      {
        heading: 'Night & Day Cycle',
        text:
          'During the Night phase, special roles take their turns in secret. In the Day phase, the room reconvenes to discuss who died, review suspicions, and vote.',
      },
      {
        heading: 'Voting & Elimination',
        text:
          'All living players vote on who to eject. The player with the highest vote count is eliminated. Ties result in no eliminations.',
      },
    ],
  },
  {
    title: 'Fishpond Game',
    content: [
      {
        heading: 'Compassionate Party Messages',
        text:
          'Fishpond is a heartwarming anonymous message-sharing game. Everyone in the pond drops a kind note or secret compliment into the pond, and then the room reads them together!',
      },
    ],
  },
];

export default function TutorialScreen({ navigation }) {
  const [selectedSection, setSelectedSection] = useState(0);

  useEffect(() => {
    unlockCustomBadge('social_star');
  }, []);

  const section = sections[selectedSection];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.kickerBadge}>
          <Text style={styles.kickerText}>📖 GAME STRATEGY & RULES</Text>
        </View>

        <Text style={styles.title}>GameHub Guide 📜</Text>
        <Text style={styles.subtitle}>
          Master the rules, learn special role abilities, and level up your strategy.
        </Text>

        {/* SECTION SELECTOR */}
        <View style={styles.sectionSelector}>
          {sections.map((item, index) => {
            const active = index === selectedSection;
            return (
              <Pressable
                key={item.title}
                onPress={() => {
                  playSfx('click');
                  setSelectedSection(index);
                }}
                style={[styles.sectionButton, active && styles.activeSectionButton]}
              >
                <Text style={[styles.sectionButtonText, active && styles.activeSectionButtonText]}>
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* SECTION CONTENT */}
        <GlassCard glow="cyan" style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEyebrow}>
              {selectedSection === 0
                ? 'PLATFORM GUIDE'
                : selectedSection === 1
                ? 'SOCIAL DEDUCTION RULES'
                : 'PARTY GAME'}
            </Text>
            <Text style={styles.cardTitle}>{section.title}</Text>
          </View>

          {section.content.map((item, index) => (
            <View
              key={item.heading}
              style={[
                styles.topic,
                index !== section.content.length - 1 && styles.topicSpacing,
              ]}
            >
              <Text style={styles.topicHeading}>{item.heading}</Text>
              <Text style={styles.topicText}>{item.text}</Text>
            </View>
          ))}
        </GlassCard>

        {/* BACK */}
        <GlassButton
          title="BACK TO ARENA 🚀"
          variant="secondary"
          onPress={() => {
            playSfx('click');
            navigation.navigate('Home');
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: 48,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.neonCyan,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  kickerText: {
    color: colors.neonCyan,
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
    marginBottom: spacing.lg,
  },
  sectionSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  sectionButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeSectionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectionButtonText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    textAlign: 'center',
  },
  activeSectionButtonText: {
    color: colors.white,
  },
  contentCard: {
    marginBottom: spacing.xl,
    padding: 20,
  },
  cardHeader: {
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  cardEyebrow: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 20,
  },
  topic: {
    paddingBottom: 2,
  },
  topicSpacing: {
    marginBottom: spacing.lg,
  },
  topicHeading: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    marginBottom: 6,
  },
  topicText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 19,
  },
});
