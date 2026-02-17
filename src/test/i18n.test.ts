// ─── Tests: i18n Translation System ──────────────────────────
import { describe, it, expect } from 'vitest';
import { resolve, translations, type Locale } from '../app/i18n/translations';

describe('translations', () => {
  it('has el and en locales', () => {
    expect(translations).toHaveProperty('el');
    expect(translations).toHaveProperty('en');
  });

  it('el has all expected top-level sections', () => {
    const sections = ['common', 'nav', 'auth', 'chat', 'fleet', 'washer', 'settings', 'connectivity', 'errors'];
    for (const section of sections) {
      expect(translations.el).toHaveProperty(section);
    }
  });

  it('en has all the same top-level sections as el', () => {
    const elKeys = Object.keys(translations.el);
    const enKeys = Object.keys(translations.en);
    expect(enKeys).toEqual(elKeys);
  });
});

describe('resolve', () => {
  it('resolves a simple key', () => {
    expect(resolve('common.save', translations.el)).toBe('Αποθήκευση');
    expect(resolve('common.save', translations.en)).toBe('Save');
  });

  it('resolves nested keys', () => {
    expect(resolve('fleet.category.general', translations.el)).toBe('Γενικά');
    expect(resolve('fleet.category.general', translations.en)).toBe('General');
  });

  it('returns the key itself if not found', () => {
    expect(resolve('nonexistent.key', translations.el)).toBe('nonexistent.key');
    expect(resolve('common.nonexistent', translations.el)).toBe('common.nonexistent');
  });

  it('interpolates {param} placeholders', () => {
    expect(resolve('auth.sessionExpiryWarning', translations.el, { minutes: 5 }))
      .toBe('Η συνεδρία λήγει σε 5 λεπτά');
    expect(resolve('auth.sessionExpiryWarning', translations.en, { minutes: 10 }))
      .toBe('Session expires in 10 minutes');
  });

  it('handles missing params gracefully', () => {
    // If param is not provided, placeholder stays
    expect(resolve('auth.sessionExpiryWarning', translations.el))
      .toBe('Η συνεδρία λήγει σε {minutes} λεπτά');
  });
});

describe('key coverage parity', () => {
  function collectKeys(map: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(map)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        keys.push(...collectKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  it('el and en have the same set of leaf keys', () => {
    const elKeys = collectKeys(translations.el).sort();
    const enKeys = collectKeys(translations.en).sort();
    expect(enKeys).toEqual(elKeys);
  });
});
