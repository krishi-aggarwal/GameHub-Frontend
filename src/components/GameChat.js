import React, { useState } from 'react';

import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';

import GlassCard from './GlassCard';
import Avatar from './Avatar';

import colors from '../theme/colors';
import spacing from '../theme/spacing';

export default function GameChat({
  messages = [],
  isAlive = true,
  onSend,
}) {

  const [message, setMessage] = useState('');

  function handleSend() {
    const trimmed = message.trim();

    if (!trimmed || !isAlive) {
      return;
    }

    onSend?.(trimmed);

    setMessage('');
  }

  return (
    <View>

      <GlassCard style={styles.chatCard}>

        {messages.length === 0 ? (
          <Text style={styles.empty}>
            No messages yet.
          </Text>
        ) : (
          messages.map((item) => (
            <View
              key={item.id}
              style={styles.messageRow}
            >

              <Avatar
                uri={item.avatarUrl}
                name={item.displayName || item.username}
                size={38}
              />

              <View style={styles.content}>

                <Text style={styles.name}>
                  {item.displayName || item.username}
                </Text>

                <Text style={styles.message}>
                  {item.message}
                </Text>

              </View>

            </View>
          ))
        )}

      </GlassCard>

      <View style={styles.inputRow}>

        <TextInput
          value={message}
          onChangeText={setMessage}
          editable={isAlive}
          multiline
          maxLength={300}
          placeholder={
            isAlive
              ? 'Type your message...'
              : 'Chat disabled'
          }
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            !isAlive && styles.disabled,
          ]}
        />

        <Pressable
          onPress={handleSend}
          disabled={!isAlive || !message.trim()}
          style={[
            styles.sendButton,
            (!isAlive || !message.trim()) &&
              styles.sendDisabled,
          ]}
        >
          <Text style={styles.sendText}>
            SEND
          </Text>
        </Pressable>

      </View>

      {!isAlive && (
        <Text style={styles.observerText}>
          You are observing the game.
        </Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  chatCard: {
    marginBottom: spacing.sm,
  },

  empty: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },

  content: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    marginBottom: 3,
  },

  message: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    paddingVertical: 12,

    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
  },

  disabled: {
    opacity: 0.45,
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

  sendDisabled: {
    opacity: 0.35,
  },

  sendText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },

  observerText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },

});