// ─── Game Types ──────────────────────────────────────────────
// "Station Challenge" — trivia + operations knowledge game

import type { UserRole } from './chat';

export type GameCategory =
  | 'fleet'        // 🚗 Vehicle knowledge
  | 'reservations' // 📋 Procedures
  | 'cleaning'     // 🧹 Wash protocols
  | 'safety'       // 🛡️ Safety / emergency
  | 'station'      // 🏢 Station operations
  | 'general'      // 🌍 General knowledge
  | 'logic';       // 🧠 Logic puzzles

export type QuestionType = 'multiple_choice' | 'true_false' | 'estimate';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type GameMode = 'daily_sprint' | 'weekly_tournament' | 'practice' | 'duel' | 'team_battle' | 'speed_run';

export interface GameQuestion {
  id: string;
  text: string;
  textEn?: string;
  type: QuestionType;
  category: GameCategory;
  difficulty: Difficulty;
  options: string[];                // 2-4 answer options
  correctIndex: number;             // index in options[]
  explanation?: string;             // shown after answering
  imageUrl?: string;                // optional image question
  timeLimitSec: number;             // per-question timer
  createdBy?: string;               // author userId
  stats: QuestionStats;
}

export interface QuestionStats {
  timesAsked: number;
  timesCorrect: number;
  avgTimeMs: number;
}

// ─── Player progression ──

export type PlayerLevel =
  | 'rookie'      // 0-99 XP
  | 'agent'       // 100-499
  | 'specialist'  // 500-1499
  | 'expert'      // 1500-3999
  | 'master'      // 4000-9999
  | 'legend';     // 10000+

export interface PlayerProfile {
  userId: string;
  xp: number;
  level: PlayerLevel;
  streak: number;                   // consecutive daily plays
  longestStreak: number;
  lastPlayedDate: string;           // ISO date e.g. "2026-02-15"
  badges: Badge[];
  gamesPlayed: number;
  totalCorrect: number;
  totalAnswered: number;
  avgResponseMs: number;
  categoryScores: Record<GameCategory, { correct: number; total: number }>;
  teamId?: 'ΟΜΑΔΑ Α' | 'ΟΜΑΔΑ Β';
}

export interface Badge {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  earnedAt: string;
}

// ─── Game session ──

export interface GameSession {
  id: string;
  mode: GameMode;
  playerId: string;
  opponentId?: string;              // for duels
  questions: GameQuestion[];
  answers: GameAnswer[];
  currentIndex: number;
  startedAt: string;
  finishedAt?: string;
  score: number;
  maxScore: number;
  isComplete: boolean;
}

export interface GameAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  timeMs: number;
  answeredAt: string;
}

// ─── Leaderboard ──

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string;
  team: string;
  score: number;
  gamesPlayed: number;
  accuracy: number;
  streak: number;
  rank: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

// ─── Helpers ──

export function getLevel(xp: number): PlayerLevel {
  if (xp >= 10000) return 'legend';
  if (xp >= 4000) return 'master';
  if (xp >= 1500) return 'expert';
  if (xp >= 500) return 'specialist';
  if (xp >= 100) return 'agent';
  return 'rookie';
}

export function getLevelInfo(level: PlayerLevel): { label: string; labelEn: string; icon: string; color: string; minXp: number } {
  switch (level) {
    case 'rookie':     return { label: 'Νέος',         labelEn: 'Rookie',     icon: '🌱', color: '#6b7280', minXp: 0 };
    case 'agent':      return { label: 'Πράκτορας',    labelEn: 'Agent',      icon: '🎯', color: '#3b82f6', minXp: 100 };
    case 'specialist': return { label: 'Ειδικός',      labelEn: 'Specialist', icon: '⭐', color: '#8b5cf6', minXp: 500 };
    case 'expert':     return { label: 'Έμπειρος',     labelEn: 'Expert',     icon: '🏅', color: '#f59e0b', minXp: 1500 };
    case 'master':     return { label: 'Master',       labelEn: 'Master',     icon: '👑', color: '#ef4444', minXp: 4000 };
    case 'legend':     return { label: 'Θρύλος',       labelEn: 'Legend',     icon: '🔥', color: '#ec4899', minXp: 10000 };
  }
}

export function xpForCorrectAnswer(difficulty: Difficulty, timeMs: number, timeLimitSec: number): number {
  const baseXp = difficulty * 10;                        // 10-50
  const speedBonus = Math.max(0, Math.floor((timeLimitSec * 1000 - timeMs) / 1000));
  return baseXp + speedBonus;
}

export const GAME_CATEGORIES_INFO: Record<GameCategory, { label: string; labelEn: string; icon: string; color: string }> = {
  fleet:        { label: 'Στόλος',       labelEn: 'Fleet',           icon: '🚗', color: '#3b82f6' },
  reservations: { label: 'Κρατήσεις',   labelEn: 'Reservations',    icon: '📋', color: '#8b5cf6' },
  cleaning:     { label: 'Πλύσιμο',     labelEn: 'Cleaning',        icon: '🧹', color: '#22c55e' },
  safety:       { label: 'Ασφάλεια',    labelEn: 'Safety',          icon: '🛡️', color: '#ef4444' },
  station:      { label: 'Σταθμός',     labelEn: 'Station',         icon: '🏢', color: '#f59e0b' },
  general:      { label: 'Γενικά',      labelEn: 'General',         icon: '🌍', color: '#06b6d4' },
  logic:        { label: 'Λογική',      labelEn: 'Logic',           icon: '🧠', color: '#a855f7' },
};

export const ALL_BADGES: Badge[] = [
  { id: 'b-first-game',    name: 'Πρώτο Παιχνίδι',     nameEn: 'First Game',      icon: '🎮', description: 'Completed your first game', earnedAt: '' },
  { id: 'b-streak-7',      name: 'Streak 7 ημερών',    nameEn: '7-Day Streak',     icon: '🔥', description: '7 consecutive days played', earnedAt: '' },
  { id: 'b-streak-30',     name: 'Streak 30 ημερών',   nameEn: '30-Day Streak',    icon: '💎', description: '30 consecutive days played', earnedAt: '' },
  { id: 'b-perfect',       name: 'Τέλειο Σκορ',        nameEn: 'Perfect Score',    icon: '💯', description: '100% correct in a game', earnedAt: '' },
  { id: 'b-speed-demon',   name: 'Speed Demon',        nameEn: 'Speed Demon',      icon: '⚡', description: 'Answered all in under 5 seconds avg', earnedAt: '' },
  { id: 'b-fleet-guru',    name: 'Fleet Guru',         nameEn: 'Fleet Guru',       icon: '🚗', description: '100% accuracy in Fleet category (50+ questions)', earnedAt: '' },
  { id: 'b-10-perfect',    name: '10x Τέλειο',          nameEn: '10x Perfect',      icon: '🌟', description: '10 perfect scores', earnedAt: '' },
  { id: 'b-first-duel-win',name: 'Νίκη στο Ντουέλο',   nameEn: 'First Duel Win',   icon: '⚔️', description: 'Won your first duel', earnedAt: '' },
  { id: 'b-all-categories',name: 'Πολυμάθης',          nameEn: 'Polymath',         icon: '📚', description: 'Played all 7 categories', earnedAt: '' },
  { id: 'b-level-expert',  name: 'Φτάσε Expert',       nameEn: 'Reach Expert',     icon: '🏅', description: 'Reached Expert level', earnedAt: '' },
  { id: 'b-level-legend',  name: 'Θρύλος',              nameEn: 'Legend',            icon: '👑', description: 'Reached Legend level', earnedAt: '' },
];
