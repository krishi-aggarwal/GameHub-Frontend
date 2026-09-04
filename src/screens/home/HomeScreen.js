import React from 'react';

import {
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

export default function HomeScreen({
  navigation,
}) {

  return (
    <Screen>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <View>
            <Text style={styles.logo}>
              GAMEHUB
            </Text>

            <Text style={styles.subtitle}>
              Multiplayer starts here.
            </Text>
          </View>

          <Avatar
            name="You"
            size={46}
          />

        </View>

        {/* WELCOME */}

        <GlassCard style={styles.welcome}>

          <Text style={styles.eyebrow}>
            WELCOME BACK
          </Text>

          <Text style={styles.title}>
            Choose your next game.
          </Text>

          <Text style={styles.description}>
            Discover multiplayer experiences,
            create rooms and play with friends.
          </Text>

        </GlassCard>

        {/* FEATURED GAME */}

        <Text style={styles.sectionTitle}>
          FEATURED GAME
        </Text>

        <GlassCard style={styles.gameCard}>

          <View style={styles.gameTop}>

            <View style={styles.gameIcon}>
              <Text style={styles.iconText}>
                ◈
              </Text>
            </View>

            <View style={styles.gameInfo}>

              <Text style={styles.gameName}>
                Deception Around Us
              </Text>

              <Text style={styles.gameMeta}>
                4–15 PLAYERS  •  MULTIPLAYER
              </Text>

            </View>

          </View>

          <Text style={styles.gameDescription}>
            A social deduction game of hidden roles,
            suspicion and survival.
          </Text>

          <GlassButton
            title="PLAY NOW"
            onPress={() =>
              navigation.navigate('GameCatalog')
            }
          />

        </GlassCard>

        {/* QUICK ACTIONS */}

        <Text style={styles.sectionTitle}>
          QUICK ACTIONS
        </Text>

        <View style={styles.actions}>

          <View style={styles.action}>
            <GlassButton
              title="CREATE ROOM"
              onPress={() =>
                navigation.navigate('CreateRoom')
              }
            />
          </View>

          <View style={styles.action}>
            <GlassButton
              title="JOIN ROOM"
              variant="secondary"
              onPress={() =>
                navigation.navigate('JoinRoom')
              }
            />
          </View>

        </View>

        {/* LEARN */}

        <GlassCard style={styles.learnCard}>

          <Text style={styles.learnTitle}>
            NEW TO GAMEHUB?
          </Text>

          <Text style={styles.learnText}>
            Learn how rooms, multiplayer games and
            Deception Around Us work.
          </Text>

          <GlassButton
            title="HOW TO PLAY"
            variant="secondary"
            onPress={() =>
              navigation.navigate('Tutorial')
            }
          />

        </GlassCard>

      </ScrollView>

    </Screen>
  );
}

const styles = StyleSheet.create({

  container: {
    padding: spacing.xl,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },

  logo: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 25,
    letterSpacing: 2,
  },

  subtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    marginTop: 4,
  },

  welcome: {
    marginBottom: spacing.xxl,
  },

  eyebrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 25,
    lineHeight: 31,
  },

  description: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },

  sectionTitle: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 1.3,
    marginBottom: 10,
  },

  gameCard: {
    marginBottom: spacing.xxl,
  },

  gameTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  gameIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,

    backgroundColor: colors.surfaceStrong,

    borderWidth: 1,
    borderColor: colors.border,

    justifyContent: 'center',
    alignItems: 'center',
  },

  iconText: {
    color: colors.primary,
    fontSize: 23,
  },

  gameInfo: {
    flex: 1,
    marginLeft: 12,
  },

  gameName: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },

  gameMeta: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    marginTop: 5,
  },

  gameDescription: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },

  actions: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },

  action: {
    width: '100%',
  },

  learnCard: {
    marginBottom: spacing.xl,
  },

  learnTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 7,
  },

  learnText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },

});