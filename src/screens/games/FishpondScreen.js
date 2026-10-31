import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { playSfx } from '../../utils/soundEffects';

const MAX_MESSAGE_LENGTH = 280;

function formatTime(timestamp) {
  const d = timestamp ? new Date(timestamp) : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function FishpondScreen({ navigation, route }) {
  const roomCode = route?.params?.roomCode;
  const { token, user, setActiveRoomCode } = useAuth();
  const { showToast } = useToast();
  const [game, setGame] = useState(null);
  const [message, setMessage] = useState('');
  const [chatText, setChatText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const chatScrollRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!roomCode) return null;
    try {
      const state = await getFishpondState(roomCode);
      setGame(state);
      return state;
    } catch (error) {
      if (error?.response?.status === 404) {
        await setActiveRoomCode(null);
        showToast('This Fishpond session is no longer active.');
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

  useEffect(() => {
    if (game?.chatMessages?.length) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [game?.chatMessages?.length]);

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
      showToast('Write a message before dropping it into the pond.');
      return;
    }
    playSfx('bubble');
    perform(
      () => submitFishpondMessage(roomCode, trimmed),
      'Your message gently ripples into the pond.'
    ).then((succeeded) => {
      if (succeeded) setMessage('');
    });
  }

  function handleSendChat() {
    const trimmed = chatText.trim();
    if (!trimmed) return;
    playSfx('click');
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
      showToast('You left the fishpond.', 'success');
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
      navigation.replace('Home');
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pondAqua} />
          <Text style={styles.loadingText}>Connecting to the calm pond...</Text>
        </View>
      </Screen>
    );
  }

  if (!game) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Pond Unavailable</Text>
          <Text style={styles.errorText}>This fishpond room could not be loaded.</Text>
          <GlassButton title="RETURN HOME" onPress={() => navigation.replace('Home')} />
        </View>
      </Screen>
    );
  }

  const currentUserId = user?.userId ?? user?.id ?? user?.user?.userId;
  const progressPercent = game.totalPlayers > 0
    ? Math.min(100, (game.submittedCount / game.totalPlayers) * 100)
    : 0;

  return (
    <Screen style={styles.pondBackground}>
      <View style={styles.mobileContainer}>
        {/* POND TOPBAR */}
        <View style={styles.pondHeader}>
          <View>
            <View style={styles.pondBadge}>
              <Text style={styles.pondBadgeText}>🌊 FISHPOND LAGOON · ROOM {roomCode}</Text>
            </View>
            <Text style={styles.pondTitle}>Serene Anonymous Messages</Text>
          </View>

          <View style={styles.progressBox}>
            <Text style={styles.progressCount}>{game.submittedCount}/{game.totalPlayers}</Text>
            <Text style={styles.progressSub}>IN POND</Text>
          </View>
        </View>

        {/* PROGRESS TRACK */}
        <View style={styles.rippleTrack}>
          <View style={[styles.rippleFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* SUBMISSION PHASE */}
        {game.phase === 'SUBMITTING' && (
          <GlassCard glow="cyan" style={styles.actionCard}>
            <Text style={styles.cardHeader}>YOUR ANONYMOUS POND NOTE</Text>
            {game.hasSubmitted ? (
              <View style={styles.waitingNote}>
                <Text style={styles.waitingEmoji}>🌸</Text>
                <Text style={styles.waitingTitle}>Message floating in the pond</Text>
                <Text style={styles.waitingSub}>
                  Your note is safe. When everyone finishes, notes will be revealed together.
                </Text>
                <ActivityIndicator color={colors.pondAqua} style={{ marginTop: 10 }} />
              </View>
            ) : (
              <View>
                <Text style={styles.cardDesc}>
                  Write a kind, playful compliment or mystery memory. Authors stay secret until the end!
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  maxLength={MAX_MESSAGE_LENGTH}
                  multiline
                  placeholder="Drop a kind message into the pond..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.messageInput}
                />
                <View style={styles.submitRow}>
                  <Text style={styles.charCount}>{message.length}/{MAX_MESSAGE_LENGTH}</Text>
                  <GlassButton
                    title={busy ? 'DROPPING...' : 'DROP IN POND 🌸'}
                    variant="cyan"
                    size="small"
                    onPress={handleSubmit}
                    disabled={busy || !message.trim()}
                  />
                </View>
              </View>
            )}
          </GlassCard>
        )}

        {/* READING PHASE */}
        {game.phase === 'READING' && (
          <GlassCard glow="cyan" style={styles.actionCard}>
            <View style={styles.readingHeader}>
              <Text style={styles.cardHeader}>NOTE {game.currentIndex + 1} OF {game.submittedCount}</Text>
              <View style={styles.anonPill}><Text style={styles.anonPillText}>ANONYMOUS</Text></View>
            </View>

            <View style={styles.paperCard}>
              <Text style={styles.messageBody}>"{game.currentMessage?.message}"</Text>
              {game.currentMessage?.authorName && (
                <Text style={styles.revealedAuthor}>— Written by {game.currentMessage.authorName}</Text>
              )}
            </View>

            {game.isHost ? (
              <View style={styles.hostNavRow}>
                <Pressable
                  disabled={!game.canGoBack || busy}
                  onPress={() => perform(() => navigateFishpondMessage(roomCode, 'PREVIOUS'))}
                  style={[styles.navArrowBtn, !game.canGoBack && styles.btnDisabled]}
                >
                  <Text style={styles.navArrowText}>‹ PREV</Text>
                </Pressable>

                {game.canRevealAuthors ? (
                  <GlassButton
                    title={busy ? 'REVEALING...' : 'REVEAL AUTHORS ✨'}
                    variant="gold"
                    size="small"
                    onPress={() => perform(() => revealFishpondAuthors(roomCode), 'Authors revealed.')}
                    disabled={busy}
                  />
                ) : (
                  <Pressable
                    disabled={!game.canGoNext || busy}
                    onPress={() => perform(() => navigateFishpondMessage(roomCode, 'NEXT'))}
                    style={[styles.navArrowBtn, !game.canGoNext && styles.btnDisabled]}
                  >
                    <Text style={styles.navArrowText}>NEXT ›</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Text style={styles.hostNote}>The pond host is turning the pages...</Text>
            )}
          </GlassCard>
        )}

        {/* COMPLETE PHASE */}
        {game.phase === 'COMPLETE' && (
          <GlassCard glow="cyan" style={styles.actionCard}>
            <Text style={styles.cardHeader}>ALL NOTES REVEALED 🌸</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220, marginVertical: 8 }}>
              {game.messages.map((item, idx) => (
                <View key={item.id || idx} style={styles.revealedItem}>
                  <Text style={styles.revealedQuote}>"{item.message}"</Text>
                  <Text style={styles.revealedAuthor}>— {item.authorName || 'Anonymous'}</Text>
                </View>
              ))}
            </ScrollView>
            <GlassButton title="RETURN TO LOBBY" variant="secondary" size="small" onPress={returnToLobby} />
          </GlassCard>
        )}

        {/* POND CHAT */}
        <View style={styles.pondChatSection}>
          <View style={styles.chatHeaderLine}>
            <Text style={styles.chatSectionTitle}>POND RADIO ({game.chatMessages?.length || 0})</Text>
          </View>
          <ScrollView
            ref={chatScrollRef}
            showsVerticalScrollIndicator={true}
            style={styles.chatScrollBox}
            contentContainerStyle={styles.chatScrollContent}
          >
            {(!game.chatMessages || game.chatMessages.length === 0) ? (
              <Text style={styles.emptyChatText}>No ripples yet. Say hello...</Text>
            ) : (
              game.chatMessages.map((c, i) => (
                <View key={c.id || i} style={styles.chatBubble}>
                  <View style={styles.chatBubbleTop}>
                    <Text style={styles.chatAuthor}>{c.displayName || 'Swimmer'}</Text>
                    <Text style={styles.chatTimestamp}>{formatTime(c.timestamp || c.createdAt)}</Text>
                  </View>
                  <Text style={styles.chatContent}>{c.message}</Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.chatInputBar}>
            <TextInput
              value={chatText}
              onChangeText={setChatText}
              placeholder="Ripple a message... (Press Enter to send)"
              placeholderTextColor={colors.textMuted}
              returnKeyType="send"
              onSubmitEditing={handleSendChat}
              style={styles.chatInputField}
            />
            <Pressable
              onPress={handleSendChat}
              disabled={busy || !chatText.trim()}
              style={[styles.chatSendBtn, (!chatText.trim() || busy) && styles.btnDisabled]}
            >
              <Text style={styles.chatSendText}>SEND</Text>
            </Pressable>
          </View>
        </View>

        {/* LEAVE POND FOOTER */}
        <Pressable onPress={handleLeaveGame} style={styles.leaveBtn}>
          <Text style={styles.leaveBtnText}>LEAVE FISHPOND</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pondBackground: {
    backgroundColor: '#041217',
  },
  mobileContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: 'space-between',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.pondAqua,
    fontFamily: 'Inter',
    fontSize: 13,
    marginTop: 10,
  },
  errorTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 18,
    marginBottom: 4,
  },
  errorText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 12,
    marginBottom: 16,
  },
  pondHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pondBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderWidth: 1,
    borderColor: colors.pondAqua,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  pondBadgeText: {
    color: colors.pondAqua,
    fontFamily: 'Inter-Bold',
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  pondTitle: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 16,
  },
  progressBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressCount: {
    color: colors.pondAqua,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 13,
  },
  progressSub: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 7.5,
  },
  rippleTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  rippleFill: {
    height: '100%',
    backgroundColor: colors.pondAqua,
    borderRadius: 2,
  },
  actionCard: {
    backgroundColor: 'rgba(6, 30, 38, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: {
    color: colors.pondAqua,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardDesc: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 12,
    height: 60,
    textAlignVertical: 'top',
  },
  submitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  charCount: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  waitingNote: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  waitingEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  waitingTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  waitingSub: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 2,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  anonPill: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  anonPillText: {
    color: colors.pondAqua,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
  },
  paperCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  messageBody: {
    color: colors.text,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  revealedAuthor: {
    color: colors.pondAqua,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  hostNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navArrowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  navArrowText: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  hostNote: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  revealedItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  revealedQuote: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 11.5,
  },
  pondChatSection: {
    flex: 1,
    backgroundColor: 'rgba(5, 18, 24, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 8,
    marginBottom: 8,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  chatHeaderLine: {
    marginBottom: 4,
  },
  chatSectionTitle: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  chatScrollBox: {
    flex: 1,
  },
  chatScrollContent: {
    paddingVertical: 2,
  },
  emptyChatText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 10.5,
    textAlign: 'center',
    paddingVertical: 14,
  },
  chatBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 6,
    marginBottom: 5,
  },
  chatBubbleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  chatAuthor: {
    color: colors.pondAqua,
    fontFamily: 'Inter-Bold',
    fontSize: 10.5,
  },
  chatTimestamp: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 8.5,
  },
  chatContent: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 11.5,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  chatInputField: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 11.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chatSendBtn: {
    backgroundColor: colors.pondAqua,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendText: {
    color: '#041217',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 10,
  },
  leaveBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  leaveBtnText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  btnDisabled: {
    opacity: 0.35,
  },
});
