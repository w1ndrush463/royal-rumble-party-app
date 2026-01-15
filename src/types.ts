// Wrestler data types
export interface RumbleWin {
  year: number;
  entryNumber: number;
}

export interface NotableStats {
  ironmanTime?: string;
  mostEliminations?: number;
  careerEliminations?: number;
  mostAppearances?: boolean;
  famousFor?: string;
}

export interface Wrestler {
  id: string;
  name: string;
  promotion: 'WWE' | 'AEW' | 'TNA' | 'NXT' | 'Evolve' | 'EVE' | 'Shimmer' | 'WXW' | 'Progress';
  brand: 'Raw' | 'SmackDown' | 'NXT' | null;
  gender: 'male' | 'female';
  imageUrl: string;
  isCurrentChampion: boolean;
  championships: string[];
  isFormerChampion: boolean;
  isFormerRumbleWinner: boolean;
  rumbleWins: RumbleWin[];
  rumbleAppearances: number;
  notableStats?: NotableStats;
  isHallOfFamer?: boolean;
  isLegend?: boolean;
}

// User types
export interface User {
  id: string;
  name: string;
  avatar: string;
}

// Match state types
export type MatchStatus = 'not_started' | 'in_progress' | 'completed';

export interface EliminationDetail {
  wrestlerId: string;
  eliminatedBy: string | null;
  entryNumber: number;
  timeInRing?: string;
  eliminationOrder: number;
}

export interface RumbleMatch {
  status: MatchStatus;
  assignments: Record<string, string>; // entry number -> userId
  entrants: Record<string, string>; // entry number -> wrestlerId
  eliminations: string[]; // array of wrestlerIds in elimination order
  eliminationDetails: EliminationDetail[];
  winner: string | null; // wrestlerId
  currentEntryNumber: number;
  matchStartTime: string | null;
}

export interface MatchState {
  users: User[];
  mensRumble: RumbleMatch;
  womensRumble: RumbleMatch;
  predictions: Record<string, UserPredictions>;
  lastUpdated: string | null;
}

// Prediction types
export type PredictionType =
  | 'winner'
  | 'next_elimination'
  | 'quick_elimination'
  | 'kofi_save'
  | 'lucky_27_wins'
  | 'surprise_legend'
  | 'most_eliminations'
  | 'final_four'
  | 'champion_enters'
  | 'iron_man';

export interface Prediction {
  type: PredictionType;
  value: string | string[] | boolean;
  timestamp: string;
  resolved: boolean;
  correct: boolean | null;
  points: number;
}

export interface UserPredictions {
  mensRumble: Prediction[];
  womensRumble: Prediction[];
}

// Lottery types
export interface LotteryDraw {
  userId: string;
  numbers: {
    mensRumble: number[];
    womensRumble: number[];
  };
  drawnAt: string;
}

// Stats types
export interface UserStats {
  userId: string;
  totalRingTime: number; // seconds
  totalEliminations: number;
  correctPredictions: number;
  totalPredictions: number;
  lotteryWins: number;
  points: number;
}

// Historical data types
export interface LuckyNumber {
  wins: number;
  winners: string[];
}

export interface RumbleRecord {
  wrestler: string | string[];
  count?: number;
  time?: string;
  year?: number;
  note?: string;
  age?: number;
  years?: number[];
}

export interface Trope {
  name: string;
  description: string;
  famousExamples?: string[];
  note?: string;
}

export interface RumbleHistory {
  luckyNumbers: {
    description: string;
    men: Record<string, LuckyNumber>;
    women: Record<string, LuckyNumber>;
    neverWon: number[];
  };
  records: {
    men: Record<string, RumbleRecord>;
    women: Record<string, RumbleRecord>;
  };
  multiTimeWinners: {
    men: { wrestler: string; wins: number }[];
    women: { wrestler: string; wins: number }[];
  };
  backToBackWinners: { wrestler: string; years: number[] }[];
  famousFinalFour: Record<string, string[]>;
  tropes: Trope[];
}
