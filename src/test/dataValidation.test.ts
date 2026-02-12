import { describe, it, expect } from 'vitest';
import {
  validateRecords,
  createRequiredRule,
  createRangeRule,
  createUniqueRule,
  type ValidationRule,
} from '../app/hooks/useDataValidation';
import type { Field, FieldValue, Record } from '../app/types';

const mockFields: Field[] = [
  { id: 'f1', name: 'Title', type: 'text', isPrimary: true },
  { id: 'f2', name: 'Priority', type: 'select', options: { choices: [{ id: 'c1', name: 'High', color: 'red' }] } },
  { id: 'f3', name: 'Score', type: 'number' },
  { id: 'f4', name: 'Email', type: 'email' },
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

describe('Data Validation Engine', () => {
  it('should detect missing required fields', () => {
    const rules = [createRequiredRule('f1', 'Title')];
    const records = [
      mkRecord('r1', { f1: 'Hello' }),
      mkRecord('r2', { f1: '' }),
      mkRecord('r3', { f1: null }),
    ];

    const report = validateRecords(records, mockFields, rules);
    expect(report.totalErrors).toBe(2);
    expect(report.results.every((r) => r.fieldId === 'f1')).toBe(true);
  });

  it('should validate numeric ranges', () => {
    const rules = [createRangeRule('f3', 'Score', 0, 100)];
    const records = [
      mkRecord('r1', { f3: 50 }),
      mkRecord('r2', { f3: -5 }),
      mkRecord('r3', { f3: 150 }),
    ];

    const report = validateRecords(records, mockFields, rules);
    expect(report.totalErrors).toBe(2);
  });

  it('should detect duplicate values', () => {
    const rules = [createUniqueRule('f1', 'Title')];
    const records = [
      mkRecord('r1', { f1: 'Alpha' }),
      mkRecord('r2', { f1: 'Beta' }),
      mkRecord('r3', { f1: 'Alpha' }),
    ];

    const report = validateRecords(records, mockFields, rules);
    expect(report.totalErrors).toBe(1);
    expect(report.results[0].message).toContain('Duplicate');
  });

  it('should validate email format', () => {
    const rules: ValidationRule[] = [
      {
        id: 'email-check',
        name: 'Valid email',
        description: 'Must be a valid email',
        fieldId: 'f4',
        type: 'email',
        severity: 'error',
        params: {},
        enabled: true,
      },
    ];
    const records = [
      mkRecord('r1', { f4: 'user@example.com' }),
      mkRecord('r2', { f4: 'not-an-email' }),
      mkRecord('r3', { f4: '' }),
    ];

    const report = validateRecords(records, mockFields, rules);
    expect(report.totalErrors).toBe(1);
    expect(report.results[0].recordId).toBe('r2');
  });

  it('should return clean report for valid data', () => {
    const rules = [createRequiredRule('f1', 'Title'), createRangeRule('f3', 'Score', 0, 100)];
    const records = [
      mkRecord('r1', { f1: 'Task A', f3: 42 }),
      mkRecord('r2', { f1: 'Task B', f3: 99 }),
    ];

    const report = validateRecords(records, mockFields, rules);
    expect(report.totalErrors).toBe(0);
    expect(report.totalWarnings).toBe(0);
    expect(report.results).toHaveLength(0);
  });

  it('should skip disabled rules', () => {
    const rules: ValidationRule[] = [
      { ...createRequiredRule('f1', 'Title'), enabled: false },
    ];
    const records = [mkRecord('r1', { f1: '' })];

    const report = validateRecords(records, mockFields, rules);
    expect(report.totalErrors).toBe(0);
  });
});
