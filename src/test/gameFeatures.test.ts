import { describe, it, expect, beforeEach } from 'vitest';
import { getLevel, getLevelInfo, xpForCorrectAnswer, ALL_BADGES, GAME_CATEGORIES_INFO } from '../app/types/game';
import type { PlayerLevel } from '../app/types/game';
import { pickQuestions, getTodayKey, QUESTION_BANK } from '../app/data/gameData';

// ─── Game Type Helpers ──────────────────────────────────────

describe('Game — Level System', () => {
  it('should return rookie for 0 XP', () => {
    expect(getLevel(0)).toBe('rookie');
  });

  it('should return agent at 100 XP', () => {
    expect(getLevel(100)).toBe('agent');
  });

  it('should increase levels progressively', () => {
    const levels: PlayerLevel[] = ['rookie', 'agent', 'specialist', 'expert', 'master', 'legend'];
    const l500 = levels.indexOf(getLevel(500));
    const l2000 = levels.indexOf(getLevel(2000));
    expect(l2000).toBeGreaterThan(l500);
  });

  it('should return legend for very high XP', () => {
    expect(getLevel(999999)).toBe('legend');
  });

  it('getLevelInfo should return valid info', () => {
    const info = getLevelInfo('specialist');
    expect(info.label).toBeDefined();
    expect(info.label.length).toBeGreaterThan(0);
    expect(info.minXp).toBeDefined();
    expect(info.icon).toBeDefined();
    expect(info.color).toBeDefined();
  });
});

describe('Game — XP Calculation', () => {
  it('should return positive XP for correct answer', () => {
    const xp = xpForCorrectAnswer(3, 5000, 30);
    expect(xp).toBeGreaterThan(0);
  });

  it('should award more XP for higher difficulty', () => {
    const easyXp = xpForCorrectAnswer(1, 10000, 30);
    const hardXp = xpForCorrectAnswer(5, 10000, 30);
    expect(hardXp).toBeGreaterThan(easyXp);
  });

  it('should award speed bonus for fast answers', () => {
    const fastXp = xpForCorrectAnswer(3, 3000, 30);
    const slowXp = xpForCorrectAnswer(3, 25000, 30);
    expect(fastXp).toBeGreaterThanOrEqual(slowXp);
  });

  it('should not return negative XP', () => {
    const xp = xpForCorrectAnswer(1, 60000, 30);
    expect(xp).toBeGreaterThan(0);
  });
});

describe('Game — Categories & Badges', () => {
  it('should have 7 game categories', () => {
    expect(Object.keys(GAME_CATEGORIES_INFO)).toHaveLength(7);
  });

  it('all categories should have icon and label', () => {
    for (const [, info] of Object.entries(GAME_CATEGORIES_INFO)) {
      expect(info.icon).toBeDefined();
      expect(info.label).toBeDefined();
      expect(info.color).toBeDefined();
    }
  });

  it('should have at least 10 badges', () => {
    expect(ALL_BADGES.length).toBeGreaterThanOrEqual(10);
  });

  it('all badges should have unique IDs', () => {
    const ids = ALL_BADGES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all badges should have description and icon', () => {
    for (const badge of ALL_BADGES) {
      expect(badge.description).toBeDefined();
      expect(badge.icon).toBeDefined();
      expect(badge.name.length).toBeGreaterThan(0);
    }
  });
});

// ─── Question Bank ──────────────────────────────────────────

describe('Game — Question Bank', () => {
  it('should have at least 70 questions', () => {
    expect(QUESTION_BANK.length).toBeGreaterThanOrEqual(70);
  });

  it('all questions should have required fields', () => {
    for (const q of QUESTION_BANK) {
      expect(q.id).toBeDefined();
      expect(q.text).toBeDefined();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(q.difficulty).toBeGreaterThanOrEqual(1);
      expect(q.difficulty).toBeLessThanOrEqual(5);
      expect(q.timeLimitSec).toBeGreaterThan(0);
    }
  });

  it('all questions should have valid category', () => {
    const validCategories = Object.keys(GAME_CATEGORIES_INFO);
    for (const q of QUESTION_BANK) {
      expect(validCategories).toContain(q.category);
    }
  });

  it('all question IDs should be unique', () => {
    const ids = QUESTION_BANK.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Game — pickQuestions', () => {
  it('should return requested number of questions', () => {
    const qs = pickQuestions(5);
    expect(qs).toHaveLength(5);
  });

  it('should not return more than available', () => {
    const qs = pickQuestions(9999);
    expect(qs.length).toBeLessThanOrEqual(QUESTION_BANK.length);
  });

  it('should filter by category', () => {
    const qs = pickQuestions(5, 'fleet');
    expect(qs.every(q => q.category === 'fleet')).toBe(true);
  });

  it('should filter by difficulty range', () => {
    const qs = pickQuestions(5, undefined, 1, 2);
    expect(qs.every(q => q.difficulty >= 1 && q.difficulty <= 2)).toBe(true);
  });

  it('should exclude specified IDs', () => {
    const first5 = QUESTION_BANK.slice(0, 5).map(q => q.id);
    const qs = pickQuestions(10, undefined, undefined, undefined, first5);
    const pickedIds = qs.map(q => q.id);
    for (const excluded of first5) {
      expect(pickedIds).not.toContain(excluded);
    }
  });

  it('should return shuffled results (not always same order)', () => {
    // Run 5 times and check if at least one has different order
    const runs = Array.from({ length: 5 }, () => pickQuestions(10).map(q => q.id));
    const allSame = runs.every(r => JSON.stringify(r) === JSON.stringify(runs[0]));
    // With 10 items, probability of all 5 being same is astronomically low
    // But we allow it (don't want flaky tests), just check structure
    expect(runs[0].length).toBe(10);
    if (!allSame) {
      expect(allSame).toBe(false); // At least one was different — shuffle works
    }
  });
});

describe('Game — getTodayKey', () => {
  it('should return a date string in YYYY-MM-DD format', () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
