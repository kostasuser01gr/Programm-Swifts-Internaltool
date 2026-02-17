// ─── Station Wars — Turn-Based Strategy Game Types ───────────
// Theme: car rental station management simulation.
// Players manage resources, handle events, make decisions.

export type ResourceType = 'fleet' | 'staff' | 'budget' | 'rating' | 'time';

export interface Resources {
  fleet: number;     // available vehicles (0-50)
  staff: number;     // available employees (0-20)
  budget: number;    // euros (can go negative = debt)
  rating: number;    // customer rating (0-100)
  time: number;      // hours remaining in day (0-16)
}

export type EventSeverity = 'info' | 'warning' | 'critical' | 'opportunity';

export interface GameEvent {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  severity: EventSeverity;
  category: 'customer' | 'fleet' | 'staff' | 'weather' | 'corporate' | 'random';
  choices: EventChoice[];
  // Conditions for this event to appear
  minDay?: number;
  maxDay?: number;
  requiresRating?: number;        // minimum rating
  requiresFleet?: number;         // minimum fleet
  probability: number;            // 0-1 base probability
}

export interface EventChoice {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  effects: Partial<Resources>;    // delta applied to resources
  risk?: {                         // chance of bonus/penalty
    probability: number;           // 0-1
    bonusEffects?: Partial<Resources>;
    penaltyEffects?: Partial<Resources>;
    bonusText: string;
    penaltyText: string;
  };
  requiredResources?: Partial<Resources>; // minimum to unlock this choice
}

export interface TurnResult {
  day: number;
  event: GameEvent;
  choiceId: string;
  effects: Partial<Resources>;
  riskOutcome?: 'bonus' | 'penalty' | 'none';
  riskText?: string;
  resourcesBefore: Resources;
  resourcesAfter: Resources;
  score: number;
}

export type StrategyCampaignDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface StrategyGameState {
  id: string;
  mode: 'campaign' | 'quick' | 'endless';
  difficulty: StrategyCampaignDifficulty;
  playerName: string;
  resources: Resources;
  day: number;
  maxDays: number;
  currentEvent: GameEvent | null;
  history: TurnResult[];
  score: number;
  isComplete: boolean;
  isGameOver: boolean;
  gameOverReason?: string;
  startedAt: string;
  finishedAt?: string;
  achievements: string[];
}

// ─── Score Computation ───────────────────────────────────────

export function computeScore(resources: Resources, day: number): number {
  return Math.max(0,
    resources.rating * 10
    + resources.fleet * 5
    + resources.staff * 8
    + Math.floor(resources.budget / 100) * 3
    + day * 15
  );
}

// ─── Achievement Definitions ─────────────────────────────────

export interface StrategyAchievement {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  check: (state: StrategyGameState) => boolean;
}

export const STRATEGY_ACHIEVEMENTS: StrategyAchievement[] = [
  {
    id: 'sa-survivor', name: 'Επιζών', nameEn: 'Survivor', icon: '🛡️',
    description: 'Ολοκλήρωσε ένα παιχνίδι', descriptionEn: 'Complete a game',
    check: (s) => s.isComplete && !s.isGameOver,
  },
  {
    id: 'sa-rich', name: 'Πλούσιος', nameEn: 'Rich', icon: '💰',
    description: 'Τερμάτισε με 5000+ budget', descriptionEn: 'End with 5000+ budget',
    check: (s) => s.isComplete && s.resources.budget >= 5000,
  },
  {
    id: 'sa-5star', name: '5 Αστέρια', nameEn: '5 Stars', icon: '⭐',
    description: 'Κράτα rating πάνω από 90', descriptionEn: 'Keep rating above 90',
    check: (s) => s.isComplete && s.resources.rating >= 90,
  },
  {
    id: 'sa-fleet-king', name: 'Fleet King', nameEn: 'Fleet King', icon: '🚗',
    description: 'Φτάσε 40+ οχήματα', descriptionEn: 'Reach 40+ vehicles',
    check: (s) => s.resources.fleet >= 40,
  },
  {
    id: 'sa-hard', name: 'Σκληρός Παίκτης', nameEn: 'Hard Mode', icon: '💪',
    description: 'Νίκησε σε Hard', descriptionEn: 'Win on Hard difficulty',
    check: (s) => s.isComplete && !s.isGameOver && s.difficulty === 'hard',
  },
  {
    id: 'sa-expert', name: 'Expert Mode', nameEn: 'Expert Mode', icon: '🏆',
    description: 'Νίκησε σε Expert', descriptionEn: 'Win on Expert difficulty',
    check: (s) => s.isComplete && !s.isGameOver && s.difficulty === 'expert',
  },
  {
    id: 'sa-perfect-week', name: 'Τέλεια Εβδομάδα', nameEn: 'Perfect Week', icon: '🌟',
    description: 'Μηδέν αρνητικές μέρες σε 7+', descriptionEn: 'No negative days in 7+',
    check: (s) => s.day >= 7 && s.history.every(r => r.score >= 0),
  },
  {
    id: 'sa-high-score', name: 'Υψηλό Σκορ', nameEn: 'High Score', icon: '🎯',
    description: 'Σκόραρε 2000+ πόντους', descriptionEn: 'Score 2000+ points',
    check: (s) => s.score >= 2000,
  },
];

// ─── Starting Resources by Difficulty ────────────────────────

export const STARTING_RESOURCES: Record<StrategyCampaignDifficulty, Resources> = {
  easy:   { fleet: 25, staff: 12, budget: 3000, rating: 80, time: 16 },
  normal: { fleet: 20, staff: 10, budget: 2000, rating: 70, time: 16 },
  hard:   { fleet: 15, staff: 8,  budget: 1000, rating: 60, time: 16 },
  expert: { fleet: 10, staff: 5,  budget: 500,  rating: 50, time: 16 },
};

export const MAX_DAYS: Record<'campaign' | 'quick' | 'endless', number> = {
  campaign: 30,
  quick: 10,
  endless: 999,
};
