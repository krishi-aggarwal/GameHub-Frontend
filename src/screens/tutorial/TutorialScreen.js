
import React, {
  useState,
} from 'react';

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

const sections = [
  {
    title: 'GameHub',
    content: [
      {
        heading: 'What is GameHub?',
        text:
          'GameHub is a multiplayer gaming platform where players can discover games, create rooms, invite friends and play together in real time.',
      },
      {
        heading: 'How it works',
        text:
          'Choose a game from the catalog, create a room or join an existing room using its room code. Once everyone is ready, the host starts the game.',
      },
    ],
  },
  {
    title: 'Deception Around Us',
    content: [
      {
        heading: 'The Game',
        text:
          'Deception Around Us is a social deduction game where players must work together to discover hidden Predators among them. Everyone has a secret role, but only the Predators know who they are.',
      },
      {
        heading: 'Your Objective',
        text:
          'If you are an Innocent, your goal is to identify and eliminate the Predators. If you are a Predator, your goal is to secretly eliminate other players and survive until you gain control of the game.',
      },
      {
        heading: 'Roles',
        text:
          'PREDATOR — secretly eliminates players during the Night phase.\n\nDOCTOR — protects a player from being eliminated during the Night.\n\nDETECTIVE — investigates a player and receives information about their role.\n\nINNOCENT — has no special ability and must use discussion, observation and voting to find the Predators.',
      },
      {
        heading: 'Night Phase',
        text:
          'The Night phase is when special roles perform their actions. Predators choose a player to eliminate, the Doctor chooses someone to protect, and the Detective investigates a player.',
      },
      {
        heading: 'Day Phase',
        text:
          'Everyone discovers what happened during the Night. Living players discuss the events, share suspicions and try to identify the Predators. The host can start the Voting phase when the discussion is ready.',
      },
      {
        heading: 'Voting',
        text:
          'Living players vote for the person they believe is a Predator. The player receiving the most votes is eliminated. If the vote ends in a tie, nobody is eliminated.',
      },
      {
        heading: 'Winning',
        text:
          'The Innocents win when all Predators have been eliminated. The Predators win when they equal or outnumber the remaining non-Predators.',
      },
    ],
  },
];

export default function TutorialScreen({
  navigation,
}) {

  const [selectedSection, setSelectedSection] =
    useState(0);

  const section =
    sections[selectedSection];

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <Text style={styles.eyebrow}>
          GAMEHUB GUIDE
        </Text>

        <Text style={styles.title}>
          HOW TO PLAY
        </Text>

        <Text style={styles.subtitle}>
          Learn the GameHub experience and discover
          how Deception Around Us works.
        </Text>

        {/* SECTION SELECTOR */}

        <View style={styles.sectionSelector}>

          {sections.map((item, index) => {

            const active =
              index === selectedSection;

            return (
              <Pressable
                key={item.title}
                onPress={() =>
                  setSelectedSection(index)
                }
                style={[
                  styles.sectionButton,
                  active &&
                    styles.activeSectionButton,
                ]}
              >

                <Text
                  style={[
                    styles.sectionButtonText,
                    active &&
                      styles.activeSectionButtonText,
                  ]}
                >
                  {item.title}
                </Text>

              </Pressable>
            );
          })}

        </View>

        {/* SECTION CONTENT */}

        <GlassCard style={styles.contentCard}>

          <View style={styles.cardHeader}>

            <Text style={styles.cardEyebrow}>
              {selectedSection === 0
                ? 'THE PLATFORM'
                : 'SOCIAL DEDUCTION'}
            </Text>

            <Text style={styles.cardTitle}>
              {section.title}
            </Text>

          </View>

          {section.content.map((item, index) => (

            <View
              key={item.heading}
              style={[
                styles.topic,
                index !==
                  section.content.length - 1 &&
                  styles.topicSpacing,
              ]}
            >

              <Text style={styles.topicHeading}>
                {item.heading}
              </Text>

              <Text style={styles.topicText}>
                {item.text}
              </Text>

            </View>

          ))}

        </GlassCard>

        {/* BACK */}

        <GlassButton
          title="BACK TO GAMEHUB"
          variant="secondary"
          onPress={() =>
            navigation.navigate('Home')
          }
        />

      </ScrollView>

    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    padding: spacing.xl,
    paddingBottom: 40,
  },

  /* HEADER */

  eyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 7,
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
    marginTop: 8,
    marginBottom: spacing.xl,
  },

  /* SECTION SELECTOR */

  sectionSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },

  sectionButton: {
    flex: 1,

    minHeight: 48,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 12,

    borderRadius: 14,

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
  },

  activeSectionButton: {
    backgroundColor:
      'rgba(139, 92, 246, 0.10)',

    borderColor: colors.primary,
  },

  sectionButtonText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },

  activeSectionButtonText: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
  },

  /* CONTENT */

  contentCard: {
    marginBottom: spacing.xl,
  },

  cardHeader: {
    marginBottom: spacing.xl,
  },

  cardEyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 6,
  },

  cardTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 22,
  },

  topic: {
    paddingBottom: 2,
  },

  topicSpacing: {
    marginBottom: spacing.xl,
  },

  topicHeading: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    marginBottom: 7,
  },

  topicText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 21,
  },

});

