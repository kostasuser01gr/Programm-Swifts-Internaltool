import { useState } from 'react';
import { Trash2, Edit3, Download, Tag, Copy, X, CheckSquare2 } from 'lucide-react';
import { Field, Record as TableRecord } from '../../types';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedRecords: string[];
  records: TableRecord[];
  fields: Field[];
  onDelete: (ids: string[]) => void;
  onUpdateField: (ids: string[], fieldId: string, value: unknown) => void;
  onExport: (ids: string[]) => void;
  onDuplicate: (ids: string[]) => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedRecords,
  records,
  fields,
  onDelete,
  onUpdateField,
  onExport,
  onDuplicate,
  onClearSelection,
}: BulkActionsProps) {
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (selectedRecords.length === 0) return null;

  const selectFields = fields.filter((f) => f.type === 'select');

  const handleBulkUpdate = () => {
    if (editField && editValue) {
      onUpdateField(selectedRecords, editField, editValue);
      setEditField(null);
      setEditValue('');
      toast.success(`Updated ${selectedRecords.length} records`);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-gray-900 dark:bg-gray-100 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 text-white dark:text-gray-900">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-700 dark:border-gray-300">
          <CheckSquare2 className="w-4 h-4 text-blue-400 dark:text-blue-600" />
          <span className="text-sm font-medium">{selectedRecords.length} selected</span>
        </div>

        {/* Quick field edit */}
        {editField ? (
          <div className="flex items-center gap-2">
            <select
              title="Select new value"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 px-2 bg-gray-800 dark:bg-gray-200 rounded-md text-sm border border-gray-700 dark:border-gray-300"
            >
              <option value="">Select value...</option>
              {(() => {
                const field = fields.find((f) => f.id === editField);
                return field?.options?.choices?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ));
              })()}
            </select>
            <Button size="sm" className="h-8" onClick={handleBulkUpdate} disabled={!editValue}>
              Apply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400"
              onClick={() => { setEditField(null); setEditValue(''); }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk edit dropdown */}
            {selectFields.length > 0 && (
              <div className="relative">
                <select
                  title="Select field to edit"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setEditField(e.target.value);
                  }}
                  className="h-8 px-2 bg-gray-800 dark:bg-gray-200 rounded-md text-sm border border-gray-700 dark:border-gray-300 cursor-pointer appearance-none pr-6"
                >
                  <option value="">Edit field...</option>
                  {selectFields.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <Tag className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            )}

            {/* Action buttons */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
              onClick={() => onDuplicate(selectedRecords)}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Duplicate
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
              onClick={() => onExport(selectedRecords)}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-red-400 hover:text-red-300 hover:bg-red-950/50"
              onClick={() => {
                onDelete(selectedRecords);
                toast.success(`Deleted ${selectedRecords.length} records`);
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          </>
        )}

        {/* Close button */}
        <div className="pl-3 border-l border-gray-700 dark:border-gray-300">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-white dark:hover:text-gray-900"
            onClick={onClearSelection}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
