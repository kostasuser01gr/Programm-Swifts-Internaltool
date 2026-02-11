import { useCallback } from 'react';
import type { Field, Record as TableRecord } from '../types';

export function useDataExport() {
  const exportToCSV = useCallback(
    (fields: Field[], records: TableRecord[], filename: string = 'export') => {
      const headers = fields.map((f) => f.name);
      const rows = records.map((record) =>
        fields.map((field) => {
          const value = record.fields[field.id];
          if (Array.isArray(value)) return value.join('; ');
          if (value === null || value === undefined) return '';
          return String(value);
        })
      );

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
    },
    []
  );

  const exportToJSON = useCallback(
    (fields: Field[], records: TableRecord[], filename: string = 'export', includeMetadata = false) => {
      const data = records.map((record) => {
        const obj: Record<string, unknown> = {};
        fields.forEach((field) => {
          obj[field.name] = record.fields[field.id];
        });
        if (includeMetadata) {
          obj._id = record.id;
          obj._createdTime = record.createdTime;
          obj._modifiedTime = record.modifiedTime;
          obj._version = record.version;
        }
        return obj;
      });

      const jsonContent = JSON.stringify(data, null, 2);
      downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
    },
    []
  );

  const importFromCSV = useCallback(
    (content: string): { headers: string[]; rows: string[][] } => {
      const lines = content.split('\n').filter((l) => l.trim());
      if (lines.length === 0) return { headers: [], rows: [] };

      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(parseCSVLine);

      return { headers, rows };
    },
    []
  );

  const importFromJSON = useCallback(
    (content: string): { headers: string[]; rows: string[][] } => {
      const data = JSON.parse(content);
      if (!Array.isArray(data) || data.length === 0) return { headers: [], rows: [] };

      const headers = Object.keys(data[0]).filter((k) => !k.startsWith('_'));
      const rows = data.map((item: Record<string, unknown>) =>
        headers.map((h) => {
          const val = item[h];
          if (val === null || val === undefined) return '';
          if (Array.isArray(val)) return val.join('; ');
          return String(val);
        })
      );

      return { headers, rows };
    },
    []
  );

  return { exportToCSV, exportToJSON, importFromCSV, importFromJSON };
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
