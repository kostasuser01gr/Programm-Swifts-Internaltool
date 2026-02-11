import { useState } from 'react';
import { Plus, X, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Field, Group } from '../../types';

interface GroupPanelProps {
  fields: Field[];
  groups: Group[];
  onGroupsChange: (groups: Group[]) => void;
  onClose: () => void;
}

export function GroupPanel({ fields, groups, onGroupsChange, onClose }: GroupPanelProps) {
  const [localGroups, setLocalGroups] = useState<Group[]>(groups);

  const groupableFields = fields.filter((f) => ['select', 'multiselect', 'checkbox', 'user'].includes(f.type));

  const addGroup = () => {
    const usedFieldIds = new Set(localGroups.map((g) => g.fieldId));
    const available = groupableFields.find((f) => !usedFieldIds.has(f.id));
    if (!available) return;
    setLocalGroups([...localGroups, { fieldId: available.id, order: 'asc' }]);
  };

  const updateGroup = (index: number, updates: Partial<Group>) => {
    const updated = localGroups.map((g, i) => (i === index ? { ...g, ...updates } : g));
    setLocalGroups(updated);
  };

  const removeGroup = (index: number) => {
    const updated = localGroups.filter((_, i) => i !== index);
    setLocalGroups(updated);
    onGroupsChange(updated);
  };

  const apply = () => {
    onGroupsChange(localGroups);
  };

  const clearAll = () => {
    setLocalGroups([]);
    onGroupsChange([]);
  };

  return (
    <div className="border-b border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Group</h3>
        <div className="flex gap-1">
          {localGroups.length > 0 && (
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
        {localGroups.map((group, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">{index === 0 ? 'Group by' : 'Then by'}</span>

            <select
              value={group.fieldId}
              onChange={(e) => updateGroup(index, { fieldId: e.target.value })}
              className="h-8 px-2 text-sm border border-gray-300 rounded-md"
            >
              {groupableFields.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            <Button
              variant={group.order === 'asc' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => updateGroup(index, { order: 'asc' })}
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" />
              First
            </Button>
            <Button
              variant={group.order === 'desc' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => updateGroup(index, { order: 'desc' })}
            >
              <ArrowDown className="w-3.5 h-3.5 mr-1" />
              Last
            </Button>

            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeGroup(index)}>
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
          onClick={addGroup}
          disabled={localGroups.length >= groupableFields.length}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add group
        </Button>
        {localGroups.length > 0 && (
          <Button size="sm" className="h-7 text-xs" onClick={apply}>
            Apply groups
          </Button>
        )}
      </div>

      {groupableFields.length === 0 && (
        <p className="text-xs text-gray-500 mt-2">No groupable fields (select, multiselect, checkbox, or user fields) available.</p>
      )}
    </div>
  );
}
