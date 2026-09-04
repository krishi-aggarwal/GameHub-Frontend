import React, { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';

import Screen from '../../components/Screen';
import GlassCard from '../../components/GlassCard';
import Avatar from '../../components/Avatar';
import GlassButton from '../../components/GlassButton';

import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

export default function DayScreen({ navigation, route }) {

  const {
    sessionId = 'demo-session',
    roundNumber = 1,
    isAlive = true,
  } = route?.params || {};

  const [message, setMessage] = useState('');

  /*
   * Temporary messages.
   *
   * During WebSocket integration these will come from:
   *
   * CHAT_MESSAGE
   *
   * through:
   *
   * /topic/game/{sessionId}
   */
  const [messages, setMessages] = useState([
    {
      id: 1,
      userId: 2,
      name: 'Player 02',
      avatarUrl: null,
      message: 'Did anyone notice anything suspicious?',
    },
    {
      id: 2,
      userId: 3,
      name: 'Player 03',
      avatarUrl: null,
      message: 'I was watching Player 04 most of the night.',
    },
    {
      id: 3,
      userId: 4,
      name: 'Player 04',
      avatarUrl: null,
      message: 'Why me? I have done nothing.',
    },
  ]);

  function handleSendMessage() {

    if (!message.trim() || !isAlive) {
      return;
    }

    /*
     * Temporary local message.
     *
     * Later:
     *
     * STOMP SEND
     * /app/game/{sessionId}/chat
     *
     * {
     *   message: "..."
     * }
     */
    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        userId: 1,
        name: 'You',
        avatarUrl: null,
        message: message.trim(),
      },
    ]);

    setMessage('');
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >

          {/* HEADER */}
          <View style={styles.header}>

            <View>
              <Text style={styles.eyebrow}>
                DECEPTION AROUND US
              </Text>

              <Text style={styles.title}>
                DAY {String(roundNumber).padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.timer}>
              <Text style={styles.timerText}>
                03:42
              </Text>
            </View>

          </View>

          {/* NIGHT REPORT */}
          <GlassCard style={styles.reportCard}>

            <Text style={styles.reportLabel}>
              ☀  NIGHT REPORT
            </Text>

            <Text style={styles.reportTitle}>
              Nobody was eliminated tonight.
            </Text>

            <Text style={styles.reportDescription}>
              The investigation continues. Discuss what
              happened and decide who you trust.
            </Text>

          </GlassCard>

          {/* DISCUSSION */}
          <View style={styles.sectionHeader}>

            <View>
              <Text style={styles.sectionTitle}>
                DISCUSSION
              </Text>

              <Text style={styles.sectionSubtitle}>
                Talk with the living players.
              </Text>
            </View>

            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />

              <Text style={styles.onlineText}>
                LIVE
              </Text>
            </View>

          </View>

          {/* CHAT */}
          <GlassCard style={styles.chatCard}>

            {messages.map((item) => (
              <View
                key={item.id}
                style={styles.messageRow}
              >

                <Avatar
                  uri={item.avatarUrl}
                  name={item.name}
                  size={38}
                />

                <View style={styles.messageContent}>

                  <Text style={styles.messageName}>
                    {item.name}
                  </Text>

                  <Text style={styles.messageText}>
                    {item.message}
                  </Text>

                </View>

              </View>
            ))}

          </GlassCard>

          {/* INPUT */}
          <View style={styles.inputRow}>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={
                isAlive
                  ? 'Type your message...'
                  : 'Chat disabled'
              }
              placeholderTextColor={colors.textMuted}
              editable={isAlive}
              maxLength={300}
              multiline
              style={[
                styles.input,
                !isAlive && styles.disabledInput,
              ]}
            />

            <Pressable
              onPress={handleSendMessage}
              disabled={!isAlive || !message.trim()}
              style={[
                styles.sendButton,
                (!isAlive || !message.trim()) &&
                  styles.disabledSend,
              ]}
            >
              <Text style={styles.sendText}>
                SEND
              </Text>
            </Pressable>

          </View>

          {/* VOTING */}
          {isAlive && (
            <GlassCard style={styles.votingCard}>

              <Text style={styles.votingTitle}>
                Ready to vote?
              </Text>

              <Text style={styles.votingDescription}>
                When the host starts voting, everyone
                will choose a player to eliminate.
              </Text>

              <GlassButton
                title="VIEW VOTING"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('Voting', {
                    sessionId,
                    roundNumber,
                  })
                }
              />

            </GlassCard>
          )}

          {/* OBSERVER */}
          {!isAlive && (
            <GlassCard style={styles.observerCard}>

              <Text style={styles.observerTitle}>
                YOU ARE OBSERVING
              </Text>

              <Text style={styles.observerText}>
                You can follow the discussion, but you
                cannot send messages or vote.
              </Text>

            </GlassCard>
          )}

        </ScrollView>

      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({

  keyboard: {
    flex: 1,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  eyebrow: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 28,
  },

  timer: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },

  timerText: {
    color: colors.warning,
    fontFamily: 'Inter-Bold',
    fontSize: 15,
  },

  reportCard: {
    marginBottom: spacing.xl,
  },

  reportLabel: {
    color: colors.warning,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  reportTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    marginBottom: 8,
  },

  reportDescription: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 4,
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },

  onlineText: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },

  chatCard: {
    marginBottom: spacing.md,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },

  messageContent: {
    flex: 1,
    marginLeft: 12,
  },

  messageName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    marginBottom: 4,
  },

  messageText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },

  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 100,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
  },

  disabledInput: {
    opacity: 0.5,
  },

  sendButton: {
    height: 50,
    marginLeft: 8,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledSend: {
    opacity: 0.35,
  },

  sendText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },

  votingCard: {
    marginTop: spacing.sm,
  },

  votingTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 7,
  },

  votingDescription: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },

  observerCard: {
    marginTop: spacing.md,
  },

  observerTitle: {
    color: colors.warning,
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    marginBottom: 7,
  },

  observerText: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
  },

});