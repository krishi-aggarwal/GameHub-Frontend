import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Avatar from '../../components/Avatar';
import GlassButton from '../../components/GlassButton';
import GlassCard from '../../components/GlassCard';
import Screen from '../../components/Screen';
import { getApiErrorMessage } from '../../api/apiUtils';
import { leaveRoom } from '../../api/roomApi';
import {
  getFishpondState,
  navigateFishpondMessage,
  revealFishpondAuthors,
  sendFishpondChat,
  submitFishpondMessage,
} from '../../api/fishpondApi';
import { disconnectFromRoom, connectToRoom } from '../../api/gameSocket';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const MAX_MESSAGE_LENGTH = 280;

export default function FishpondScreen({ navigation, route }) {
  const roomCode = route?.params?.roomCode;
  const { token, setActiveRoomCode } = useAuth();
  const { showToast } = useToast();
  const [game, setGame] = useState(null);
  const [message, setMessage] = useState('');
  const [chatText, setChatText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!roomCode) return null;
    try {
      const state = await getFishpondState(roomCode);
      setGame(state);
      return state;
    } catch (error) {
      if (error?.response?.status === 404) {
        await setActiveRoomCode(null);
        showToast('This Fishpond session is no longer available.');
        navigation.replace('Home');
        return null;
      }
      showToast(getApiErrorMessage(error, 'Could not load Fishpond.'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [navigation, roomCode, setActiveRoomCode, showToast]);

  useEffect(() => {
    refresh();

    if (!roomCode || !token) return undefined;

    connectToRoom(roomCode, (event) => {
      if (
        ['FISHPOND_UPDATED', 'FISHPOND_STARTED', 'AUTHORS_REVEALED', 'PLAYER_LEFT', 'CHAT_MESSAGE']
          .includes(event?.type)
      ) {
        refresh();
      }
    }, token);

    const interval = setInterval(refresh, 4000);
    return () => {
      clearInterval(interval);
      disconnectFromRoom();
    };
  }, [refresh, roomCode, token]);

  async function perform(action, successMessage) {
    try {
      setBusy(true);
      const nextState = await action();
      setGame(nextState);
      if (successMessage) showToast(successMessage, 'success');
      return true;
    } catch (error) {
      showToast(getApiErrorMessage(error, 'That action could not be completed.'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) {
      showToast('Write a message before submitting.');
      return;
    }
    perform(
      () => submitFishpondMessage(roomCode, trimmed),
      'Your message is in the pond.'
    ).then((succeeded) => {
      if (succeeded) setMessage('');
    });
  }

  function handleSendChat() {
    const trimmed = chatText.trim();
    if (!trimmed) return;
    perform(() => sendFishpondChat(roomCode, trimmed)).then((succeeded) => {
      if (succeeded) setChatText('');
    });
  }

  async function handleLeaveGame() {
    try {
      setBusy(true);
      await leaveRoom(roomCode);
      await setActiveRoomCode(null);
      disconnectFromRoom();
      showToast('You left Fishpond.', 'success');
      navigation.replace('Home');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Could not leave Fishpond.'));
    } finally {
      setBusy(false);
    }
  }

  function returnToLobby() {
    if (roomCode) {
      navigation.replace('Lobby', { roomCode });
    } else {
      navigation.replace('GameCatalog');
    }
  }

  if (loading && !game) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Loading Fishpond...</Text>
        </View>
      </Screen>
    );
  }

  if (!game) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.title}>Fishpond unavailable</Text>
          <GlassButton title="BACK TO GAMEHUB" onPress={() => navigation.replace('Home')} />
        </View>
      </Screen>
    );
  }

  const chatOpen = game.phase !== 'COMPLETE';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topbar}>
          <View>
            <Text style={styles.eyebrow}>FISHPOND · ROOM {roomCode}</Text>
            <Text style={styles.title}>Anonymous messages</Text>
          </View>
          <View style={styles.progress}>
            <Text style={styles.progressNumber}>{game.submittedCount}</Text>
            <Text style={styles.progressLabel}>/ {game.totalPlayers} submitted</Text>
          </View>
        </View>

        {game.phase === 'SUBMITTING' && (
          <GlassCard style={styles.panel}>
            <Text style={styles.sectionLabel}>YOUR MESSAGE</Text>
            {game.hasSubmitted ? (
              <View style={styles.waiting}>
                <Text style={styles.waitingTitle}>Message received</Text>
                <Text style={styles.body}>Your message is anonymous. It will appear when everyone has submitted.</Text>
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              </View>
            ) : (
              <>
                <Text style={styles.body}>Write one kind, playful message about someone or something in the group. Your name stays hidden until the host reveals authors at the end.</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  maxLength={MAX_MESSAGE_LENGTH}
                  multiline
                  placeholder="Write your anonymous message..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.messageInput}
                />
                <View style={styles.inputFooter}>
                  <Text style={styles.counter}>{message.length}/{MAX_MESSAGE_LENGTH}</Text>
                  <GlassButton title={busy ? 'SENDING...' : 'DROP IN POND'} onPress={handleSubmit} disabled={busy} />
                </View>
              </>
            )}
          </GlassCard>
        )}

        {game.phase === 'READING' && (
          <GlassCard style={styles.messagePanel}>
            <View style={styles.messageHeader}>
              <Text style={styles.sectionLabel}>MESSAGE {game.currentIndex + 1} OF {game.submittedCount}</Text>
              <Text style={styles.anonymousBadge}>ANONYMOUS</Text>
            </View>
            <Text style={styles.anonymousMessage}>{game.currentMessage?.message}</Text>
            {game.currentMessage?.authorName && (
              <Text style={styles.authorName}>Written by {game.currentMessage.authorName}</Text>
            )}
            {game.isHost ? (
              <View style={styles.controls}>
                <Pressable
                  accessibilityRole="button"
                  disabled={!game.canGoBack || busy}
                  onPress={() => perform(() => navigateFishpondMessage(roomCode, 'PREVIOUS'))}
                  style={[styles.arrowButton, !game.canGoBack && styles.disabled]}
                >
                  <Text style={styles.arrow}>‹</Text>
                  <Text style={styles.controlLabel}>PREVIOUS</Text>
                </Pressable>
                {game.canRevealAuthors ? (
                  <GlassButton
                    title={busy ? 'REVEALING...' : 'REVEAL AUTHORS'}
                    onPress={() => perform(() => revealFishpondAuthors(roomCode), 'Authors revealed.')}
                    disabled={busy}
                  />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    disabled={!game.canGoNext || busy}
                    onPress={() => perform(() => navigateFishpondMessage(roomCode, 'NEXT'))}
                    style={[styles.arrowButton, !game.canGoNext && styles.disabled]}
                  >
                    <Text style={styles.arrow}>›</Text>
                    <Text style={styles.controlLabel}>NEXT</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Text style={styles.hostHint}>The host controls the message order.</Text>
            )}
          </GlassCard>
        )}

        {game.phase === 'COMPLETE' && (
          <GlassCard style={styles.panel}>
            <Text style={styles.sectionLabel}>THE AUTHORS</Text>
            <Text style={styles.body}>The pond is revealed. Here’s who wrote each message.</Text>
            {game.messages.map((item, index) => (
              <View key={item.id} style={styles.revealedMessage}>
                <Text style={styles.revealedIndex}>0{index + 1}</Text>
                <View style={styles.revealedContent}>
                  <Text style={styles.revealedText}>{item.message}</Text>
                  <Text style={styles.authorName}>{item.authorName || 'Unknown author'}</Text>
                </View>
              </View>
            ))}
            {game.isHost && game.canRevealAuthors && (
              <GlassButton
                title={busy ? 'UPDATING...' : 'HIDE AUTHORS'}
                variant="secondary"
                onPress={() => perform(() => revealFishpondAuthors(roomCode), 'Authors hidden.')}
                disabled={busy}
              />
            )}
            <GlassButton title="BACK TO LOBBY" onPress={returnToLobby} />
          </GlassCard>
        )}

        <View style={styles.peopleRow}>
          {game.players.map((player) => (
            <View key={player.userId} style={styles.person}>
              <Avatar name={player.displayName} size={36} />
              <Text numberOfLines={1} style={styles.personName}>{player.displayName}</Text>
              <Text style={styles.personState}>
                {player.left ? 'LEFT' : player.submitted ? 'READY' : 'WRITING'}
              </Text>
            </View>
          ))}
        </View>

        {chatOpen && (
          <GlassCard style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <View>
                <Text style={styles.sectionLabel}>POND-SIDE CHAT</Text>
                <Text style={styles.body}>Discuss the messages without exposing authors.</Text>
              </View>
              <Text style={styles.chatCount}>{game.chatMessages.length}</Text>
            </View>
            <View style={styles.chatMessages}>
              {game.chatMessages.length === 0 ? (
                <Text style={styles.muted}>No messages yet. Start the conversation.</Text>
              ) : game.chatMessages.slice(-30).map((chat) => (
                <View key={chat.id} style={styles.chatMessage}>
                  <Text style={styles.chatName}>{chat.displayName}</Text>
                  <Text style={styles.chatText}>{chat.message}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chatInputRow}>
              <TextInput
                value={chatText}
                onChangeText={setChatText}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Say something..."
                placeholderTextColor={colors.textMuted}
                style={styles.chatInput}
                onSubmitEditing={handleSendChat}
              />
              <Pressable onPress={handleSendChat} disabled={busy || !chatText.trim()} style={styles.sendButton}>
                <Text style={styles.sendText}>SEND</Text>
              </Pressable>
            </View>
          </GlassCard>
        )}

        <GlassButton
          title={busy ? 'LEAVING...' : 'LEAVE FISHPOND'}
          variant="secondary"
          onPress={handleLeaveGame}
          disabled={busy}
        />
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
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    color: '#67D9C0',
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    marginBottom: 6,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 25,
  },
  progress: {
    alignItems: 'flex-end',
  },
  progressNumber: {
    color: '#67D9C0',
    fontFamily: 'Inter-Bold',
    fontSize: 22,
  },
  progressLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  panel: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  messageInput: {
    minHeight: 118,
    maxHeight: 220,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  inputFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  counter: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
  },
  waiting: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  waitingTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 17,
  },
  loader: {
    marginTop: spacing.lg,
  },
  messagePanel: {
    marginBottom: spacing.lg,
    borderColor: 'rgba(103, 217, 192, 0.35)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anonymousBadge: {
    color: '#67D9C0',
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  anonymousMessage: {
    minHeight: 140,
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 21,
    lineHeight: 31,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: spacing.xl,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  arrowButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
  },
  arrow: {
    color: colors.text,
    fontFamily: 'Inter-Medium',
    fontSize: 22,
  },
  controlLabel: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  disabled: {
    opacity: 0.35,
  },
  hostHint: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    textAlign: 'center',
  },
  authorName: {
    color: '#67D9C0',
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    marginTop: 7,
  },
  revealedMessage: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  revealedIndex: {
    color: '#67D9C0',
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  revealedContent: {
    flex: 1,
  },
  revealedText: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
  },
  peopleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  person: {
    width: 76,
    alignItems: 'center',
    gap: 4,
  },
  personName: {
    maxWidth: 76,
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  personState: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
  },
  chatPanel: {
    marginBottom: spacing.xl,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatCount: {
    color: '#67D9C0',
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  chatMessages: {
    maxHeight: 260,
    marginTop: spacing.md,
  },
  chatMessage: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatName: {
    color: '#67D9C0',
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  chatText: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  muted: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chatInput: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
  },
  sendButton: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: '#236F66',
  },
  sendText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
});