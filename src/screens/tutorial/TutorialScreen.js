import React, { useState } from 'react';

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

const lessons = [
  {
    title: 'GameHub Basics',
    content:
      'GameHub is a multiplayer platform where players can discover games, create rooms, invite others and play together in real time.',
  },
  {
    title: 'Create or Join',
    content:
      'Choose a game from the catalog. Create a room to become its host, or join an existing room using its room code.',
  },
  {
    title: 'Deception Around Us',
    content:
      'Players receive hidden roles. Some players are Predators while others must survive and identify them.',
  },
  {
    title: 'Night Phase',
    content:
      'Predators can eliminate a player. The Doctor can protect a player. The Detective can investigate a player. Innocents wait for morning.',
  },
  {
    title: 'Day Phase',
    content:
      'Players discuss what happened. Living players can use the real-time chat to share information and suspicions.',
  },
  {
    title: 'Voting',
    content:
      'Living players vote for a suspected player. The player receiving the most votes is eliminated. A tie results in no elimination.',
  },
  {
    title: 'Winning',
    content:
      'The Predators win when they equal or outnumber the remaining non-Predators. The Innocents win when all Predators are eliminated.',
  },
];

export default function TutorialScreen({
  navigation,
}) {

  const [selected, setSelected] = useState(0);

  const lesson = lessons[selected];

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.eyebrow}>
          GAMEHUB GUIDE
        </Text>

        <Text style={styles.title}>
          HOW TO PLAY
        </Text>

        <Text style={styles.subtitle}>
          Everything you need to know before joining a game.
        </Text>

        {/* LESSONS */}

        <View style={styles.lessonList}>

          {lessons.map((item, index) => {

            const active = index === selected;

            return (
              <Pressable
                key={item.title}
                onPress={() => setSelected(index)}
                style={[
                  styles.lesson,
                  active && styles.activeLesson,
                ]}
              >

                <Text
                  style={[
                    styles.lessonNumber,
                    active && styles.activeNumber,
                  ]}
                >
                  {String(index + 1).padStart(2, '0')}
                </Text>

                <Text
                  style={[
                    styles.lessonTitle,
                    active && styles.activeTitle,
                  ]}
                >
                  {item.title}
                </Text>

              </Pressable>
            );
          })}

        </View>

        {/* CONTENT */}

        <GlassCard style={styles.contentCard}>

          <Text style={styles.contentTitle}>
            {lesson.title}
          </Text>

          <Text style={styles.content}>
            {lesson.content}
          </Text>

        </GlassCard>

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
    marginBottom: spacing.xxl,
  },

  lessonList: {
    gap: 8,
    marginBottom: spacing.xl,
  },

  lesson: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: 54,

    paddingHorizontal: 14,

    borderRadius: 14,

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
  },

  activeLesson: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.10)',
  },

  lessonNumber: {
    width: 30,
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },

  activeNumber: {
    color: colors.primary,
  },

  lessonTitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },

  activeTitle: {
    color: colors.text,
  },

  contentCard: {
    marginBottom: spacing.xl,
  },

  contentTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 19,
    marginBottom: 10,
  },

  content: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 23,
  },

});