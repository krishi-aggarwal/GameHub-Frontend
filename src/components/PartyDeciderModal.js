import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  TextInput,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import { playSfx } from '../utils/soundEffects';
import { recordTeamDivided } from '../utils/gamerProgression';

const TEAM_NAMES = ['Alpha ⚡', 'Bravo 🔥', 'Charlie 💎', 'Delta 🌊', 'Echo 🎯', 'Foxtrot 🚀'];
const TEAM_COLORS = [
  { border: 'rgba(56, 189, 248, 0.5)', bg: 'rgba(56, 189, 248, 0.08)', text: '#38BDF8' },
  { border: 'rgba(239, 68, 68, 0.5)', bg: 'rgba(239, 68, 68, 0.08)', text: '#F87171' },
  { border: 'rgba(16, 185, 129, 0.5)', bg: 'rgba(16, 185, 129, 0.08)', text: '#34D399' },
  { border: 'rgba(245, 158, 11, 0.5)', bg: 'rgba(245, 158, 11, 0.08)', text: '#FBBF24' },
  { border: 'rgba(168, 85, 247, 0.5)', bg: 'rgba(168, 85, 247, 0.08)', text: '#C084FC' },
  { border: 'rgba(236, 72, 153, 0.5)', bg: 'rgba(236, 72, 153, 0.08)', text: '#F472B6' },
];

export default function PartyDeciderModal({ visible, onClose, initialTab = 'teams' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'teams' | 'buzzer' | 'coin' | 'picker'

  // --- 1. TEAM DIVIDER STATE ---
  const [teamCount, setTeamCount] = useState(2);
  const [teamPlayerInput, setTeamPlayerInput] = useState('');
  const [teamPlayers, setTeamPlayers] = useState(['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Riley']);
  const [dividedTeams, setDividedTeams] = useState(null);
  const [teamCopied, setTeamCopied] = useState(false);

  // --- 2. TEAM BUZZER STATE ---
  const [buzzedPlayer, setBuzzedPlayer] = useState(null);
  const [buzzerLocked, setBuzzerLocked] = useState(false);
  const [buzzerTime, setBuzzerTime] = useState(null);
  const [buzzerUserName, setBuzzerUserName] = useState('');
  const buzzerAnim = useRef(new Animated.Value(1)).current;

  // --- 3. COIN STATE ---
  const [coinResult, setCoinResult] = useState(null);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const coinAnimRot = useRef(new Animated.Value(0)).current;

  // --- 4. PICKER STATE ---
  const [pickerInput, setPickerInput] = useState('');
  const [pickerItems, setPickerItems] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [pickerWinner, setPickerWinner] = useState(null);
  const [pickerSpinning, setPickerSpinning] = useState(false);

  // --- TEAM DIVIDER ACTIONS ---
  const addTeamPlayer = () => {
    if (!teamPlayerInput.trim()) return;
    setTeamPlayers([...teamPlayers, teamPlayerInput.trim()]);
    setTeamPlayerInput('');
    playSfx('click');
  };

  const removeTeamPlayer = (idx) => {
    setTeamPlayers(teamPlayers.filter((_, i) => i !== idx));
    playSfx('click');
  };

  const shuffleAndDivideTeams = () => {
    if (teamPlayers.length < teamCount) return;
    playSfx('shuffle');

    // Fisher-Yates shuffle
    const shuffled = [...teamPlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Partition into N teams
    const teams = Array.from({ length: teamCount }, (_, i) => ({
      name: TEAM_NAMES[i % TEAM_NAMES.length],
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      members: [],
    }));

    shuffled.forEach((player, idx) => {
      teams[idx % teamCount].members.push(player);
    });

    setDividedTeams(teams);
    setTeamCopied(false);
    recordTeamDivided();
    playSfx('fanfare');
  };

  const copyTeamsToClipboard = async () => {
    if (!dividedTeams) return;
    const formatted = dividedTeams
      .map((t) => `${t.name}:\n${t.members.map((m) => ` • ${m}`).join('\n')}`)
      .join('\n\n');
    await Clipboard.setStringAsync(formatted);
    playSfx('coin');
    setTeamCopied(true);
    setTimeout(() => setTeamCopied(false), 2000);
  };

  // --- BUZZER ACTIONS ---
  const handleBuzzerPress = () => {
    if (buzzerLocked) return;

    playSfx('buzzer');
    setBuzzerLocked(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
    setBuzzerTime(timeStr);
    setBuzzedPlayer(buzzerUserName.trim() || 'Player One');

    Animated.sequence([
      Animated.timing(buzzerAnim, { toValue: 0.88, duration: 60, useNativeDriver: true }),
      Animated.spring(buzzerAnim, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
    ]).start();
  };

  const resetBuzzer = () => {
    playSfx('click');
    setBuzzedPlayer(null);
    setBuzzerLocked(false);
    setBuzzerTime(null);
  };

  // --- COIN FLIP ACTIONS ---
  const flipCoin = () => {
    if (coinFlipping) return;
    setCoinFlipping(true);
    playSfx('coin');

    coinAnimRot.setValue(0);
    Animated.timing(coinAnimRot, {
      toValue: 1080,
      duration: 550,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setCoinResult(outcome);
      setCoinFlipping(false);
    }, 500);
  };

  // --- PICKER ACTIONS ---
  const pickRandom = () => {
    if (pickerItems.length < 2 || pickerSpinning) return;
    setPickerSpinning(true);
    playSfx('start');

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pickerItems.length);
      setPickerWinner(pickerItems[randomIdx]);
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * pickerItems.length);
        setPickerWinner(pickerItems[finalIdx]);
        setPickerSpinning(false);
        playSfx('fanfare');
      }
    }, 80);
  };

  const addPickerItem = () => {
    if (!pickerInput.trim()) return;
    setPickerItems([...pickerItems, pickerInput.trim()]);
    setPickerInput('');
    playSfx('click');
  };

  const coinSpin = coinAnimRot.interpolate({
    inputRange: [0, 1080],
    outputRange: ['0deg', '1080deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.glassModal}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>PARTY UTILITIES</Text>
              <Text style={styles.title}>Game Night Tools</Text>
            </View>
            <Pressable onPress={() => { playSfx('click'); onClose(); }} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Minimalist Glass Tab Bar */}
          <View style={styles.tabBar}>
            {[
              { id: 'teams', label: '👥 Teams' },
              { id: 'buzzer', label: '🚨 Buzzer' },
              { id: 'coin', label: '🪙 Toss' },
              { id: 'picker', label: '🎯 Picker' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => { playSfx('click'); setActiveTab(tab.id); }}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentScroll}>
            {/* TAB 1: TEAM DIVIDER */}
            {activeTab === 'teams' && (
              <View style={styles.tabBody}>
                <Text style={styles.sectionHeading}>1. SELECT NUMBER OF TEAMS</Text>
                <View style={styles.teamCountRow}>
                  {[2, 3, 4, 5].map((cnt) => (
                    <Pressable
                      key={cnt}
                      onPress={() => { playSfx('click'); setTeamCount(cnt); }}
                      style={[styles.teamCountBtn, teamCount === cnt && styles.teamCountBtnActive]}
                    >
                      <Text style={[styles.teamCountText, teamCount === cnt && styles.teamCountTextActive]}>
                        {cnt} Teams
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.sectionHeading}>2. PLAYERS IN ROSTER ({teamPlayers.length})</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    value={teamPlayerInput}
                    onChangeText={setTeamPlayerInput}
                    placeholder="Add player name..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.minimalInput}
                    onSubmitEditing={addTeamPlayer}
                  />
                  <Pressable onPress={addTeamPlayer} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </Pressable>
                </View>

                {/* Player tags */}
                <View style={styles.tagsWrap}>
                  {teamPlayers.map((player, idx) => (
                    <View key={idx} style={styles.playerTag}>
                      <Text style={styles.playerTagText}>{player}</Text>
                      <Pressable onPress={() => removeTeamPlayer(idx)}>
                        <Text style={styles.removeTag}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={shuffleAndDivideTeams}
                  style={({ pressed }) => [styles.primaryGlassBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.primaryGlassBtnText}>🎲 SHUFFLE & DIVIDE INTO {teamCount} TEAMS</Text>
                </Pressable>

                {/* Divided Teams Output */}
                {dividedTeams && (
                  <View style={styles.teamsResultBox}>
                    <View style={styles.teamsHeaderRow}>
                      <Text style={styles.teamsHeaderTitle}>ASSIGNED TEAMS</Text>
                      <Pressable onPress={copyTeamsToClipboard} style={styles.copyBtn}>
                        <Text style={styles.copyBtnText}>{teamCopied ? 'COPIED! ✓' : '📋 COPY'}</Text>
                      </Pressable>
                    </View>

                    <View style={styles.teamsGrid}>
                      {dividedTeams.map((team, idx) => (
                        <View
                          key={idx}
                          style={[styles.teamCard, { borderColor: team.color.border, backgroundColor: team.color.bg }]}
                        >
                          <Text style={[styles.teamTitle, { color: team.color.text }]}>{team.name}</Text>
                          {team.members.map((member, mIdx) => (
                            <Text key={mIdx} style={styles.teamMemberText}>• {member}</Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: TEAM BUZZER */}
            {activeTab === 'buzzer' && (
              <View style={styles.buzzerBody}>
                <TextInput
                  value={buzzerUserName}
                  onChangeText={setBuzzerUserName}
                  placeholder="Your Name (optional)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.minimalInput, { marginBottom: 20, textAlign: 'center' }]}
                />

                <Animated.View style={{ transform: [{ scale: buzzerAnim }] }}>
                  <Pressable
                    onPress={handleBuzzerPress}
                    disabled={buzzerLocked}
                    style={[styles.buzzerButton, buzzerLocked && styles.buzzerLockedBtn]}
                  >
                    <View style={[styles.buzzerGlow, buzzerLocked && styles.buzzerLockedGlow]} />
                    <Text style={styles.buzzerEmoji}>{buzzerLocked ? '🔒' : '🚨'}</Text>
                    <Text style={styles.buzzerText}>{buzzerLocked ? 'BUZZED!' : 'BUZZ IN'}</Text>
                  </Pressable>
                </Animated.View>

                {buzzerLocked && (
                  <View style={styles.buzzerResultCard}>
                    <Text style={styles.buzzerKicker}>FIRST TO BUZZ IN</Text>
                    <Text style={styles.buzzedPlayerName}>{buzzedPlayer} ⚡</Text>
                    <Text style={styles.buzzerTimestamp}>Locked at {buzzerTime}</Text>

                    <Pressable onPress={resetBuzzer} style={styles.resetBuzzerBtn}>
                      <Text style={styles.resetBuzzerText}>RESET FOR NEXT ROUND ↻</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: COIN TOSS */}
            {activeTab === 'coin' && (
              <View style={styles.coinBody}>
                <View style={styles.coinStage}>
                  <Animated.View style={[styles.coinDisc, { transform: [{ rotateY: coinSpin }] }]}>
                    <Text style={styles.coinIcon}>{coinResult === 'HEADS' ? '👑' : '⚔️'}</Text>
                    <Text style={styles.coinLabel}>{coinResult ?? 'TOSS'}</Text>
                  </Animated.View>
                </View>

                <Pressable
                  onPress={flipCoin}
                  disabled={coinFlipping}
                  style={({ pressed }) => [styles.primaryGlassBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.primaryGlassBtnText}>
                    {coinFlipping ? 'FLIPPING...' : '🪙 FLIP COIN'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* TAB 4: PLAYER PICKER */}
            {activeTab === 'picker' && (
              <View style={styles.tabBody}>
                <View style={styles.inputRow}>
                  <TextInput
                    value={pickerInput}
                    onChangeText={setPickerInput}
                    placeholder="Add option or player..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.minimalInput}
                    onSubmitEditing={addPickerItem}
                  />
                  <Pressable onPress={addPickerItem} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </Pressable>
                </View>

                <View style={styles.tagsWrap}>
                  {pickerItems.map((item, idx) => (
                    <View key={idx} style={styles.playerTag}>
                      <Text style={styles.playerTagText}>{item}</Text>
                      <Pressable onPress={() => setPickerItems(pickerItems.filter((_, i) => i !== idx))}>
                        <Text style={styles.removeTag}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>

                <View style={styles.pickerDisplay}>
                  <Text style={styles.pickerKicker}>CHOSEN WINNER</Text>
                  <Text style={styles.pickerWinnerText}>
                    {pickerWinner ? `🎉 ${pickerWinner} 🎉` : 'Spin to choose someone!'}
                  </Text>
                </View>

                <Pressable
                  onPress={pickRandom}
                  disabled={pickerSpinning || pickerItems.length < 2}
                  style={({ pressed }) => [styles.primaryGlassBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.primaryGlassBtnText}>
                    {pickerSpinning ? 'SELECTING...' : '🎯 PICK A RANDOM PLAYER'}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  glassModal: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 18,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.6)',
  },
  tabLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  tabLabelActive: {
    color: colors.white,
  },
  contentScroll: {
    paddingBottom: 10,
  },
  tabBody: {
    paddingTop: 4,
  },
  sectionHeading: {
    color: colors.textMuted,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  teamCountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  teamCountBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  teamCountBtnActive: {
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  teamCountText: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  teamCountTextActive: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  minimalInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  playerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  playerTagText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
  removeTag: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  primaryGlassBtn: {
    backgroundColor: colors.primary,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryGlassBtnText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  teamsResultBox: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 14,
  },
  teamsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamsHeaderTitle: {
    color: colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  copyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  copyBtnText: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  teamsGrid: {
    gap: 8,
  },
  teamCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  teamTitle: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 12,
    marginBottom: 4,
  },
  teamMemberText: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 16,
  },

  /* BUZZER STYLES */
  buzzerBody: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  buzzerButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#DC2626',
    borderWidth: 4,
    borderColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  buzzerLockedBtn: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
    shadowOpacity: 0,
  },
  buzzerGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  buzzerLockedGlow: {
    backgroundColor: 'transparent',
  },
  buzzerEmoji: {
    fontSize: 42,
  },
  buzzerText: {
    color: colors.white,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 16,
    letterSpacing: 1,
    marginTop: 4,
  },
  buzzerResultCard: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: 14,
    width: '100%',
  },
  buzzerKicker: {
    color: '#F87171',
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
  },
  buzzedPlayerName: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 20,
    marginTop: 2,
  },
  buzzerTimestamp: {
    color: colors.textMuted,
    fontFamily: 'Inter',
    fontSize: 11,
    marginTop: 2,
  },
  resetBuzzerBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetBuzzerText: {
    color: colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },

  /* COIN STYLES */
  coinBody: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  coinStage: {
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinDisc: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#78350F',
    borderWidth: 2.5,
    borderColor: colors.neonAmber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neonAmber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  coinIcon: {
    fontSize: 32,
  },
  coinLabel: {
    color: colors.neonAmber,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 1,
  },

  /* PICKER STYLES */
  pickerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  pickerKicker: {
    color: colors.neonCyan,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  pickerWinnerText: {
    color: colors.text,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 14,
  },
});
