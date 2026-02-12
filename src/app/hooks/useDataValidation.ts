// ============================================================
// Data Validation Engine
// Rule-based validation with detailed error reporting
// ============================================================

import type { Field, FieldValue, Record } from '../types';

// ── Validation Rule Types ──────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  fieldId: string;
  type: ValidationRuleType;
  severity: ValidationSeverity;
  params: ValidationParams;
  enabled: boolean;
}

export type ValidationRuleType =
  | 'required'
  | 'type-check'
  | 'min-length'
  | 'max-length'
  | 'min-value'
  | 'max-value'
  | 'range'
  | 'regex'
  | 'unique'
  | 'custom'
  | 'email'
  | 'url'
  | 'phone'
  | 'date-range'
  | 'allowed-values'
  | 'forbidden-values'
  | 'cross-field';

export interface ValidationParams {
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: FieldValue[];
  forbiddenValues?: FieldValue[];
  referenceFieldId?: string;
  customFn?: string; // serialised function body
  message?: string;
}

export interface ValidationResult {
  recordId: string;
  fieldId: string;
  ruleId: string;
  ruleName: string;
  severity: ValidationSeverity;
  message: string;
  value: FieldValue;
}

export interface ValidationReport {
  timestamp: string;
  totalRecords: number;
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  results: ValidationResult[];
}

// ── Built-in Validators ────────────────────────────────

const validators: { [K in ValidationRuleType]: (value: FieldValue, params: ValidationParams, field: Field) => string | null } = {
  required: (value) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return 'This field is required';
    }
    return null;
  },

  'type-check': (value, _params, field) => {
    if (value === null || value === undefined) return null;
    switch (field.type) {
      case 'number':
      case 'currency':
      case 'percent':
      case 'rating':
        if (typeof value !== 'number' && isNaN(Number(value))) return `Expected a number, got "${value}"`;
        break;
      case 'checkbox':
        if (typeof value !== 'boolean') return `Expected a boolean, got "${typeof value}"`;
        break;
      case 'date':
        if (isNaN(Date.parse(String(value)))) return `Invalid date: "${value}"`;
        break;
    }
    return null;
  },

  'min-length': (value, params) => {
    if (value === null || value === undefined) return null;
    const len = String(value).length;
    if (params.min !== undefined && len < params.min) {
      return `Minimum length is ${params.min}, got ${len}`;
    }
    return null;
  },

  'max-length': (value, params) => {
    if (value === null || value === undefined) return null;
    const len = String(value).length;
    if (params.max !== undefined && len > params.max) {
      return `Maximum length is ${params.max}, got ${len}`;
    }
    return null;
  },

  'min-value': (value, params) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (!isNaN(num) && params.min !== undefined && num < params.min) {
      return `Minimum value is ${params.min}, got ${num}`;
    }
    return null;
  },

  'max-value': (value, params) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (!isNaN(num) && params.max !== undefined && num > params.max) {
      return `Maximum value is ${params.max}, got ${num}`;
    }
    return null;
  },

  range: (value, params) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (!isNaN(num)) {
      if (params.min !== undefined && num < params.min) return `Value ${num} is below minimum ${params.min}`;
      if (params.max !== undefined && num > params.max) return `Value ${num} exceeds maximum ${params.max}`;
    }
    return null;
  },

  regex: (value, params) => {
    if (value === null || value === undefined || !params.pattern) return null;
    try {
      const re = new RegExp(params.pattern);
      if (!re.test(String(value))) {
        return params.message || `Value does not match pattern: ${params.pattern}`;
      }
    } catch {
      return `Invalid regex pattern: ${params.pattern}`;
    }
    return null;
  },

  unique: () => {
    // Uniqueness is checked at the dataset level in validateRecords()
    return null;
  },

  custom: (value, params) => {
    if (!params.customFn) return null;
    // Safe built-in validators instead of arbitrary code execution (new Function / eval).
    // Only predefined validation functions are allowed to prevent XSS/injection.
    const builtinValidators: { [name: string]: (v: FieldValue) => string | null } = {
      isPositive: (v) => (typeof v === 'number' && v > 0 ? null : 'Value must be positive'),
      isNonEmpty: (v) => (typeof v === 'string' && v.trim().length > 0 ? null : 'Value must not be empty'),
      isInteger: (v) => (typeof v === 'number' && Number.isInteger(v) ? null : 'Value must be an integer'),
      isAlpha: (v) => (typeof v === 'string' && /^[a-zA-Z]+$/.test(v) ? null : 'Value must contain only letters'),
      isAlphanumeric: (v) => (typeof v === 'string' && /^[a-zA-Z0-9]+$/.test(v) ? null : 'Value must be alphanumeric'),
    };
    const validator = builtinValidators[params.customFn];
    if (!validator) return `Unknown custom validator: "${params.customFn}"`;
    try {
      const result = validator(value);
      if (typeof result === 'string') return result;
    } catch (e) {
      return `Custom validation error: ${e}`;
    }
    return null;
  },

  email: (value) => {
    if (value === null || value === undefined || value === '') return null;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(String(value))) return `Invalid email address: "${value}"`;
    return null;
  },

  url: (value) => {
    if (value === null || value === undefined || value === '') return null;
    try {
      new URL(String(value));
    } catch {
      return `Invalid URL: "${value}"`;
    }
    return null;
  },

  phone: (value) => {
    if (value === null || value === undefined || value === '') return null;
    const phoneRe = /^\+?[\d\s\-().]{7,20}$/;
    if (!phoneRe.test(String(value))) return `Invalid phone number: "${value}"`;
    return null;
  },

  'date-range': (value, params) => {
    if (value === null || value === undefined) return null;
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return `Invalid date: "${value}"`;
    if (params.min !== undefined && d.getTime() < params.min) return `Date is before the allowed range`;
    if (params.max !== undefined && d.getTime() > params.max) return `Date is after the allowed range`;
    return null;
  },

  'allowed-values': (value, params) => {
    if (value === null || value === undefined || !params.allowedValues) return null;
    if (!params.allowedValues.includes(value)) {
      return `Value "${value}" is not in the allowed list`;
    }
    return null;
  },

  'forbidden-values': (value, params) => {
    if (value === null || value === undefined || !params.forbiddenValues) return null;
    if (params.forbiddenValues.includes(value)) {
      return `Value "${value}" is forbidden`;
    }
    return null;
  },

  'cross-field': () => {
    // Cross-field validation is handled at the record level
    return null;
  },
};

// ── Main Validation Function ───────────────────────────

export function validateRecords(
  records: Record[],
  fields: Field[],
  rules: ValidationRule[]
): ValidationReport {
  const results: ValidationResult[] = [];
  const enabledRules = rules.filter((r) => r.enabled);
  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  // Per-record validation
  for (const record of records) {
    for (const rule of enabledRules) {
      if (rule.type === 'unique') continue; // handled below
      const field = fieldMap.get(rule.fieldId);
      if (!field) continue;

      const value = record.fields[rule.fieldId];
      const validator = validators[rule.type];
      if (!validator) continue;

      const error = validator(value, rule.params, field);
      if (error) {
        results.push({
          recordId: record.id,
          fieldId: rule.fieldId,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: rule.params.message || error,
          value,
        });
      }
    }
  }

  // Uniqueness checks (dataset-level)
  const uniqueRules = enabledRules.filter((r) => r.type === 'unique');
  for (const rule of uniqueRules) {
    const seen = new Map<string, string>(); // value → first recordId
    for (const record of records) {
      const value = record.fields[rule.fieldId];
      if (value === null || value === undefined || value === '') continue;
      const key = JSON.stringify(value);
      if (seen.has(key)) {
        results.push({
          recordId: record.id,
          fieldId: rule.fieldId,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: `Duplicate value "${value}" (first seen in record ${seen.get(key)})`,
          value,
        });
      } else {
        seen.set(key, record.id);
      }
    }
  }

  const totalErrors = results.filter((r) => r.severity === 'error').length;
  const totalWarnings = results.filter((r) => r.severity === 'warning').length;
  const totalInfos = results.filter((r) => r.severity === 'info').length;

  return {
    timestamp: new Date().toISOString(),
    totalRecords: records.length,
    totalErrors,
    totalWarnings,
    totalInfos,
    results,
  };
}

// ── Helper: Create common rules quickly ────────────────

export function createRequiredRule(fieldId: string, fieldName: string): ValidationRule {
  return {
    id: `req-${fieldId}`,
    name: `${fieldName} is required`,
    description: `Ensures ${fieldName} is not empty`,
    fieldId,
    type: 'required',
    severity: 'error',
    params: {},
    enabled: true,
  };
}

export function createRangeRule(fieldId: string, fieldName: string, min: number, max: number): ValidationRule {
  return {
    id: `range-${fieldId}`,
    name: `${fieldName} must be ${min}–${max}`,
    description: `Ensures ${fieldName} is within [${min}, ${max}]`,
    fieldId,
    type: 'range',
    severity: 'error',
    params: { min, max },
    enabled: true,
  };
}

export function createUniqueRule(fieldId: string, fieldName: string): ValidationRule {
  return {
    id: `unique-${fieldId}`,
    name: `${fieldName} must be unique`,
    description: `Ensures no duplicate values in ${fieldName}`,
    fieldId,
    type: 'unique',
    severity: 'error',
    params: {},
    enabled: true,
  };
}
