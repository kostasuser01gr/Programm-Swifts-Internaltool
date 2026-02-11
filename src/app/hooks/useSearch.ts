import { useState, useMemo, useCallback } from 'react';
import type { Record as TableRecord, Field } from '../types';

interface SearchResult {
  record: TableRecord;
  matches: { fieldId: string; fieldName: string; snippet: string }[];
  score: number;
}

export function useSearch(records: TableRecord[], fields: Field[]) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/);

    return records
      .map((record) => {
        const matches: SearchResult['matches'] = [];
        let score = 0;

        fields.forEach((field) => {
          const value = record.fields[field.id];
          if (value === null || value === undefined) return;

          const strValue = Array.isArray(value)
            ? value.join(' ')
            : String(value);
          const lowerValue = strValue.toLowerCase();

          // Exact match gets highest score
          if (lowerValue === q) {
            score += 100;
            matches.push({ fieldId: field.id, fieldName: field.name, snippet: strValue });
            return;
          }

          // Contains full query
          if (lowerValue.includes(q)) {
            score += 50;
            matches.push({ fieldId: field.id, fieldName: field.name, snippet: highlightMatch(strValue, q) });
            return;
          }

          // Word-level matching
          const wordMatches = words.filter((w) => lowerValue.includes(w));
          if (wordMatches.length > 0) {
            score += wordMatches.length * 20;
            matches.push({ fieldId: field.id, fieldName: field.name, snippet: strValue });
          }
        });

        return { record, matches, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [query, records, fields]);

  const search = useCallback((q: string) => {
    setIsSearching(true);
    setQuery(q);
    // Simulate async for large datasets
    setTimeout(() => setIsSearching(false), 0);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setIsSearching(false);
  }, []);

  return {
    query,
    results,
    isSearching,
    search,
    clearSearch,
    resultCount: results.length,
  };
}

function highlightMatch(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 20);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}
