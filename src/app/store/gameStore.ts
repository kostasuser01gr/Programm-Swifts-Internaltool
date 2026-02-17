import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameSession, GameAnswer, GameQuestion, GameMode, GameCategory,
  PlayerProfile, Badge, LeaderboardEntry, LeaderboardPeriod, Difficulty,
} from '../types/game';
import { getLevel, xpForCorrectAnswer, ALL_BADGES } from '../types/game';
import { pickQuestions, getTodayKey } from '../data/gameData';

// ─── Game Store ──────────────────────────────────────────────

interface GameState {
  // Player profiles (keyed by userId)
  players: Record<string, PlayerProfile>;
  
  // Current session
  currentSession: GameSession | null;
  
  // Session history (last 50)
  sessionHistory: GameSession[];
  
  // UI state
  activeTab: 'play' | 'leaderboard' | 'profile' | 'practice' | 'strategy';
  selectedCategory: GameCategory | null;

  // Actions — Profile
  initPlayer: (userId: string, team?: 'ΟΜΑΔΑ Α' | 'ΟΜΑΔΑ Β') => void;
  getPlayer: (userId: string) => PlayerProfile | undefined;

  // Actions — Game Session
  startGame: (userId: string, mode: GameMode, category?: GameCategory) => void;
  submitAnswer: (selectedIndex: number) => void;
  skipQuestion: () => void;
  finishGame: () => void;
  
  // Actions — Leaderboard
  getLeaderboard: (period: LeaderboardPeriod) => LeaderboardEntry[];
  
  // Actions — UI
  setActiveTab: (tab: GameState['activeTab']) => void;
  setSelectedCategory: (cat: GameCategory | null) => void;

  // Helpers
  canPlayDaily: (userId: string) => boolean;
  getStreak: (userId: string) => number;
}

const QUESTIONS_PER_MODE: Record<GameMode, number> = {
  daily_sprint: 5,
  weekly_tournament: 20,
  practice: 10,
  duel: 5,
  team_battle: 5,
  speed_run: 30,
};

function createDefaultPlayer(userId: string, team?: 'ΟΜΑΔΑ Α' | 'ΟΜΑΔΑ Β'): PlayerProfile {
  return {
    userId,
    xp: 0,
    level: 'rookie',
    streak: 0,
    longestStreak: 0,
    lastPlayedDate: '',
    badges: [],
    gamesPlayed: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    avgResponseMs: 0,
    categoryScores: {
      fleet: { correct: 0, total: 0 },
      reservations: { correct: 0, total: 0 },
      cleaning: { correct: 0, total: 0 },
      safety: { correct: 0, total: 0 },
      station: { correct: 0, total: 0 },
      general: { correct: 0, total: 0 },
      logic: { correct: 0, total: 0 },
    },
    teamId: team,
  };
}

function checkBadges(player: PlayerProfile, session: GameSession): Badge[] {
  const earned: Badge[] = [];
  const now = new Date().toISOString();
  const has = (id: string) => player.badges.some(b => b.id === id);

  // First game
  if (!has('b-first-game') && player.gamesPlayed >= 1) {
    earned.push({ ...ALL_BADGES.find(b => b.id === 'b-first-game')!, earnedAt: now });
  }

  // Perfect score
  if (!has('b-perfect') && session.isComplete && session.score === session.maxScore && session.answers.length > 0) {
    earned.push({ ...ALL_BADGES.find(b => b.id === 'b-perfect')!, earnedAt: now });
  }

  // 7-day streak
  if (!has('b-streak-7') && player.streak >= 7) {
    earned.push({ ...ALL_BADGES.find(b => b.id === 'b-streak-7')!, earnedAt: now });
  }

  // 30-day streak
  if (!has('b-streak-30') && player.streak >= 30) {
    earned.push({ ...ALL_BADGES.find(b => b.id === 'b-streak-30')!, earnedAt: now });
  }

  // Speed demon (avg < 5s)
  if (!has('b-speed-demon') && session.answers.length >= 5) {
    const avgTime = session.answers.reduce((s, a) => s + a.timeMs, 0) / session.answers.length;
    if (avgTime < 5000) {
      earned.push({ ...ALL_BADGES.find(b => b.id === 'b-speed-demon')!, earnedAt: now });
    }
  }

  // Expert level
  if (!has('b-level-expert') && player.xp >= 1500) {
    earned.push({ ...ALL_BADGES.find(b => b.id === 'b-level-expert')!, earnedAt: now });
  }

  // Legend level
  if (!has('b-level-legend') && player.xp >= 10000) {
    earned.push({ ...ALL_BADGES.find(b => b.id === 'b-level-legend')!, earnedAt: now });
  }

  // All categories played
  if (!has('b-all-categories')) {
    const cats = Object.values(player.categoryScores);
    if (cats.every(c => c.total > 0)) {
      earned.push({ ...ALL_BADGES.find(b => b.id === 'b-all-categories')!, earnedAt: now });
    }
  }

  return earned;
}

// ─── Store ───────────────────────────────────────────────────

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      players: {},
      currentSession: null,
      sessionHistory: [],
      activeTab: 'play',
      selectedCategory: null,

      initPlayer: (userId, team) => {
        const state = get();
        if (state.players[userId]) return;
        set({
          players: { ...state.players, [userId]: createDefaultPlayer(userId, team) },
        });
      },

      getPlayer: (userId) => get().players[userId],

      startGame: (userId, mode, category) => {
        const state = get();
        // Ensure player exists
        if (!state.players[userId]) {
          get().initPlayer(userId);
        }

        const count = QUESTIONS_PER_MODE[mode];
        const questions = pickQuestions(count, category);

        if (questions.length === 0) return;

        const session: GameSession = {
          id: `gs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          mode,
          playerId: userId,
          questions,
          answers: [],
          currentIndex: 0,
          startedAt: new Date().toISOString(),
          score: 0,
          maxScore: questions.reduce((s, q) => s + q.difficulty * 10 + q.timeLimitSec, 0),
          isComplete: false,
        };

        set({ currentSession: session });
      },

      submitAnswer: (selectedIndex) => {
        const state = get();
        if (!state.currentSession || state.currentSession.isComplete) return;

        const session = state.currentSession;
        const question = session.questions[session.currentIndex];
        if (!question) return;

        const isCorrect = selectedIndex === question.correctIndex;
        const now = Date.now();
        const timeMs = session.answers.length === 0
          ? now - new Date(session.startedAt).getTime()
          : now - new Date(session.answers[session.answers.length - 1].answeredAt).getTime();

        const answer: GameAnswer = {
          questionId: question.id,
          selectedIndex,
          isCorrect,
          timeMs: Math.min(timeMs, question.timeLimitSec * 1000),
          answeredAt: new Date().toISOString(),
        };

        const xpGained = isCorrect ? xpForCorrectAnswer(question.difficulty, timeMs, question.timeLimitSec) : 0;
        const newScore = session.score + xpGained;
        const newAnswers = [...session.answers, answer];
        const nextIndex = session.currentIndex + 1;
        const isComplete = nextIndex >= session.questions.length;

        const updatedSession: GameSession = {
          ...session,
          answers: newAnswers,
          currentIndex: nextIndex,
          score: newScore,
          isComplete,
          finishedAt: isComplete ? new Date().toISOString() : undefined,
        };

        set({ currentSession: updatedSession });

        // If game is complete, update player profile
        if (isComplete) {
          const playerId = session.playerId;
          const player = { ...(get().players[playerId] || createDefaultPlayer(playerId)) };
          const today = getTodayKey();

          // Update XP
          player.xp += newScore;
          player.level = getLevel(player.xp);

          // Update streak
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (player.lastPlayedDate === yesterday || player.lastPlayedDate === today) {
            if (player.lastPlayedDate !== today) player.streak += 1;
          } else if (player.lastPlayedDate !== today) {
            player.streak = 1;
          }
          if (player.streak > player.longestStreak) player.longestStreak = player.streak;
          player.lastPlayedDate = today;

          // Update stats
          player.gamesPlayed += 1;
          const correctCount = newAnswers.filter(a => a.isCorrect).length;
          player.totalCorrect += correctCount;
          player.totalAnswered += newAnswers.length;
          player.avgResponseMs = Math.round(
            ((player.avgResponseMs * (player.totalAnswered - newAnswers.length)) + newAnswers.reduce((s, a) => s + a.timeMs, 0))
            / player.totalAnswered
          );

          // Update category scores
          for (const ans of newAnswers) {
            const q = session.questions.find(qq => qq.id === ans.questionId);
            if (q) {
              const cat = player.categoryScores[q.category];
              cat.total += 1;
              if (ans.isCorrect) cat.correct += 1;
            }
          }

          // Check badges
          const newBadges = checkBadges(player, updatedSession);
          player.badges = [...player.badges, ...newBadges];

          set({
            players: { ...get().players, [playerId]: player },
            sessionHistory: [updatedSession, ...get().sessionHistory].slice(0, 50),
          });
        }
      },

      skipQuestion: () => {
        const state = get();
        if (!state.currentSession || state.currentSession.isComplete) return;

        const session = state.currentSession;
        const question = session.questions[session.currentIndex];
        
        const answer: GameAnswer = {
          questionId: question.id,
          selectedIndex: -1,
          isCorrect: false,
          timeMs: question.timeLimitSec * 1000,
          answeredAt: new Date().toISOString(),
        };

        const nextIndex = session.currentIndex + 1;
        const isComplete = nextIndex >= session.questions.length;

        set({
          currentSession: {
            ...session,
            answers: [...session.answers, answer],
            currentIndex: nextIndex,
            isComplete,
            finishedAt: isComplete ? new Date().toISOString() : undefined,
          },
        });
      },

      finishGame: () => {
        set({ currentSession: null });
      },

      getLeaderboard: (period) => {
        const state = get();
        const players = Object.values(state.players);
        
        const entries: LeaderboardEntry[] = players
          .filter(p => p.gamesPlayed > 0)
          .map(p => ({
            userId: p.userId,
            userName: p.userId, // Will be resolved by UI from chatData
            avatar: '',
            team: p.teamId || '',
            score: p.xp,
            gamesPlayed: p.gamesPlayed,
            accuracy: p.totalAnswered > 0 ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : 0,
            streak: p.streak,
            rank: 0,
          }))
          .sort((a, b) => b.score - a.score);

        entries.forEach((e, i) => { e.rank = i + 1; });
        return entries;
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedCategory: (cat) => set({ selectedCategory: cat }),

      canPlayDaily: (userId) => {
        const player = get().players[userId];
        if (!player) return true;
        return player.lastPlayedDate !== getTodayKey();
      },

      getStreak: (userId) => {
        const player = get().players[userId];
        return player?.streak || 0;
      },
    }),
    {
      name: 'station-game-storage',
      partialize: (state) => ({
        players: state.players,
        sessionHistory: state.sessionHistory.slice(0, 20),
      }),
    }
  )
);
