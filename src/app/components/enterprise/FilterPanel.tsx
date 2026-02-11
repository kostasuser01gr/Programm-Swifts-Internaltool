import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Field, Filter } from '../../types';

interface FilterPanelProps {
  fields: Field[];
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
  onClose: () => void;
}

const OPERATORS: { value: Filter['operator']; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'notEquals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'notContains', label: 'not contains' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
  { value: 'greaterThan', label: 'greater than' },
  { value: 'lessThan', label: 'less than' },
];

export function FilterPanel({ fields, filters, onFiltersChange, onClose }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters);

  const addFilter = () => {
    const newFilter: Filter = {
      id: `filter-${Date.now()}`,
      fieldId: fields[0]?.id || '',
      operator: 'contains',
      value: '',
    };
    setLocalFilters([...localFilters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<Filter>) => {
    const updated = localFilters.map((f, i) => (i === index ? { ...f, ...updates } : f));
    setLocalFilters(updated);
  };

  const removeFilter = (index: number) => {
    setLocalFilters(localFilters.filter((_, i) => i !== index));
  };

  const apply = () => {
    onFiltersChange(localFilters);
  };

  const clearAll = () => {
    setLocalFilters([]);
    onFiltersChange([]);
  };

  const needsValue = (op: string) => !['isEmpty', 'isNotEmpty'].includes(op);

  const getValueInput = (filter: Filter, index: number) => {
    const field = fields.find((f) => f.id === filter.fieldId);
    if (!needsValue(filter.operator)) return null;

    if (field?.type === 'select' && field.options?.choices) {
      return (
        <select
          value={filter.value || ''}
          onChange={(e) => updateFilter(index, { value: e.target.value })}
          className="h-8 px-2 text-sm border border-gray-300 rounded-md"
        >
          <option value="">Select...</option>
          {field.options.choices.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      );
    }

    return (
      <Input
        value={filter.value || ''}
        onChange={(e) => updateFilter(index, { value: e.target.value })}
        placeholder="Value..."
        className="h-8 w-32 text-sm"
      />
    );
  };

  return (
    <div className="border-b border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        <div className="flex gap-1">
          {localFilters.length > 0 && (
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
        {localFilters.map((filter, index) => (
          <div key={filter.id} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">{index === 0 ? 'Where' : 'And'}</span>

            <select
              value={filter.fieldId}
              onChange={(e) => updateFilter(index, { fieldId: e.target.value })}
              className="h-8 px-2 text-sm border border-gray-300 rounded-md"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            <select
              value={filter.operator}
              onChange={(e) => updateFilter(index, { operator: e.target.value as Filter['operator'] })}
              className="h-8 px-2 text-sm border border-gray-300 rounded-md"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            {getValueInput(filter, index)}

            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeFilter(index)}>
              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addFilter}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add filter
        </Button>
        {localFilters.length > 0 && (
          <Button size="sm" className="h-7 text-xs" onClick={apply}>
            Apply filters
          </Button>
        )}
      </div>
    </div>
  );
}
