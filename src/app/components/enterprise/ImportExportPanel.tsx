import { useState, useCallback } from 'react';
import { Upload, Download, FileJson, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Field, Record as TableRecord } from '../../types';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface ImportExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  records: TableRecord[];
  tableName: string;
  onImport: (records: Partial<TableRecord>[]) => void;
}

type TabType = 'export' | 'import';
type FormatType = 'csv' | 'json';

export function ImportExportPanel({ isOpen, onClose, fields, records, tableName, onImport }: ImportExportPanelProps) {
  const [tab, setTab] = useState<TabType>('export');
  const [format, setFormat] = useState<FormatType>('csv');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

  const exportToCSV = useCallback(() => {
    const headers = fields.map((f) => f.name);
    const rows = records.map((record) =>
      fields.map((field) => {
        const val = record.fields[field.id];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        if (Array.isArray(val)) return `"${val.join(', ')}"`;
        return String(val);
      })
    );

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `${tableName}.csv`, 'text/csv');
    toast.success(`Exported ${records.length} records as CSV`);
  }, [fields, records, tableName]);

  const exportToJSON = useCallback(() => {
    const data = records.map((record) => {
      const obj: Record<string, unknown> = { id: record.id };
      fields.forEach((field) => {
        obj[field.name] = record.fields[field.id] ?? null;
      });
      return obj;
    });

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${tableName}.json`, 'application/json');
    toast.success(`Exported ${records.length} records as JSON`);
  }, [fields, records, tableName]);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      let importedRecords: Partial<TableRecord>[] = [];
      let errors = 0;

      if (format === 'csv') {
        // Simple CSV parsing
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) {
          toast.error('CSV file must have at least a header row and one data row');
          setImporting(false);
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
        const fieldMap = new Map<number, Field>();
        headers.forEach((header, idx) => {
          const field = fields.find((f) => f.name.toLowerCase() === header.toLowerCase());
          if (field) fieldMap.set(idx, field);
        });

        for (let i = 1; i < lines.length; i++) {
          try {
            const values = parseCSVLine(lines[i]);
            const fieldValues: Record<string, unknown> = {};
            fieldMap.forEach((field, idx) => {
              if (idx < values.length) {
                fieldValues[field.id] = parseFieldValue(field, values[idx]);
              }
            });
            importedRecords.push({
              id: `rec-import-${Date.now()}-${i}`,
              fields: fieldValues,
              createdTime: new Date().toISOString(),
              modifiedTime: new Date().toISOString(),
              version: 1,
            });
          } catch {
            errors++;
          }
        }
      } else {
        // JSON parsing
        try {
          const data = JSON.parse(text);
          const arr = Array.isArray(data) ? data : [data];
          arr.forEach((item, i) => {
            try {
              const fieldValues: Record<string, unknown> = {};
              fields.forEach((field) => {
                if (item[field.name] !== undefined) {
                  fieldValues[field.id] = item[field.name];
                }
              });
              importedRecords.push({
                id: `rec-import-${Date.now()}-${i}`,
                fields: fieldValues,
                createdTime: new Date().toISOString(),
                modifiedTime: new Date().toISOString(),
                version: 1,
              });
            } catch {
              errors++;
            }
          });
        } catch {
          toast.error('Invalid JSON file');
          setImporting(false);
          return;
        }
      }

      onImport(importedRecords);
      setImportResult({ success: importedRecords.length, errors });
      toast.success(`Imported ${importedRecords.length} records`);
    } catch (err) {
      toast.error('Failed to import file');
    } finally {
      setImporting(false);
    }
  }, [format, fields, onImport]);

  if (!isOpen) return null;

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Import / Export</h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
        <button
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'export' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('export')}
        >
          <Download className="w-3.5 h-3.5 inline mr-1" />
          Export
        </button>
        <button
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'import' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('import')}
        >
          <Upload className="w-3.5 h-3.5 inline mr-1" />
          Import
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {tab === 'export' ? (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Export <strong>{records.length}</strong> records from <strong>{tableName}</strong>
            </p>

            <div className="space-y-3">
              {/* CSV option */}
              <button
                className="w-full flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                onClick={exportToCSV}
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">CSV</div>
                  <div className="text-xs text-gray-500">Compatible with Excel, Google Sheets</div>
                </div>
              </button>

              {/* JSON option */}
              <button
                className="w-full flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                onClick={exportToJSON}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileJson className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">JSON</div>
                  <div className="text-xs text-gray-500">Structured data, API-compatible</div>
                </div>
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Fields included:</p>
              <div className="flex flex-wrap gap-1">
                {fields.map((f) => (
                  <span key={f.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Import records into <strong>{tableName}</strong>
            </p>

            {/* Format selector */}
            <div className="flex gap-2">
              <button
                className={`flex-1 p-3 border rounded-lg text-sm font-medium transition-colors ${
                  format === 'csv' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'
                }`}
                onClick={() => setFormat('csv')}
              >
                <FileSpreadsheet className="w-4 h-4 mx-auto mb-1" />
                CSV
              </button>
              <button
                className={`flex-1 p-3 border rounded-lg text-sm font-medium transition-colors ${
                  format === 'json' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'
                }`}
                onClick={() => setFormat('json')}
              >
                <FileJson className="w-4 h-4 mx-auto mb-1" />
                JSON
              </button>
            </div>

            {/* Upload area */}
            <label className="block border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer">
              <input
                type="file"
                accept={format === 'csv' ? '.csv' : '.json'}
                onChange={handleImport}
                className="hidden"
              />
              {importing ? (
                <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload {format.toUpperCase()} file</p>
                  <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
                </>
              )}
            </label>

            {/* Import result */}
            {importResult && (
              <div className={`p-3 rounded-lg ${importResult.errors > 0 ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                <div className="flex items-center gap-2">
                  {importResult.errors > 0 ? (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium">
                    {importResult.success} records imported
                    {importResult.errors > 0 && `, ${importResult.errors} errors`}
                  </span>
                </div>
              </div>
            )}

            {/* Column mapping info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Expected columns:</p>
              <div className="flex flex-wrap gap-1">
                {fields.map((f) => (
                  <span key={f.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {f.name} ({f.type})
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseFieldValue(field: Field, value: string): unknown {
  if (value === '') return null;
  switch (field.type) {
    case 'number':
    case 'currency':
    case 'percent':
    case 'rating':
      return Number(value) || 0;
    case 'checkbox':
      return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
    case 'multiselect':
      return value.split(',').map((v) => v.trim());
    default:
      return value;
  }
}
