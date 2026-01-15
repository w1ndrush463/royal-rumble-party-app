import { atom } from 'nanostores';
import type { MatchState, Wrestler, User, RumbleMatch } from '../types';

// Import initial data
import initialMatchState from '../data/match-state.json';
import wrestlersData from '../data/wrestlers.json';

// Wrestlers map for quick lookup
export const $wrestlers = atom<Wrestler[]>(wrestlersData.wrestlers as Wrestler[]);

// Get wrestler by ID
export function getWrestler(id: string): Wrestler | undefined {
  return $wrestlers.get().find(w => w.id === id);
}

// Current match state
export const $matchState = atom<MatchState>(initialMatchState as MatchState);

// Current user (selected in UI)
export const $currentUser = atom<User | null>(null);

// Set current user from localStorage
export function initCurrentUser() {
  if (typeof window === 'undefined') return;

  const userId = localStorage.getItem('selectedUserId');
  const userName = localStorage.getItem('selectedUserName');

  if (userId && userName) {
    const users = $matchState.get().users;
    const user = users.find(u => u.id === userId);
    if (user) {
      $currentUser.set(user);
    }
  }
}

// Match state helpers
export function getMensRumble(): RumbleMatch {
  return $matchState.get().mensRumble;
}

export function getWomensRumble(): RumbleMatch {
  return $matchState.get().womensRumble;
}

// Get entrants for a rumble as wrestlers
export function getEntrantWrestlers(rumble: RumbleMatch): { entryNumber: number; wrestler: Wrestler }[] {
  const entrants: { entryNumber: number; wrestler: Wrestler }[] = [];

  for (const [entryNum, wrestlerId] of Object.entries(rumble.entrants)) {
    const wrestler = getWrestler(wrestlerId);
    if (wrestler) {
      entrants.push({
        entryNumber: parseInt(entryNum),
        wrestler,
      });
    }
  }

  return entrants.sort((a, b) => a.entryNumber - b.entryNumber);
}

// Get wrestlers currently in the ring (entered but not eliminated)
export function getWrestlersInRing(rumble: RumbleMatch): { entryNumber: number; wrestler: Wrestler }[] {
  const entrants = getEntrantWrestlers(rumble);
  return entrants.filter(e => !rumble.eliminations.includes(e.wrestler.id));
}

// Get eliminated wrestlers in elimination order
export function getEliminatedWrestlers(rumble: RumbleMatch): { entryNumber: number; wrestler: Wrestler }[] {
  const entrants = getEntrantWrestlers(rumble);
  return rumble.eliminations.map(eliminatedId => {
    return entrants.find(e => e.wrestler.id === eliminatedId)!;
  }).filter(Boolean);
}

// Get user's lottery numbers for a rumble
export function getUserLotteryNumbers(userId: string, rumbleType: 'mens' | 'womens'): number[] {
  const rumble = rumbleType === 'mens' ? getMensRumble() : getWomensRumble();
  const numbers: number[] = [];

  for (const [entryNum, assignedUserId] of Object.entries(rumble.assignments)) {
    if (assignedUserId === userId) {
      numbers.push(parseInt(entryNum));
    }
  }

  return numbers.sort((a, b) => a - b);
}

// Check if a wrestler belongs to current user
export function isUserWrestler(wrestlerId: string, rumbleType: 'mens' | 'womens'): boolean {
  const currentUser = $currentUser.get();
  if (!currentUser) return false;

  const rumble = rumbleType === 'mens' ? getMensRumble() : getWomensRumble();

  // Find the entry number for this wrestler
  for (const [entryNum, wId] of Object.entries(rumble.entrants)) {
    if (wId === wrestlerId) {
      // Check if user has this entry number
      return rumble.assignments[entryNum] === currentUser.id;
    }
  }

  return false;
}

// Admin actions (to be called from admin panel)
export function addEntrant(rumbleType: 'mens' | 'womens', wrestlerId: string) {
  const state = $matchState.get();
  const rumble = rumbleType === 'mens' ? state.mensRumble : state.womensRumble;

  const nextEntry = rumble.currentEntryNumber + 1;
  if (nextEntry > 30) return;

  const newRumble = {
    ...rumble,
    entrants: { ...rumble.entrants, [nextEntry]: wrestlerId },
    currentEntryNumber: nextEntry,
    status: 'in_progress' as const,
    matchStartTime: rumble.matchStartTime || new Date().toISOString(),
  };

  $matchState.set({
    ...state,
    [rumbleType === 'mens' ? 'mensRumble' : 'womensRumble']: newRumble,
    lastUpdated: new Date().toISOString(),
  });
}

export function eliminateWrestler(rumbleType: 'mens' | 'womens', wrestlerId: string) {
  const state = $matchState.get();
  const rumble = rumbleType === 'mens' ? state.mensRumble : state.womensRumble;

  if (rumble.eliminations.includes(wrestlerId)) return;

  const newRumble = {
    ...rumble,
    eliminations: [...rumble.eliminations, wrestlerId],
  };

  // Check if match is complete (all but 1 eliminated and all 30 entered)
  const inRingCount = Object.keys(newRumble.entrants).length - newRumble.eliminations.length;
  if (inRingCount === 1 && newRumble.currentEntryNumber === 30) {
    // Find the winner
    const remainingId = Object.values(newRumble.entrants).find(
      id => !newRumble.eliminations.includes(id)
    );
    newRumble.winner = remainingId || null;
    newRumble.status = 'completed';
  }

  $matchState.set({
    ...state,
    [rumbleType === 'mens' ? 'mensRumble' : 'womensRumble']: newRumble,
    lastUpdated: new Date().toISOString(),
  });
}

export function resetRumble(rumbleType: 'mens' | 'womens') {
  const state = $matchState.get();

  const resetRumble: RumbleMatch = {
    status: 'not_started',
    assignments: rumbleType === 'mens' ? state.mensRumble.assignments : state.womensRumble.assignments,
    entrants: {},
    eliminations: [],
    eliminationDetails: [],
    winner: null,
    currentEntryNumber: 0,
    matchStartTime: null,
  };

  $matchState.set({
    ...state,
    [rumbleType === 'mens' ? 'mensRumble' : 'womensRumble']: resetRumble,
    lastUpdated: new Date().toISOString(),
  });
}

// Lottery functions
export function assignLotteryNumber(userId: string, entryNumber: number, rumbleType: 'mens' | 'womens') {
  const state = $matchState.get();
  const rumble = rumbleType === 'mens' ? state.mensRumble : state.womensRumble;

  const newRumble = {
    ...rumble,
    assignments: { ...rumble.assignments, [entryNumber]: userId },
  };

  $matchState.set({
    ...state,
    [rumbleType === 'mens' ? 'mensRumble' : 'womensRumble']: newRumble,
    lastUpdated: new Date().toISOString(),
  });
}

export function clearAllAssignments(rumbleType: 'mens' | 'womens') {
  const state = $matchState.get();
  const rumble = rumbleType === 'mens' ? state.mensRumble : state.womensRumble;

  const newRumble = {
    ...rumble,
    assignments: {},
  };

  $matchState.set({
    ...state,
    [rumbleType === 'mens' ? 'mensRumble' : 'womensRumble']: newRumble,
    lastUpdated: new Date().toISOString(),
  });
}

// Random lottery draw for all users
export function performLotteryDraw(rumbleType: 'mens' | 'womens') {
  const state = $matchState.get();
  const users = state.users;

  // Create array of numbers 1-30
  const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

  // Shuffle the numbers
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  // Assign 2 numbers to each of 15 users
  const assignments: Record<string, string> = {};
  let numberIndex = 0;

  users.forEach(user => {
    // Each user gets 2 numbers
    assignments[numbers[numberIndex]] = user.id;
    assignments[numbers[numberIndex + 1]] = user.id;
    numberIndex += 2;
  });

  const rumble = rumbleType === 'mens' ? state.mensRumble : state.womensRumble;
  const newRumble = {
    ...rumble,
    assignments,
  };

  $matchState.set({
    ...state,
    [rumbleType === 'mens' ? 'mensRumble' : 'womensRumble']: newRumble,
    lastUpdated: new Date().toISOString(),
  });

  return assignments;
}
