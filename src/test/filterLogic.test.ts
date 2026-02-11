import { describe, it, expect } from 'vitest';
import type { Filter, Record } from '../app/types';

function applyFilters(records: Record[], filters: Filter[]): Record[] {
  let filtered = records;
  for (const filter of filters) {
    filtered = filtered.filter((record) => {
      const value = record.fields[filter.fieldId];
      switch (filter.operator) {
        case 'equals':
        case 'is':
          return value === filter.value;
        case 'notEquals':
        case 'isNot':
          return value !== filter.value;
        case 'contains':
          return String(value || '').toLowerCase().includes(String(filter.value).toLowerCase());
        case 'notContains':
          return !String(value || '').toLowerCase().includes(String(filter.value).toLowerCase());
        case 'isEmpty':
          return !value || value === '' || (Array.isArray(value) && value.length === 0);
        case 'isNotEmpty':
          return value && value !== '' && !(Array.isArray(value) && value.length === 0);
        case 'greaterThan':
          return Number(value) > Number(filter.value);
        case 'lessThan':
          return Number(value) < Number(filter.value);
        default:
          return true;
      }
    });
  }
  return filtered;
}

const makeRecord = (id: string, fields: Record<string, unknown>): Record => ({
  id,
  fields: fields as { [key: string]: unknown },
  createdTime: '2026-01-01T00:00:00Z',
  createdBy: 'user-1',
  modifiedTime: '2026-01-01T00:00:00Z',
  modifiedBy: 'user-1',
  version: 1,
});

describe('Filter Logic', () => {
  const records = [
    makeRecord('r1', { name: 'Alpha Task', effort: 5, status: 'active', tags: ['a', 'b'] }),
    makeRecord('r2', { name: 'Beta Work', effort: 10, status: 'done', tags: [] }),
    makeRecord('r3', { name: 'Gamma Project', effort: 3, status: 'active', tags: ['a'] }),
    makeRecord('r4', { name: '', effort: 0, status: '', tags: [] }),
  ];

  it('equals filter', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'status', operator: 'equals', value: 'active' }]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('notEquals filter', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'status', operator: 'notEquals', value: 'active' }]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['r2', 'r4']);
  });

  it('contains filter (case insensitive)', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'name', operator: 'contains', value: 'TASK' }]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  it('notContains filter', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'name', operator: 'notContains', value: 'project' }]);
    expect(result).toHaveLength(3);
  });

  it('isEmpty filter (string)', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'status', operator: 'isEmpty', value: '' }]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r4');
  });

  it('isEmpty filter (array)', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'tags', operator: 'isEmpty', value: '' }]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['r2', 'r4']);
  });

  it('isNotEmpty filter', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'tags', operator: 'isNotEmpty', value: '' }]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('greaterThan filter', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'effort', operator: 'greaterThan', value: 4 }]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  it('lessThan filter', () => {
    const result = applyFilters(records, [{ id: 'f1', fieldId: 'effort', operator: 'lessThan', value: 5 }]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['r3', 'r4']);
  });

  it('multiple filters (AND)', () => {
    const result = applyFilters(records, [
      { id: 'f1', fieldId: 'status', operator: 'equals', value: 'active' },
      { id: 'f2', fieldId: 'effort', operator: 'greaterThan', value: 4 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  it('no filters returns all records', () => {
    const result = applyFilters(records, []);
    expect(result).toHaveLength(4);
  });
});
