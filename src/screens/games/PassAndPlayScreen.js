import React, { useEffect, useMemo, useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Screen from '../../components/Screen';
import GlassButton from '../../components/GlassButton';
import GlassCard from '../../components/GlassCard';
import GlassInput from '../../components/GlassInput';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const MAX_PLAYERS = 15;

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function getPredatorCount(playerCount) {
  if (playerCount <= 5) return 1;
  if (playerCount <= 8) return 2;
  if (playerCount <= 11) return 3;
  return 4;
}

function getWinner(players) {
  const alive = players.filter((player) => player.alive);
  const predators = alive.filter((player) => player.role === 'PREDATOR').length;
  const innocents = alive.length - predators;
  if (predators === 0) return 'INNOCENTS_WIN';
  if (innocents === 0 || predators >= innocents) return 'PREDATORS_WIN';
  return null;
}

export default function PassAndPlayScreen({ navigation, route }) {
  const gameSlug = route?.params?.gameSlug || 'deception-around-us';
  const isFishpond = gameSlug === 'fishpond';
  const minPlayers = isFishpond ? 3 : 4;
  const storageKey = `gamehub_passplay_${gameSlug}`;
  const { setActivePassPlay } = useAuth();
  const { showToast } = useToast();

  const [hydrated, setHydrated] = useState(false);
  const [game, setGame] = useState(null);
  const [namesText, setNamesText] = useState('');
  const [includeDoctor, setIncludeDoctor] = useState(false);
  const [includeDetective, setIncludeDetective] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [fishpondTurnReady, setFishpondTurnReady] = useState(false);
  const [hostControlsReady, setHostControlsReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (active && stored) {
          const restored = JSON.parse(stored);
          setGame({
            ...restored,
            revealed: false,
            investigation: restored.investigation
              ? { ...restored.investigation, visible: false }
              : null,
          });
        }
      })
      .catch(() => showToast('Saved local game could not be restored.'))
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => { active = false; };
  }, [showToast, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    if (game) {
      AsyncStorage.setItem(storageKey, JSON.stringify({
        ...game,
        revealed: false,
        investigation: game.investigation
          ? { ...game.investigation, visible: false }
          : null,
      }))
        .catch(() => showToast('Game progress could not be saved.'));
    } else {
      AsyncStorage.removeItem(storageKey).catch(() => {});
    }
  }, [game, hydrated, showToast, storageKey]);

  const players = game?.players || [];
  const alivePlayers = useMemo(
    () => players.filter((player) => player.alive && !player.left),
    [players]
  );

  function startLocalGame() {
    const names = namesText
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.length < minPlayers) {
      showToast(`${isFishpond ? 'Fishpond' : 'Deception'} needs at least ${minPlayers} players.`);
      return;
    }
    if (names.length > MAX_PLAYERS) {
      showToast(`Pass and play supports up to ${MAX_PLAYERS} players.`);
      return;
    }
    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
      showToast('Use a different name for each player.');
      return;
    }

    const roster = names.map((name, index) => ({
      id: `local-${index + 1}`,
      name,
      alive: true,
      left: false,
    }));

    if (isFishpond) {
      setGame({
        gameSlug,
        stage: 'FISHPOND_SUBMIT',
        players: roster,
        submissions: [],
        currentSubmitIndex: 0,
        messages: [],
        messageIndex: 0,
        authorsRevealed: false,
        chat: [],
      });
    } else {
      const roles = Array(getPredatorCount(names.length)).fill('PREDATOR');
      if (includeDoctor) roles.push('DOCTOR');
      if (includeDetective) roles.push('DETECTIVE');
      if (roles.length >= names.length) {
        showToast('These optional roles leave no room for an Innocent.');
        return;
      }
      while (roles.length < names.length) roles.push('INNOCENT');
      setGame({
        gameSlug,
        stage: 'NIGHT',
        players: shuffled(roster.map((player, index) => ({
          ...player,
          role: roles[index],
        }))),
        round: 1,
        turnIndex: 0,
        revealed: false,
        nightActions: {},
        votes: {},
        investigation: null,
        chat: [],
        winner: null,
        eliminatedId: null,
      });
    }
    setActivePassPlay(gameSlug);
    setMessageDraft('');
    setChatDraft('');
    setFishpondTurnReady(false);
    setHostControlsReady(false);
  }

  function finishDeceptionNight(currentGame) {
    const actions = Object.values(currentGame.nightActions);
    const predatorTargets = actions
      .filter((action) => action.action === 'ELIMINATE')
      .map((action) => action.targetId);
    const targetCounts = new Map();
    predatorTargets.forEach((target) => targetCounts.set(target, (targetCounts.get(target) || 0) + 1));
    const highest = Math.max(0, ...targetCounts.values());
    const winners = [...targetCounts.entries()].filter(([, count]) => count === highest);
    const predatorTarget = winners.length === 1 ? winners[0][0] : null;
    const protection = actions.find((action) => action.action === 'PROTECT')?.targetId;
    const detectiveAction = actions.find((action) => action.action === 'INVESTIGATE');
    const investigateResult = detectiveAction
      ? currentGame.players.find((player) => player.id === detectiveAction.targetId)?.role
      : null;
    const nextPlayers = currentGame.players.map((player) => (
      predatorTarget && predatorTarget === player.id && predatorTarget !== protection
        ? { ...player, alive: false }
        : player
    ));
    const winner = getWinner(nextPlayers);

    setGame({
      ...currentGame,
      players: nextPlayers,
      stage: winner
        ? 'GAME_OVER'
        : detectiveAction && nextPlayers.find((player) => player.id === detectiveAction.playerId)?.alive
          ? 'PRIVATE_RESULT'
          : 'DAY',
      winner,
      eliminatedId: predatorTarget && predatorTarget !== protection ? predatorTarget : null,
      investigation: detectiveAction ? {
        detectiveId: detectiveAction.playerId,
        targetId: detectiveAction.targetId,
        role: investigateResult,
        visible: false,
      } : null,
      detectiveName: detectiveAction
        ? currentGame.players.find((player) => player.id === detectiveAction.playerId)?.name
        : null,
      turnIndex: 0,
      revealed: false,
      votes: {},
    });
  }

  function revealCurrentTurn() {
    setGame((current) => ({ ...current, revealed: true }));
  }

  function submitNightAction(action, targetId) {
    const currentPlayer = alivePlayers[game.turnIndex];
    if (!currentPlayer) {
      finishDeceptionNight(game);
      return;
    }
    const nightActions = {
      ...game.nightActions,
      [currentPlayer.id]: { playerId: currentPlayer.id, action, targetId },
    };
    const nextIndex = game.turnIndex + 1;
    const isComplete = nextIndex >= alivePlayers.length;
    const nextGame = { ...game, nightActions, turnIndex: nextIndex, revealed: false };
    if (isComplete) finishDeceptionNight(nextGame);
    else setGame(nextGame);
  }

  function resolveVote(currentGame) {
    const voteCounts = new Map();
    Object.values(currentGame.votes).forEach((targetId) => {
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    });
    const highest = Math.max(0, ...voteCounts.values());
    const winners = [...voteCounts.entries()].filter(([, count]) => count === highest);
    const eliminatedId = winners.length === 1 ? winners[0][0] : null;
    const nextPlayers = currentGame.players.map((player) => (
      eliminatedId === player.id ? { ...player, alive: false } : player
    ));
    const winner = getWinner(nextPlayers);
    setGame({
      ...currentGame,
      players: nextPlayers,
      stage: winner ? 'GAME_OVER' : 'NIGHT',
      winner,
      eliminatedId,
      round: currentGame.round + (winner ? 0 : 1),
      turnIndex: 0,
      revealed: false,
      votes: {},
      nightActions: {},
      investigation: currentGame.investigation
        ? { ...currentGame.investigation, visible: false }
        : null,
    });
  }

  function submitVote(targetId) {
    const currentPlayer = alivePlayers[game.turnIndex];
    const votes = { ...game.votes, [currentPlayer.id]: targetId };
    const nextIndex = game.turnIndex + 1;
    const nextGame = { ...game, votes, turnIndex: nextIndex, revealed: false };
    if (nextIndex >= alivePlayers.length) resolveVote(nextGame);
    else setGame(nextGame);
  }

  function addChat() {
    const trimmed = chatDraft.trim();
    if (!trimmed) return;
    setGame((current) => ({
      ...current,
      chat: [...current.chat, {
        id: `${Date.now()}-${current.chat.length}`,
        message: trimmed,
      }],
    }));
    setChatDraft('');
  }

  function submitFishpondMessage() {
    const trimmed = messageDraft.trim();
    if (!trimmed) {
      showToast('Write a message before submitting.');
      return;
    }
    const currentPlayer = players[game.currentSubmitIndex];
    const submissions = [...game.submissions, {
      id: `${Date.now()}-${currentPlayer.id}`,
      authorId: currentPlayer.id,
      authorName: currentPlayer.name,
      message: trimmed,
    }];
    setMessageDraft('');
    setFishpondTurnReady(false);
    if (submissions.length === players.length) {
      setGame({
        ...game,
        stage: 'FISHPOND_READING',
        submissions,
        messages: shuffled(submissions),
        currentSubmitIndex: submissions.length,
        messageIndex: 0,
      });
      setHostControlsReady(false);
    } else {
      setGame({
        ...game,
        submissions,
        currentSubmitIndex: game.currentSubmitIndex + 1,
      });
      setHostControlsReady(false);
    }
  }

  function exitLocalGame() {
    setGame(null);
    setActivePassPlay(null);
    navigation.replace('GameCatalog');
  }

  function startAnotherLocalGame() {
    setGame(null);
    setNamesText('');
    setMessageDraft('');
    setChatDraft('');
  }

  if (!hydrated) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.secondaryText}>Restoring local game...</Text>
        </View>
      </Screen>
    );
  }

  if (!game) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.eyebrow}>PASS & PLAY</Text>
          <Text style={styles.title}>{isFishpond ? 'Fishpond' : 'Deception Around Us'}</Text>
          <GlassCard style={styles.panel}>
            <Text style={styles.sectionTitle}>PLAYER NAMES</Text>
            <Text style={styles.body}>
              Add one name per line. Each person uses the same device and gets a private handoff before their turn.
            </Text>
            <TextInput
              value={namesText}
              onChangeText={setNamesText}
              multiline
              placeholder={'Alex\nSam\nJordan'}
              placeholderTextColor={colors.textMuted}
              style={styles.namesInput}
            />
            {!isFishpond && (
              <>
                <Text style={styles.sectionTitle}>OPTIONAL ROLES</Text>
                <RoleToggle
                  label="Doctor"
                  description="Protect one player each night."
                  value={includeDoctor}
                  onChange={setIncludeDoctor}
                />
                <RoleToggle
                  label="Detective"
                  description="Investigate one player each night."
                  value={includeDetective}
                  onChange={setIncludeDetective}
                />
              </>
            )}
            <GlassButton title="START LOCAL GAME" onPress={startLocalGame} />
          </GlassCard>
          <GlassButton title="BACK TO GAME LIBRARY" variant="secondary" onPress={exitLocalGame} />
        </ScrollView>
      </Screen>
    );
  }

  if (isFishpond) {
    const currentSubmissionPlayer = players[game.currentSubmitIndex];
    const currentMessage = game.messages[game.messageIndex];
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.topbar}>
            <View>
              <Text style={styles.eyebrow}>LOCAL PASS & PLAY · FISHPOND</Text>
              <Text style={styles.title}>
                {game.stage === 'FISHPOND_SUBMIT' ? 'Write in secret' : 'The pond'}
              </Text>
            </View>
            <Text style={styles.progress}>{game.stage === 'FISHPOND_SUBMIT'
              ? `${game.submissions.length}/${players.length}`
              : `${game.messageIndex + 1}/${game.messages.length}`}</Text>
          </View>

          {game.stage === 'FISHPOND_SUBMIT' && currentSubmissionPlayer && (
            <GlassCard style={styles.panel}>
              <Text style={styles.sectionTitle}>PASS THE DEVICE</Text>
              <Text style={styles.handoffName}>{currentSubmissionPlayer.name}</Text>
              {!fishpondTurnReady ? (
                <>
                  <Text style={styles.body}>Only this player should see the screen before taking their turn.</Text>
                  <GlassButton title="I HAVE THE DEVICE" onPress={() => setFishpondTurnReady(true)} />
                </>
              ) : (
                <>
                  <Text style={styles.body}>Write one playful or kind message about someone in the group. Other messages stay hidden.</Text>
                  <TextInput
                    value={messageDraft}
                    onChangeText={setMessageDraft}
                    maxLength={280}
                    multiline
                    placeholder="Write your anonymous message..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.messageInput}
                  />
                  <Text style={styles.counter}>{messageDraft.length}/280</Text>
                  <GlassButton title="SUBMIT & HIDE" onPress={submitFishpondMessage} />
                </>
              )}
            </GlassCard>
          )}

          {game.stage === 'FISHPOND_READING' && currentMessage && (
            <GlassCard style={styles.panel}>
              <Text style={styles.sectionTitle}>ANONYMOUS MESSAGE</Text>
              <Text style={styles.anonymousText}>{currentMessage.message}</Text>
              {game.authorsRevealed && (
                <Text style={styles.authorName}>Written by {currentMessage.authorName}</Text>
              )}
              {!hostControlsReady ? (
                <View style={styles.hostGate}>
                  <Text style={styles.body}>Host controls are private until the host takes the device.</Text>
                  <GlassButton title={`PASS TO ${players[0]?.name || 'HOST'}`} onPress={() => setHostControlsReady(true)} />
                </View>
              ) : (
              <View style={styles.row}>
                <GlassButton
                  title="PREVIOUS"
                  variant="secondary"
                    onPress={() => {
                      setHostControlsReady(false);
                      setGame({
                    ...game,
                    messageIndex: Math.max(0, game.messageIndex - 1),
                    authorsRevealed: false,
                      });
                    }}
                  disabled={game.messageIndex === 0}
                />
                {game.messageIndex === game.messages.length - 1 ? (
                  <GlassButton
                    title={game.authorsRevealed ? 'HIDE AUTHORS' : 'REVEAL AUTHORS'}
                    onPress={() => setGame({ ...game, authorsRevealed: !game.authorsRevealed })}
                  />
                ) : (
                  <GlassButton
                    title="NEXT"
                    onPress={() => {
                      setHostControlsReady(false);
                      setGame({
                      ...game,
                      messageIndex: Math.min(game.messages.length - 1, game.messageIndex + 1),
                      authorsRevealed: false,
                      });
                    }}
                  />
                )}
              </View>
              )}
            </GlassCard>
          )}

          {game.stage === 'FISHPOND_READING' && (
            <ChatPanel
              chat={game.chat}
              draft={chatDraft}
              setDraft={setChatDraft}
              onSend={addChat}
            />
          )}
          <GlassButton title="END LOCAL GAME" variant="secondary" onPress={exitLocalGame} />
        </ScrollView>
      </Screen>
    );
  }

  if (game.stage === 'GAME_OVER') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.eyebrow}>PASS & PLAY · DECEPTION</Text>
          <Text style={styles.title}>{game.winner === 'PREDATORS_WIN' ? 'Predators win' : 'Innocents win'}</Text>
          <GlassCard style={styles.panel}>
            {players.map((player) => (
              <View key={player.id} style={styles.resultRow}>
                <View style={styles.resultIdentity}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.secondaryText}>{player.role}</Text>
                </View>
                <Text style={player.alive ? styles.aliveLabel : styles.deadLabel}>
                  {player.alive ? 'ALIVE' : 'OUT'}
                </Text>
              </View>
            ))}
          </GlassCard>
          <GlassButton title="PLAY ANOTHER ROUND" onPress={startAnotherLocalGame} />
          <GlassButton title="BACK TO GAME LIBRARY" variant="secondary" onPress={exitLocalGame} />
        </ScrollView>
      </Screen>
    );
  }

  const currentPlayer = alivePlayers[game.turnIndex];
  if (!currentPlayer) {
    if (game.stage === 'NIGHT') finishDeceptionNight(game);
    return <Screen><View style={styles.centered}><Text style={styles.secondaryText}>Resolving turn...</Text></View></Screen>;
  }

  const targetPlayers = alivePlayers.filter((player) => (
    game.stage === 'VOTING'
      ? player.id !== currentPlayer.id
      : player.id !== currentPlayer.id || currentPlayer.role === 'DOCTOR'
  ));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.eyebrow}>PASS & PLAY · DECEPTION</Text>
            <Text style={styles.title}>
              {game.stage === 'NIGHT' ? `Night ${game.round}` : game.stage === 'DAY' ? 'Day discussion' : 'Secret vote'}
            </Text>
          </View>
          <Text style={styles.progress}>{Math.min(game.turnIndex + 1, alivePlayers.length)}/{alivePlayers.length}</Text>
        </View>

        {game.stage === 'NIGHT' && !game.revealed && (
          <GlassCard style={styles.panel}>
            <Text style={styles.sectionTitle}>PRIVATE HANDOFF</Text>
            <Text style={styles.handoffName}>{currentPlayer.name}</Text>
            <Text style={styles.body}>Pass the device to this player. Only they should reveal their role.</Text>
            <GlassButton title="REVEAL MY ROLE" onPress={revealCurrentTurn} />
          </GlassCard>
        )}

        {game.stage === 'NIGHT' && game.revealed && (
          <GlassCard style={styles.panel}>
            <Text style={styles.sectionTitle}>PRIVATE TURN · {currentPlayer.name}</Text>
            <Text style={styles.roleName}>{currentPlayer.role}</Text>
            {currentPlayer.role === 'INNOCENT' ? (
              <Text style={styles.body}>You have no night action. Hide your role and pass the device.</Text>
            ) : (
              <>
                <Text style={styles.body}>
                  {currentPlayer.role === 'PREDATOR'
                    ? 'Choose one living player to target.'
                    : currentPlayer.role === 'DOCTOR'
                      ? 'Choose one living player to protect.'
                      : 'Choose one living player to investigate.'}
                </Text>
                {targetPlayers.map((target) => (
                  <Pressable
                    key={target.id}
                    onPress={() => submitNightAction(
                      currentPlayer.role === 'PREDATOR' ? 'ELIMINATE'
                        : currentPlayer.role === 'DOCTOR' ? 'PROTECT' : 'INVESTIGATE',
                      target.id
                    )}
                    style={styles.targetRow}
                  >
                    <Text style={styles.playerName}>{target.name}</Text>
                    <Text style={styles.targetArrow}>SELECT ›</Text>
                  </Pressable>
                ))}
              </>
            )}
            {currentPlayer.role === 'INNOCENT' && (
              <GlassButton title="HIDE ROLE & PASS" onPress={() => submitNightAction('NONE', null)} />
            )}
          </GlassCard>
        )}

        {game.stage === 'PRIVATE_RESULT' && (
          <GlassCard style={styles.panel}>
            <Text style={styles.sectionTitle}>PRIVATE INVESTIGATION</Text>
              <Text style={styles.handoffName}>Pass the device to {game.investigation?.detectiveName || 'the Detective'}</Text>
            {!game.investigation.visible ? (
              <GlassButton title="REVEAL RESULT" onPress={() => setGame({
                ...game,
                investigation: { ...game.investigation, visible: true },
              })} />
            ) : (
              <>
                <Text style={styles.playerName}>{players.find((player) => player.id === game.investigation.targetId)?.name}</Text>
                <Text style={styles.roleName}>{game.investigation.role}</Text>
                <GlassButton title="HIDE RESULT & START DAY" onPress={() => setGame({
                  ...game,
                  stage: 'DAY',
                  investigation: { ...game.investigation, visible: false },
                })} />
              </>
            )}
          </GlassCard>
        )}

        {game.stage === 'DAY' && (
          <>
            {game.eliminatedId && (
              <GlassCard style={styles.panel}>
                <Text style={styles.sectionTitle}>OVERNIGHT</Text>
                <Text style={styles.playerName}>
                  {players.find((player) => player.id === game.eliminatedId)?.name} was eliminated.
                </Text>
              </GlassCard>
            )}
            <GlassCard style={styles.panel}>
              <Text style={styles.sectionTitle}>DISCUSSION</Text>
              <Text style={styles.body}>Discuss in person, then pass the device to the host to begin secret voting.</Text>
              {!hostControlsReady ? (
                <>
                  <Text style={styles.handoffName}>Pass the device to {players[0]?.name || 'the host'}</Text>
                  <GlassButton title="HOST HAS THE DEVICE" onPress={() => setHostControlsReady(true)} />
                </>
              ) : (
                <GlassButton title="START SECRET VOTING" onPress={() => {
                  setHostControlsReady(false);
                  setGame({
                    ...game,
                    stage: 'VOTING',
                    turnIndex: 0,
                    revealed: false,
                    votes: {},
                  });
                }} />
              )}
            </GlassCard>
            <ChatPanel chat={game.chat} draft={chatDraft} setDraft={setChatDraft} onSend={addChat} />
          </>
        )}

        {game.stage === 'VOTING' && !game.revealed && (
          <GlassCard style={styles.panel}>
            <Text style={styles.sectionTitle}>SECRET VOTING</Text>
            <Text style={styles.handoffName}>Pass the device to {currentPlayer.name}</Text>
            <GlassButton title="READY TO VOTE" onPress={revealCurrentTurn} />
          </GlassCard>
        )}

        {game.stage === 'VOTING' && game.revealed && (
          <GlassCard style={styles.panel}>
            <Text style={styles.sectionTitle}>{currentPlayer.name} · CHOOSE A PLAYER</Text>
            {targetPlayers.map((target) => (
              <Pressable key={target.id} onPress={() => submitVote(target.id)} style={styles.targetRow}>
                <Text style={styles.playerName}>{target.name}</Text>
                <Text style={styles.targetArrow}>VOTE ›</Text>
              </Pressable>
            ))}
          </GlassCard>
        )}

        {game.stage === 'VOTING' && (
          <Text style={styles.body}>Votes stay hidden until they are counted.</Text>
        )}
        <GlassButton title="END LOCAL GAME" variant="secondary" onPress={exitLocalGame} />
      </ScrollView>
    </Screen>
  );
}

function RoleToggle({ label, description, value, onChange }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.optionRow}>
      <View style={[styles.checkbox, value && styles.checkboxOn]}>
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.flex}>
        <Text style={styles.playerName}>{label}</Text>
        <Text style={styles.secondaryText}>{description}</Text>
      </View>
    </Pressable>
  );
}

function ChatPanel({ chat, draft, setDraft, onSend }) {
  return (
    <GlassCard style={styles.panel}>
      <Text style={styles.sectionTitle}>GROUP CHAT</Text>
      <View style={styles.chatList}>
        {chat.slice(-12).map((item) => (
          <Text key={item.id} style={styles.chatLine}>{item.message}</Text>
        ))}
      </View>
      <View style={styles.chatInputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a chat message..."
          placeholderTextColor={colors.textMuted}
          style={styles.chatInput}
        />
        <Pressable onPress={onSend} style={styles.chatSend}>
          <Text style={styles.chatSendText}>SEND</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: spacing.xl,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
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
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  panel: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  namesInput: {
    minHeight: 140,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    fontFamily: 'Inter',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  secondaryText: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    marginTop: 3,
  },
  handoffName: {
    color: colors.primary,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 23,
    marginBottom: spacing.sm,
  },
  roleName: {
    color: colors.warning,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 23,
    marginBottom: spacing.md,
  },
  targetRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  playerName: {
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  targetArrow: {
    color: colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  anonymousText: {
    minHeight: 130,
    color: colors.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: spacing.lg,
  },
  authorName: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  resultIdentity: {
    gap: 4,
  },
  aliveLabel: {
    color: colors.success,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  deadLabel: {
    color: colors.danger,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  chatList: {
    maxHeight: 220,
  },
  chatLine: {
    color: colors.textSecondary,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chatInput: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  chatSend: {
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  chatSendText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
});