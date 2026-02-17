import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StrategyGameState, StrategyCampaignDifficulty, Resources, TurnResult,
} from '../types/strategyGame';
import { computeScore, STARTING_RESOURCES, MAX_DAYS, STRATEGY_ACHIEVEMENTS } from '../types/strategyGame';
import { selectEvent } from '../data/strategyEvents';

// ─── Strategy Store ──────────────────────────────────────────

interface StrategyStoreState {
  game: StrategyGameState | null;
  highScores: { mode: string; difficulty: string; score: number; day: number; date: string }[];
  totalGamesPlayed: number;
  earnedAchievements: string[];

  // Actions
  startGame: (playerName: string, mode: 'campaign' | 'quick' | 'endless', difficulty: StrategyCampaignDifficulty) => void;
  makeChoice: (choiceId: string) => void;
  nextDay: () => void;
  endGame: () => void;
  resetGame: () => void;
  getResourcePercent: (key: keyof Resources) => number;
}

function clampResources(r: Resources): Resources {
  return {
    fleet: Math.max(0, Math.min(50, r.fleet)),
    staff: Math.max(0, Math.min(25, r.staff)),
    budget: r.budget, // can go negative
    rating: Math.max(0, Math.min(100, r.rating)),
    time: Math.max(0, Math.min(16, r.time)),
  };
}

function checkGameOver(resources: Resources): string | null {
  if (resources.rating <= 0) return 'Rating μηδενίστηκε! Η εταιρεία σε αντικατέστησε.';
  if (resources.fleet <= 0) return 'Δεν έχεις αυτοκίνητα! Ο σταθμός έκλεισε.';
  if (resources.staff <= 0) return 'Δεν έχεις υπαλλήλους! Αδύνατη λειτουργία.';
  if (resources.budget < -2000) return 'Χρεοκόπησες! Πάνω από 2000€ χρέος.';
  return null;
}

export const useStrategyStore = create<StrategyStoreState>()(
  persist(
    (set, get) => ({
      game: null,
      highScores: [],
      totalGamesPlayed: 0,
      earnedAchievements: [],

      startGame: (playerName, mode, difficulty) => {
        const resources = { ...STARTING_RESOURCES[difficulty] };
        const usedIds = new Set<string>();
        const event = selectEvent(1, resources, usedIds);

        const game: StrategyGameState = {
          id: `sw-${Date.now()}`,
          mode,
          difficulty,
          playerName,
          resources,
          day: 1,
          maxDays: MAX_DAYS[mode],
          currentEvent: event,
          history: [],
          score: 0,
          isComplete: false,
          isGameOver: false,
          startedAt: new Date().toISOString(),
          achievements: [],
        };

        set({ game });
      },

      makeChoice: (choiceId) => {
        const { game } = get();
        if (!game || !game.currentEvent || game.isComplete || game.isGameOver) return;

        const event = game.currentEvent;
        const choice = event.choices.find(c => c.id === choiceId);
        if (!choice) return;

        // Check required resources
        if (choice.requiredResources) {
          const r = game.resources;
          for (const [key, val] of Object.entries(choice.requiredResources)) {
            if (r[key as keyof Resources] < (val as number)) return; // Can't afford
          }
        }

        // Apply base effects
        const resourcesBefore = { ...game.resources };
        const effects = { ...choice.effects };

        // Apply risk outcome
        let riskOutcome: 'bonus' | 'penalty' | 'none' = 'none';
        let riskText: string | undefined;

        if (choice.risk) {
          const roll = Math.random();
          if (roll < choice.risk.probability) {
            // Risk triggered — determine bonus vs penalty
            if (choice.risk.penaltyEffects && Object.keys(choice.risk.penaltyEffects).length > 0) {
              riskOutcome = 'penalty';
              riskText = choice.risk.penaltyText;
              for (const [key, val] of Object.entries(choice.risk.penaltyEffects)) {
                effects[key as keyof Resources] = (effects[key as keyof Resources] || 0) + (val as number);
              }
            }
          } else if (choice.risk.bonusEffects && Object.keys(choice.risk.bonusEffects).length > 0) {
            riskOutcome = 'bonus';
            riskText = choice.risk.bonusText;
            for (const [key, val] of Object.entries(choice.risk.bonusEffects)) {
              effects[key as keyof Resources] = (effects[key as keyof Resources] || 0) + (val as number);
            }
          }
        }

        // Compute new resources
        const newResources: Resources = { ...game.resources };
        for (const [key, delta] of Object.entries(effects)) {
          newResources[key as keyof Resources] += delta as number;
        }
        const clamped = clampResources(newResources);

        // Compute turn score
        const turnScore = computeScore(clamped, game.day) - computeScore(resourcesBefore, game.day);

        const turnResult: TurnResult = {
          day: game.day,
          event,
          choiceId,
          effects,
          riskOutcome,
          riskText,
          resourcesBefore,
          resourcesAfter: clamped,
          score: turnScore,
        };

        // Check game over
        const gameOverReason = checkGameOver(clamped);
        const isComplete = game.day >= game.maxDays && !gameOverReason;

        const updatedGame: StrategyGameState = {
          ...game,
          resources: clamped,
          history: [...game.history, turnResult],
          score: game.score + Math.max(0, turnScore),
          currentEvent: null,
          isGameOver: !!gameOverReason,
          isComplete,
          gameOverReason: gameOverReason || undefined,
          finishedAt: (isComplete || gameOverReason) ? new Date().toISOString() : undefined,
        };

        // Check achievements
        if (isComplete || gameOverReason) {
          const newAchievements: string[] = [];
          for (const ach of STRATEGY_ACHIEVEMENTS) {
            if (!get().earnedAchievements.includes(ach.id) && ach.check(updatedGame)) {
              newAchievements.push(ach.id);
            }
          }
          updatedGame.achievements = newAchievements;

          // Update high scores
          const hs = [...get().highScores, {
            mode: game.mode,
            difficulty: game.difficulty,
            score: updatedGame.score,
            day: game.day,
            date: new Date().toISOString(),
          }].sort((a, b) => b.score - a.score).slice(0, 20);

          set({
            game: updatedGame,
            highScores: hs,
            totalGamesPlayed: get().totalGamesPlayed + 1,
            earnedAchievements: [...get().earnedAchievements, ...newAchievements],
          });
        } else {
          set({ game: updatedGame });
        }
      },

      nextDay: () => {
        const { game } = get();
        if (!game || game.isComplete || game.isGameOver || game.currentEvent) return;

        const newDay = game.day + 1;
        // Reset time for new day
        const newResources = { ...game.resources, time: 16 };

        // Daily passive effects: +50 budget per fleet car rented (rough estimate)
        newResources.budget += Math.floor(game.resources.fleet * 0.5) * 50;
        // Staff cost: -30 per staff member
        newResources.budget -= game.resources.staff * 30;

        const usedIds = new Set(game.history.map(h => h.event.id));
        const event = selectEvent(newDay, newResources, usedIds);

        set({
          game: {
            ...game,
            day: newDay,
            resources: clampResources(newResources),
            currentEvent: event,
          },
        });
      },

      endGame: () => {
        const { game } = get();
        if (!game) return;

        const finalGame: StrategyGameState = {
          ...game,
          isComplete: true,
          finishedAt: new Date().toISOString(),
        };

        // Check achievements
        const newAchievements: string[] = [];
        for (const ach of STRATEGY_ACHIEVEMENTS) {
          if (!get().earnedAchievements.includes(ach.id) && ach.check(finalGame)) {
            newAchievements.push(ach.id);
          }
        }
        finalGame.achievements = newAchievements;

        const hs = [...get().highScores, {
          mode: game.mode,
          difficulty: game.difficulty,
          score: game.score,
          day: game.day,
          date: new Date().toISOString(),
        }].sort((a, b) => b.score - a.score).slice(0, 20);

        set({
          game: finalGame,
          highScores: hs,
          totalGamesPlayed: get().totalGamesPlayed + 1,
          earnedAchievements: [...get().earnedAchievements, ...newAchievements],
        });
      },

      resetGame: () => set({ game: null }),

      getResourcePercent: (key) => {
        const { game } = get();
        if (!game) return 0;
        const maxValues: Record<keyof Resources, number> = {
          fleet: 50, staff: 25, budget: 5000, rating: 100, time: 16,
        };
        return Math.max(0, Math.min(100, (game.resources[key] / maxValues[key]) * 100));
      },
    }),
    {
      name: 'station-wars-storage',
      partialize: (state) => ({
        highScores: state.highScores,
        totalGamesPlayed: state.totalGamesPlayed,
        earnedAchievements: state.earnedAchievements,
      }),
    }
  )
);
