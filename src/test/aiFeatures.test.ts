import { describe, it, expect } from 'vitest';
import {
  parseNaturalLanguageFilter,
  autoMapColumns,
  detectAnomalies,
  summarizeData,
} from '../app/hooks/useAIFeatures';
import type { Field, FieldValue, Record } from '../app/types';

const mockFields: Field[] = [
  { id: 'f1', name: 'Title', type: 'text', isPrimary: true },
  {
    id: 'f2',
    name: 'Priority',
    type: 'select',
    options: { choices: [{ id: 'c1', name: 'High', color: 'red' }, { id: 'c2', name: 'Low', color: 'green' }] },
  },
  { id: 'f3', name: 'Score', type: 'number' },
  { id: 'f4', name: 'Due Date', type: 'date' },
  { id: 'f5', name: 'Email', type: 'email' },
];

const mkRecord = (id: string, fields: { [k: string]: FieldValue }): Record => ({
  id,
  fields,
  createdTime: new Date().toISOString(),
  createdBy: 'test',
  modifiedTime: new Date().toISOString(),
  modifiedBy: 'test',
  version: 1,
});

describe('AI Features — Natural Language Filter', () => {
  it('should parse "high priority" into a filter', () => {
    const result = parseNaturalLanguageFilter('Show high priority items', mockFields);
    expect(result.filters.length).toBeGreaterThan(0);
    expect(result.filters[0].value).toBe('High');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should return low confidence for unparseable queries', () => {
    const result = parseNaturalLanguageFilter('banana smoothie recipe', mockFields);
    expect(result.filters).toHaveLength(0);
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe('AI Features — Column Auto-Mapping', () => {
  it('should exact-match column names', () => {
    const mappings = autoMapColumns(['Title', 'Score'], mockFields);
    expect(mappings[0].targetField?.id).toBe('f1');
    expect(mappings[0].confidence).toBe(1.0);
    expect(mappings[1].targetField?.id).toBe('f3');
  });

  it('should fuzzy-match similar column names', () => {
    const mappings = autoMapColumns(['email_address', 'task_title'], mockFields);
    const emailMapping = mappings.find((m) => m.sourceColumn === 'email_address');
    expect(emailMapping?.targetField?.type).toBe('email');
    expect(emailMapping!.confidence).toBeGreaterThan(0.5);
  });

  it('should handle completely unrelated columns', () => {
    const mappings = autoMapColumns(['xyz_unknown'], mockFields);
    expect(mappings[0].confidence).toBeLessThan(0.5);
  });
});

describe('AI Features — Anomaly Detection', () => {
  it('should detect missing values in primary fields', () => {
    const records = [
      mkRecord('r1', { f1: 'OK' }),
      mkRecord('r2', { f1: null }),
      mkRecord('r3', { f1: '' }),
    ];
    const anomalies = detectAnomalies(records, mockFields);
    const missing = anomalies.filter((a) => a.type === 'missing');
    expect(missing.length).toBe(2);
  });

  it('should detect numeric outliers', () => {
    const records = [
      mkRecord('r1', { f3: 10 }),
      mkRecord('r2', { f3: 12 }),
      mkRecord('r3', { f3: 11 }),
      mkRecord('r4', { f3: 13 }),
      mkRecord('r5', { f3: 9 }),
      mkRecord('r6', { f3: 1000 }), // outlier
    ];
    const anomalies = detectAnomalies(records, mockFields);
    const outliers = anomalies.filter((a) => a.type === 'outlier');
    expect(outliers.length).toBeGreaterThan(0);
    expect(outliers[0].value).toBe(1000);
  });

  it('should detect duplicates in text fields', () => {
    const records = [
      mkRecord('r1', { f5: 'a@b.com' }),
      mkRecord('r2', { f5: 'a@b.com' }),
    ];
    const anomalies = detectAnomalies(records, mockFields);
    const dupes = anomalies.filter((a) => a.type === 'duplicate');
    expect(dupes.length).toBe(1);
  });
});

describe('AI Features — Data Summarization', () => {
  it('should produce correct fill rates and stats', () => {
    const records = [
      mkRecord('r1', { f1: 'A', f3: 10 }),
      mkRecord('r2', { f1: 'B', f3: 20 }),
      mkRecord('r3', { f1: '', f3: 30 }),
    ];
    const summary = summarizeData(records, mockFields);
    expect(summary.totalRecords).toBe(3);

    const titleSummary = summary.fieldSummaries.find((s) => s.fieldId === 'f1');
    expect(titleSummary?.fillRate).toBeCloseTo(2 / 3);

    const scoreSummary = summary.fieldSummaries.find((s) => s.fieldId === 'f3');
    expect(scoreSummary?.stats?.mean).toBe(20);
    expect(scoreSummary?.stats?.min).toBe(10);
    expect(scoreSummary?.stats?.max).toBe(30);
  });

  it('should flag low fill-rate fields as issues', () => {
    const records = [
      mkRecord('r1', { f3: null }),
      mkRecord('r2', { f3: null }),
      mkRecord('r3', { f3: 5 }),
    ];
    const summary = summarizeData(records, mockFields);
    expect(summary.topIssues.some((i) => i.includes('Score'))).toBe(true);
  });
});
