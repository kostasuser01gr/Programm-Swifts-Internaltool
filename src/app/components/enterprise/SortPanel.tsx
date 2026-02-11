import { useState } from 'react';
import { Plus, X, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Field, Sort } from '../../types';

interface SortPanelProps {
  fields: Field[];
  sorts: Sort[];
  onSortsChange: (sorts: Sort[]) => void;
  onClose: () => void;
}

export function SortPanel({ fields, sorts, onSortsChange, onClose }: SortPanelProps) {
  const [localSorts, setLocalSorts] = useState<Sort[]>(sorts);

  const addSort = () => {
    const usedFieldIds = new Set(localSorts.map((s) => s.fieldId));
    const available = fields.find((f) => !usedFieldIds.has(f.id));
    if (!available) return;
    setLocalSorts([...localSorts, { fieldId: available.id, direction: 'asc' }]);
  };

  const updateSort = (index: number, updates: Partial<Sort>) => {
    const updated = localSorts.map((s, i) => (i === index ? { ...s, ...updates } : s));
    setLocalSorts(updated);
  };

  const removeSort = (index: number) => {
    const updated = localSorts.filter((_, i) => i !== index);
    setLocalSorts(updated);
    onSortsChange(updated);
  };

  const apply = () => {
    onSortsChange(localSorts);
  };

  const clearAll = () => {
    setLocalSorts([]);
    onSortsChange([]);
  };

  return (
    <div className="border-b border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Sort</h3>
        <div className="flex gap-1">
          {localSorts.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
              Clear all
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {localSorts.map((sort, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">{index === 0 ? 'Sort by' : 'Then by'}</span>

            <select
              value={sort.fieldId}
              onChange={(e) => updateSort(index, { fieldId: e.target.value })}
              className="h-8 px-2 text-sm border border-gray-300 rounded-md"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            <Button
              variant={sort.direction === 'asc' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => updateSort(index, { direction: 'asc' })}
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" />
              A→Z
            </Button>
            <Button
              variant={sort.direction === 'desc' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => updateSort(index, { direction: 'desc' })}
            >
              <ArrowDown className="w-3.5 h-3.5 mr-1" />
              Z→A
            </Button>

            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeSort(index)}>
              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={addSort}
          disabled={localSorts.length >= fields.length}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add sort
        </Button>
        {localSorts.length > 0 && (
          <Button size="sm" className="h-7 text-xs" onClick={apply}>
            Apply sort
          </Button>
        )}
      </div>
    </div>
  );
}
