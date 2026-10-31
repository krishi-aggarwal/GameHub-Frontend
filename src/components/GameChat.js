import React, { useState, useRef, useEffect } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';

import GlassCard from './GlassCard';
import Avatar from './Avatar';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import { playSfx } from '../utils/soundEffects';

function formatTime(timestamp) {
  if (!timestamp) {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const date = typeof timestamp === 'number' || typeof timestamp === 'string'
    ? new Date(timestamp)
    : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GameChat({
  messages = [],
  isAlive = true,
  onSend,
  maxHeight = 220,
}) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    // Auto scroll down as new chats arrive
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
  }, [messages.length]);

  function handleSend() {
    const trimmed = message.trim();
    if (!trimmed || !isAlive) return;

    playSfx('click');
    onSend?.(trimmed);
    setMessage('');
  }

  const handleKeyPress = (e) => {
    // Support enter key on web without shift
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault?.();
      handleSend();
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={[styles.chatCard, { maxHeight }]}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <Text style={styles.empty}>
              No radio signals yet. Discuss suspicions below...
            </Text>
          ) : (
            messages.map((item, index) => {
              const timeDisplay = formatTime(item.timestamp || item.createdAt);
              const sender = item.displayName || item.username || 'Crewmate';

              return (
                <View key={item.id || item._id || index} style={styles.messageRow}>
                  <Avatar
                    uri={item.avatarUrl}
                    name={sender}
                    size={32}
                  />

                  <View style={styles.content}>
                    <View style={styles.headerLine}>
                      <Text style={styles.name} numberOfLines={1}>
                        {sender}
                      </Text>
                      <Text style={styles.timestamp}>{timeDisplay}</Text>
                    </View>

                    <Text style={styles.messageText}>
                      {item.message}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </GlassCard>

      <View style={styles.inputRow}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          editable={isAlive}
          maxLength={280}
          placeholder={isAlive ? 'Discuss... (Press Enter to send)' : 'Communications disabled'}
          placeholderTextColor={colors.textMuted}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          onKeyPress={handleKeyPress}
          blurOnSubmit={false}
          style={[styles.input, !isAlive && styles.disabled]}
        />

        <Pressable
          onPress={handleSend}
          disabled={!isAlive || !message.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            (!isAlive || !message.trim()) && styles.sendDisabled,
            pressed && styles.sendPressed,
          ]}
        >
          <Text style={styles.sendText}>SEND ↵</Text>
        </Pressable>
      </View>

      {!isAlive && (
        <Text style={styles.observerText}>
          👻 You are an eliminated ghost spectator.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chatCard: {
    padding: 10,
    marginBottom: spacing.xs,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingVertical: 4,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 18,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  timestamp: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 9,
    marginLeft: 6,
  },
  messageText: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
  },
  disabled: {
    opacity: 0.45,
  },
  sendButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    opacity: 0.35,
  },
  sendPressed: {
    transform: [{ scale: 0.96 }],
  },
  sendText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  observerText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
});
