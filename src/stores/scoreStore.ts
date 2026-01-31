import { computed } from 'nanostores';
import { $matchState } from './matchStore';
import type { MatchState, RumbleMatch, User } from '../types';

// Points constants
const POINTS_LOTTERY_WINNER = 50;
const POINTS_FINAL_FOUR = 20;
const POINTS_PER_MINUTE = 1;
const POINTS_CORRECT_PREDICTION = 10;

export interface UserScore {
  userId: string;
  name: string;
  avatar: string;
  total: number;
  breakdown: {
    lotteryWinner: number;
    finalFour: number;
    ringTime: number;
    predictions: number;
  };
  details: string[];
}

// Get entry numbers assigned to a user for a rumble
function getUserEntryNumbers(rumble: RumbleMatch, userId: string): number[] {
  return Object.entries(rumble.assignments)
    .filter(([, uid]) => uid === userId)
    .map(([num]) => parseInt(num));
}

// Get wrestler IDs assigned to a user (via lottery numbers -> entrants)
function getUserWrestlerIds(rumble: RumbleMatch, userId: string): string[] {
  const entryNumbers = getUserEntryNumbers(rumble, userId);
  return entryNumbers
    .map(num => rumble.entrants[num])
    .filter(Boolean);
}

// Calculate ring time points for a user's wrestlers in a single rumble
function calcRingTimePoints(rumble: RumbleMatch, userId: string): number {
  if (rumble.status === 'not_started') return 0;

  const wrestlerIds = getUserWrestlerIds(rumble, userId);
  if (wrestlerIds.length === 0) return 0;

  let totalMinutes = 0;
  const now = new Date();

  for (const wrestlerId of wrestlerIds) {
    const entryTime = rumble.entryTimestamps?.[wrestlerId];
    if (!entryTime) continue;

    // Check if wrestler has been eliminated (find in eliminationDetails for time)
    const detail = rumble.eliminationDetails.find(d => d.wrestlerId === wrestlerId);
    if (detail?.timeInRing) {
      // Parse "M:SS" format
      const parts = detail.timeInRing.split(':');
      totalMinutes += parseInt(parts[0]) + parseInt(parts[1]) / 60;
    } else if (!rumble.eliminations.includes(wrestlerId)) {
      // Still in the ring - calculate live time
      const seconds = (now.getTime() - new Date(entryTime).getTime()) / 1000;
      totalMinutes += seconds / 60;
    }
  }

  return Math.floor(totalMinutes) * POINTS_PER_MINUTE;
}

// Check if user's wrestler won the rumble
function calcLotteryWinnerPoints(rumble: RumbleMatch, userId: string): number {
  if (rumble.status !== 'completed' || !rumble.winner) return 0;

  const wrestlerIds = getUserWrestlerIds(rumble, userId);
  return wrestlerIds.includes(rumble.winner) ? POINTS_LOTTERY_WINNER : 0;
}

// Check if user's wrestlers made the final four
function calcFinalFourPoints(rumble: RumbleMatch, userId: string): number {
  if (rumble.status === 'not_started') return 0;

  const totalEntrants = Object.keys(rumble.entrants).length;
  if (totalEntrants < 4) return 0;

  // Final four = the wrestlers eliminated last (positions totalEntrants-3 through totalEntrants)
  // Plus the winner if match is completed
  const allWrestlerIds = Object.values(rumble.entrants);
  const eliminated = rumble.eliminations;

  // If match not complete and fewer than totalEntrants-1 eliminated, we can't determine final four yet
  // Unless all 30 have entered and we're down to 4 or fewer
  const inRingCount = totalEntrants - eliminated.length;

  let finalFourIds: string[];
  if (rumble.status === 'completed') {
    // Last 3 eliminated + winner
    const lastThreeEliminated = eliminated.slice(-3);
    finalFourIds = [...lastThreeEliminated, rumble.winner!];
  } else if (inRingCount <= 4 && rumble.currentEntryNumber === 30) {
    // Currently in final four (live)
    finalFourIds = allWrestlerIds.filter(id => !eliminated.includes(id));
  } else {
    return 0;
  }

  const userWrestlerIds = getUserWrestlerIds(rumble, userId);
  const inFinalFour = userWrestlerIds.filter(id => finalFourIds.includes(id));
  return inFinalFour.length * POINTS_FINAL_FOUR;
}

// Score predictions for a single rumble
function calcPredictionPoints(rumble: RumbleMatch, predictions: Record<string, string>, rumblePrefix: string): { points: number; details: string[] } {
  if (rumble.status !== 'completed') return { points: 0, details: [] };

  let points = 0;
  const details: string[] = [];

  // Winner prediction
  const winnerPred = predictions[`${rumblePrefix}-winner`];
  if (winnerPred && rumble.winner && winnerPred === rumble.winner) {
    points += POINTS_CORRECT_PREDICTION;
    details.push(`Correct ${rumblePrefix} winner prediction`);
  }

  // First elimination
  const firstElimPred = predictions[`${rumblePrefix}-first-elim`];
  if (firstElimPred && rumble.eliminations.length > 0 && firstElimPred === rumble.eliminations[0]) {
    points += POINTS_CORRECT_PREDICTION;
    details.push(`Correct ${rumblePrefix} first elimination`);
  }

  // Final two prediction
  const final1 = predictions[`${rumblePrefix}-final-1`];
  const final2 = predictions[`${rumblePrefix}-final-2`];
  if (final1 && final2 && rumble.eliminations.length >= 2) {
    // The final two are: the winner + the last person eliminated
    const lastEliminated = rumble.eliminations[rumble.eliminations.length - 1];
    const finalTwoActual = [rumble.winner, lastEliminated].filter(Boolean);
    const finalTwoPred = [final1, final2];
    // Both must match (order doesn't matter)
    if (finalTwoPred.every(p => finalTwoActual.includes(p))) {
      points += POINTS_CORRECT_PREDICTION;
      details.push(`Correct ${rumblePrefix} final two`);
    }
  }

  // Final four prediction
  const f4Preds = [1, 2, 3, 4]
    .map(i => predictions[`${rumblePrefix}-final4-${i}`])
    .filter(Boolean);
  if (f4Preds.length === 4) {
    const lastThreeElim = rumble.eliminations.slice(-3);
    const finalFourActual = [...lastThreeElim, rumble.winner].filter(Boolean);
    const correctCount = f4Preds.filter(p => finalFourActual.includes(p)).length;
    if (correctCount === 4) {
      points += POINTS_CORRECT_PREDICTION;
      details.push(`Correct ${rumblePrefix} final four`);
    }
  }

  return { points, details };
}

// Score special (yes/no) predictions
function calcSpecialPredictionPoints(state: MatchState, predictions: Record<string, string>): { points: number; details: string[] } {
  let points = 0;
  const details: string[] = [];

  // Only score when at least one rumble is completed
  const mensCompleted = state.mensRumble.status === 'completed';
  const womensCompleted = state.womensRumble.status === 'completed';
  if (!mensCompleted && !womensCompleted) return { points, details };

  // Lucky #27 wins
  const lucky27Pred = predictions['lucky27'];
  if (lucky27Pred) {
    const mens27Winner = state.mensRumble.entrants['27'] === state.mensRumble.winner;
    const womens27Winner = state.womensRumble.entrants['27'] === state.womensRumble.winner;
    const did27Win = mens27Winner || womens27Winner;
    // Only score if both rumbles completed (since it's "either rumble")
    if (mensCompleted && womensCompleted) {
      if ((lucky27Pred === 'yes' && did27Win) || (lucky27Pred === 'no' && !did27Win)) {
        points += POINTS_CORRECT_PREDICTION;
        details.push('Correct #27 prediction');
      }
    }
  }

  // Champion enters - check if any champion wrestler is in entrants
  const championPred = predictions['champion-enters'];
  if (championPred && mensCompleted && womensCompleted) {
    // This would need wrestler data to check isCurrentChampion
    // For now, skip - would need wrestler data passed in
  }

  return { points, details };
}

// Load predictions for a user from localStorage
function loadUserPredictions(userId: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(`predictions-${userId}`);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// Compute all scores - reactive computed store
export const $leaderboard = computed($matchState, (state): UserScore[] => {
  return state.users.map(user => {
    const predictions = loadUserPredictions(user.id);

    // Lottery winner points (both rumbles)
    const mensLotteryWinner = calcLotteryWinnerPoints(state.mensRumble, user.id);
    const womensLotteryWinner = calcLotteryWinnerPoints(state.womensRumble, user.id);
    const lotteryWinner = mensLotteryWinner + womensLotteryWinner;

    // Final four points (both rumbles)
    const mensFinalFour = calcFinalFourPoints(state.mensRumble, user.id);
    const womensFinalFour = calcFinalFourPoints(state.womensRumble, user.id);
    const finalFour = mensFinalFour + womensFinalFour;

    // Ring time points (both rumbles)
    const mensRingTime = calcRingTimePoints(state.mensRumble, user.id);
    const womensRingTime = calcRingTimePoints(state.womensRumble, user.id);
    const ringTime = mensRingTime + womensRingTime;

    // Prediction points
    const mensPredsResult = calcPredictionPoints(state.mensRumble, predictions, 'mens');
    const womensPredsResult = calcPredictionPoints(state.womensRumble, predictions, 'womens');
    const specialPredsResult = calcSpecialPredictionPoints(state, predictions);
    const predictionPoints = mensPredsResult.points + womensPredsResult.points + specialPredsResult.points;
    const predDetails = [...mensPredsResult.details, ...womensPredsResult.details, ...specialPredsResult.details];

    const details: string[] = [];
    if (lotteryWinner > 0) details.push(`Lottery winner: +${lotteryWinner}`);
    if (finalFour > 0) details.push(`Final four: +${finalFour}`);
    if (ringTime > 0) details.push(`Ring time: +${ringTime}`);
    if (predictionPoints > 0) details.push(...predDetails);

    return {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      total: lotteryWinner + finalFour + ringTime + predictionPoints,
      breakdown: {
        lotteryWinner,
        finalFour,
        ringTime,
        predictions: predictionPoints,
      },
      details,
    };
  }).sort((a, b) => b.total - a.total);
});
