import AsyncStorage from '@react-native-async-storage/async-storage';
import { playSfx } from './soundEffects';

const PROGRESSION_STORAGE_KEY = 'gamehub_gamer_progression';

const INITIAL_STATE = {
  xp: 140,
  streak: 3,
  lastLoginDate: new Date().toISOString().slice(0, 10),
  dailyClaimed: false,
  diceRolls: 0,
  gamesPlayed: 0,
  roomsHosted: 0,
  unlockedBadges: ['first_game'],
};

export const BADGES_CATALOG = [
  {
    id: 'first_game',
    title: 'Arcade Rookie',
    emoji: '🕹️',
    description: 'Entered the GameHub arena for the first time.',
    color: '#8B5CF6',
  },
  {
    id: 'team_captain',
    title: 'Squad Leader',
    emoji: '👥',
    description: 'Divided players using the party team shuffler.',
    color: '#00F0FF',
  },
  {
    id: 'host_hero',
    title: 'Party Starter',
    emoji: '⚡',
    description: 'Created a room and brought friends together.',
    color: '#FFB800',
  },
  {
    id: 'streak_3',
    title: 'On Fire',
    emoji: '🔥',
    description: 'Maintained a 3-day active gaming streak.',
    color: '#FF2E93',
  },
  {
    id: 'social_star',
    title: 'Lore Master',
    emoji: '📜',
    description: 'Explored the GameHub tutorials and game rules.',
    color: '#10E775',
  },
  {
    id: 'deception_pro',
    title: 'Master of Shadows',
    emoji: '🕵️',
    description: 'Played a round of Deception Around Us.',
    color: '#8B5CF6',
  },
];

let cachedState = { ...INITIAL_STATE };
const listeners = new Set();

export function calculateLevel(xp) {
  const XP_PER_LEVEL = 250;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = xp % XP_PER_LEVEL;
  const progressPercent = Math.min(100, Math.floor((currentLevelXp / XP_PER_LEVEL) * 100));
  return {
    level,
    currentLevelXp,
    xpToNext: XP_PER_LEVEL - currentLevelXp,
    totalLevelXp: XP_PER_LEVEL,
    progressPercent,
  };
}

export function getRankTitle(level) {
  if (level >= 20) return 'Cyber Legend 👑';
  if (level >= 15) return 'Grand Master ⚡';
  if (level >= 10) return 'Arcade Champion 🏆';
  if (level >= 5) return 'Pixel Warrior ⚔️';
  if (level >= 3) return 'Party Scout 🎯';
  return 'Rookie Gamer 🕹️';
}

export async function loadGamerProgression() {
  try {
    const raw = await AsyncStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const today = new Date().toISOString().slice(0, 10);
      
      // Check streak
      if (parsed.lastLoginDate) {
        const lastDate = new Date(parsed.lastLoginDate);
        const currentDate = new Date(today);
        const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          parsed.streak = (parsed.streak || 1) + 1;
          parsed.dailyClaimed = false;
        } else if (diffDays > 1) {
          parsed.streak = 1;
          parsed.dailyClaimed = false;
        }
      }
      parsed.lastLoginDate = today;
      cachedState = { ...INITIAL_STATE, ...parsed };
    } else {
      cachedState = { ...INITIAL_STATE };
    }
  } catch (e) {
    cachedState = { ...INITIAL_STATE };
  }
  notifyProgression();
  return cachedState;
}

// Preload on load
loadGamerProgression();

export function getGamerStats() {
  return cachedState;
}

export function subscribeProgression(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyProgression() {
  listeners.forEach((fn) => {
    try {
      fn(cachedState);
    } catch (e) {}
  });
}

async function persist() {
  try {
    await AsyncStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(cachedState));
  } catch (e) {}
  notifyProgression();
}

export async function addXP(amount, reason = '') {
  const oldLevel = calculateLevel(cachedState.xp).level;
  cachedState.xp += amount;
  const newLevel = calculateLevel(cachedState.xp).level;

  let leveledUp = false;
  if (newLevel > oldLevel) {
    leveledUp = true;
    playSfx('levelUp');
  } else {
    playSfx('coin');
  }

  await persist();
  return { newXp: cachedState.xp, leveledUp, newLevel };
}

export async function claimDailyBonus() {
  if (cachedState.dailyClaimed) return { claimed: false };

  cachedState.dailyClaimed = true;
  cachedState.streak = (cachedState.streak || 1);
  const bonusXp = 50 + Math.min(50, cachedState.streak * 10);
  
  if (cachedState.streak >= 3 && !cachedState.unlockedBadges.includes('streak_3')) {
    cachedState.unlockedBadges.push('streak_3');
  }

  await addXP(bonusXp, 'Daily Login Bonus');
  playSfx('fanfare');
  return { claimed: true, bonusXp };
}

export async function recordTeamDivided() {
  if (!cachedState.unlockedBadges.includes('team_captain')) {
    cachedState.unlockedBadges.push('team_captain');
    playSfx('fanfare');
  }
  await addXP(15, 'Divided party into teams');
}

export async function recordRoomHosted() {
  cachedState.roomsHosted = (cachedState.roomsHosted || 0) + 1;
  if (!cachedState.unlockedBadges.includes('host_hero')) {
    cachedState.unlockedBadges.push('host_hero');
    playSfx('fanfare');
  }
  await addXP(50, 'Hosted a room');
}

export async function unlockCustomBadge(badgeId) {
  if (!cachedState.unlockedBadges.includes(badgeId)) {
    cachedState.unlockedBadges.push(badgeId);
    playSfx('fanfare');
    await addXP(50, `Unlocked badge: ${badgeId}`);
  }
}
