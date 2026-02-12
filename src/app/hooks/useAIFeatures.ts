// ============================================================
// AI-Powered Features Engine
// Natural language → filters, column mapping, anomaly detection
// ============================================================

import type { Field, FieldValue, Record, Filter } from '../types';

// ── Natural Language → Filter ──────────────────────────

export interface NLFilterResult {
  filters: Filter[];
  explanation: string;
  confidence: number;
}

/**
 * Parse a natural language query into structured filters.
 * This is a local heuristic engine. For production, connect to an LLM API.
 */
export function parseNaturalLanguageFilter(
  query: string,
  fields: Field[]
): NLFilterResult {
  const lowerQuery = query.toLowerCase();
  const filters: Filter[] = [];
  let explanation = '';

  // Build field lookup
  const fieldByName = new Map(
    fields.map((f) => [f.name.toLowerCase(), f])
  );

  // Pattern: "high priority" / "priority is high"
  for (const [name, field] of fieldByName) {
    if (field.type === 'select' && field.options?.choices) {
      for (const choice of field.options.choices) {
        const choiceLower = choice.name.toLowerCase();
        if (lowerQuery.includes(choiceLower) && lowerQuery.includes(name)) {
          filters.push({
            id: `ai-${Date.now()}-${field.id}`,
            fieldId: field.id,
            operator: 'equals',
            value: choice.name,
          });
          explanation += `Filter ${field.name} = "${choice.name}". `;
        }
      }
    }
  }

  // Pattern: "due this week" / "due today"
  const dateFields = fields.filter((f) => f.type === 'date');
  if (lowerQuery.includes('today')) {
    const today = new Date().toISOString().split('T')[0];
    for (const df of dateFields) {
      if (lowerQuery.includes(df.name.toLowerCase()) || lowerQuery.includes('due')) {
        filters.push({
          id: `ai-${Date.now()}-${df.id}`,
          fieldId: df.id,
          operator: 'equals',
          value: today,
        });
        explanation += `Filter ${df.name} = today (${today}). `;
      }
    }
  }

  // Pattern: "greater than 100" / "> 50"
  const numMatch = lowerQuery.match(/(greater than|more than|above|>)\s*(\d+)/);
  if (numMatch) {
    const threshold = Number(numMatch[2]);
    const numFields = fields.filter((f) => f.type === 'number' || f.type === 'currency' || f.type === 'percent');
    for (const nf of numFields) {
      if (lowerQuery.includes(nf.name.toLowerCase())) {
        filters.push({
          id: `ai-${Date.now()}-${nf.id}`,
          fieldId: nf.id,
          operator: 'greaterThan',
          value: threshold,
        });
        explanation += `Filter ${nf.name} > ${threshold}. `;
      }
    }
  }

  const confidence = filters.length > 0 ? Math.min(0.5 + filters.length * 0.15, 0.95) : 0.1;

  return {
    filters,
    explanation: explanation || 'Could not parse a filter from the query. Try being more specific.',
    confidence,
  };
}

// ── Column Auto-Mapping ────────────────────────────────

export interface ColumnMapping {
  sourceColumn: string;
  targetField: Field | null;
  confidence: number;
  reason: string;
}

/**
 * Auto-map imported column headers to existing fields using fuzzy matching.
 */
export function autoMapColumns(
  sourceColumns: string[],
  targetFields: Field[]
): ColumnMapping[] {
  return sourceColumns.map((col) => {
    const colLower = col.toLowerCase().replace(/[_\-\s]+/g, '');
    let bestMatch: Field | null = null;
    let bestScore = 0;
    let bestReason = 'No match found';

    for (const field of targetFields) {
      const fieldLower = field.name.toLowerCase().replace(/[_\-\s]+/g, '');

      // Exact match
      if (colLower === fieldLower) {
        return { sourceColumn: col, targetField: field, confidence: 1.0, reason: 'Exact match' };
      }

      // Contains match
      if (colLower.includes(fieldLower) || fieldLower.includes(colLower)) {
        const score = 0.8;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = field;
          bestReason = 'Partial name match';
        }
      }

      // Levenshtein-like similarity (simple)
      const similarity = computeSimilarity(colLower, fieldLower);
      if (similarity > bestScore && similarity > 0.5) {
        bestScore = similarity;
        bestMatch = field;
        bestReason = `Fuzzy match (${Math.round(similarity * 100)}% similar)`;
      }

      // Type hint matching (e.g. column named "email" → email field type)
      const typeHints: { [key: string]: string[] } = {
        email: ['email', 'e-mail', 'mail'],
        phone: ['phone', 'tel', 'mobile', 'cell'],
        url: ['url', 'link', 'website', 'href'],
        date: ['date', 'created', 'updated', 'due', 'deadline', 'timestamp'],
        number: ['count', 'amount', 'total', 'qty', 'quantity', 'price', 'cost'],
        checkbox: ['active', 'enabled', 'done', 'completed', 'verified'],
      };

      for (const [type, hints] of Object.entries(typeHints)) {
        if (hints.some((h) => colLower.includes(h)) && field.type === type) {
          const score = 0.7;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = field;
            bestReason = `Type hint match (${type})`;
          }
        }
      }
    }

    return {
      sourceColumn: col,
      targetField: bestMatch,
      confidence: bestScore,
      reason: bestReason,
    };
  });
}

// ── Anomaly Detection ──────────────────────────────────

export interface Anomaly {
  recordId: string;
  fieldId: string;
  fieldName: string;
  value: FieldValue;
  type: 'outlier' | 'duplicate' | 'missing' | 'format-mismatch';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Detect anomalies in a dataset: outliers, duplicates, missing values, format issues.
 */
export function detectAnomalies(
  records: Record[],
  fields: Field[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const field of fields) {
    const values = records.map((r) => ({ recordId: r.id, value: r.fields[field.id] }));

    // Missing value detection (for required-looking fields like primary)
    if (field.isPrimary || field.required) {
      for (const { recordId, value } of values) {
        if (value === null || value === undefined || value === '') {
          anomalies.push({
            recordId,
            fieldId: field.id,
            fieldName: field.name,
            value,
            type: 'missing',
            severity: 'high',
            description: `Missing value in required field "${field.name}"`,
          });
        }
      }
    }

    // Numeric outlier detection (IQR method)
    if (field.type === 'number' || field.type === 'currency' || field.type === 'percent') {
      const nums = values
        .filter(({ value }) => value !== null && value !== undefined && !isNaN(Number(value)))
        .map(({ recordId, value }) => ({ recordId, num: Number(value) }));

      if (nums.length >= 4) {
        const sorted = [...nums].sort((a, b) => a.num - b.num);
        const q1 = sorted[Math.floor(sorted.length * 0.25)].num;
        const q3 = sorted[Math.floor(sorted.length * 0.75)].num;
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        for (const { recordId, num } of nums) {
          if (num < lowerBound || num > upperBound) {
            anomalies.push({
              recordId,
              fieldId: field.id,
              fieldName: field.name,
              value: num,
              type: 'outlier',
              severity: 'medium',
              description: `Outlier detected: ${num} is outside expected range [${lowerBound.toFixed(1)}, ${upperBound.toFixed(1)}]`,
            });
          }
        }
      }
    }

    // Duplicate detection (text/select fields)
    if (field.type === 'text' || field.type === 'email') {
      const seen = new Map<string, string>();
      for (const { recordId, value } of values) {
        if (value === null || value === undefined || value === '') continue;
        const key = String(value).toLowerCase().trim();
        if (seen.has(key)) {
          anomalies.push({
            recordId,
            fieldId: field.id,
            fieldName: field.name,
            value,
            type: 'duplicate',
            severity: 'low',
            description: `Duplicate value "${value}" (also in record ${seen.get(key)})`,
          });
        } else {
          seen.set(key, recordId);
        }
      }
    }
  }

  return anomalies;
}

// ── Smart Data Summarization ───────────────────────────

export interface DataSummary {
  totalRecords: number;
  fieldSummaries: FieldSummary[];
  topIssues: string[];
}

export interface FieldSummary {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  fillRate: number; // 0-1, percentage of non-empty values
  uniqueCount: number;
  stats?: { min: number; max: number; mean: number; median: number };
  topValues?: { value: string; count: number }[];
}

export function summarizeData(records: Record[], fields: Field[]): DataSummary {
  const fieldSummaries: FieldSummary[] = [];
  const issues: string[] = [];

  for (const field of fields) {
    const values = records.map((r) => r.fields[field.id]);
    const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '');
    const fillRate = records.length > 0 ? nonEmpty.length / records.length : 0;

    const summary: FieldSummary = {
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      fillRate,
      uniqueCount: new Set(nonEmpty.map((v) => JSON.stringify(v))).size,
    };

    // Numeric stats
    if (field.type === 'number' || field.type === 'currency' || field.type === 'percent') {
      const nums = nonEmpty.map((v) => Number(v)).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        summary.stats = {
          min: nums[0],
          max: nums[nums.length - 1],
          mean: nums.reduce((a, b) => a + b, 0) / nums.length,
          median: nums[Math.floor(nums.length / 2)],
        };
      }
    }

    // Top values for categorical fields
    if (field.type === 'select' || field.type === 'multiselect' || field.type === 'text') {
      const counts = new Map<string, number>();
      for (const v of nonEmpty) {
        const key = String(v);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      summary.topValues = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }

    // Flag issues
    if (fillRate < 0.5) {
      issues.push(`"${field.name}" has only ${Math.round(fillRate * 100)}% fill rate`);
    }
    if (summary.uniqueCount === 1 && nonEmpty.length > 5) {
      issues.push(`"${field.name}" has only 1 unique value across ${nonEmpty.length} records`);
    }

    fieldSummaries.push(summary);
  }

  return {
    totalRecords: records.length,
    fieldSummaries,
    topIssues: issues,
  };
}

// ── Utility: String Similarity ─────────────────────────

function computeSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;

  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer[i - 1] !== shorter[j - 1]) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }

  return (longer.length - costs[shorter.length]) / longer.length;
}
