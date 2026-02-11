import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown, Plus, GripVertical, MoreHorizontal,
  Type, Hash, Tag, Tags, CalendarDays, CheckSquare, User,
  Paperclip, FunctionSquare, Link, AlertCircle,
} from 'lucide-react';
import { Field, Record as TableRecord } from '../../types';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface GridViewProps {
  fields: Field[];
  records: TableRecord[];
  onRecordClick: (record: TableRecord) => void;
  onCellChange: (recordId: string, fieldId: string, value: unknown) => void;
  onAddRecord?: () => void;
  members: { id: string; name: string; email: string }[];
}

const FIELD_ICONS: Record<string, typeof Type> = {
  text: Type,
  number: Hash,
  select: Tag,
  multiselect: Tags,
  date: CalendarDays,
  checkbox: CheckSquare,
  user: User,
  attachment: Paperclip,
  formula: FunctionSquare,
  link: Link,
};

export function GridView({ fields, records, onRecordClick, onCellChange, onAddRecord, members }: GridViewProps) {
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const validateAndSave = useCallback((field: Field, value: string) => {
    if (field.required && !value.trim()) {
      setValidationError(`${field.name} is required`);
      return false;
    }

    if (field.type === 'number') {
      if (value && isNaN(Number(value))) {
        setValidationError('Must be a valid number');
        return false;
      }
      setValidationError(null);
      return true;
    }

    setValidationError(null);
    return true;
  }, []);

  const handleCellClick = (record: TableRecord, field: Field) => {
    if (field.type === 'checkbox') {
      onCellChange(record.id, field.id, !record.fields[field.id]);
      return;
    }
    if (['select', 'multiselect', 'user'].includes(field.type)) {
      onRecordClick(record);
      return;
    }
    setEditingCell({ recordId: record.id, fieldId: field.id });
    setEditValue(record.fields[field.id]?.toString() || '');
    setValidationError(null);
  };

  const handleCellBlur = () => {
    if (!editingCell) return;
    const field = fields.find((f) => f.id === editingCell.fieldId);
    if (!field) return;

    if (!validateAndSave(field, editValue)) return;

    const finalValue = field.type === 'number' && editValue ? Number(editValue) : editValue;
    onCellChange(editingCell.recordId, editingCell.fieldId, finalValue);
    setEditingCell(null);
    setValidationError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setValidationError(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();

      if (!editingCell) return;
      const recordIdx = records.findIndex((r) => r.id === editingCell.recordId);
      const fieldIdx = fields.findIndex((f) => f.id === editingCell.fieldId);
      const editableFields = fields.filter((f) => !['checkbox', 'select', 'multiselect', 'user'].includes(f.type));
      const currentEditableIdx = editableFields.findIndex((f) => f.id === editingCell.fieldId);

      if (e.shiftKey) {
        if (currentEditableIdx > 0) {
          const prevField = editableFields[currentEditableIdx - 1];
          setEditingCell({ recordId: editingCell.recordId, fieldId: prevField.id });
          setEditValue(records[recordIdx]?.fields[prevField.id]?.toString() || '');
        } else if (recordIdx > 0) {
          const lastField = editableFields[editableFields.length - 1];
          setEditingCell({ recordId: records[recordIdx - 1].id, fieldId: lastField.id });
          setEditValue(records[recordIdx - 1]?.fields[lastField.id]?.toString() || '');
        }
      } else {
        if (currentEditableIdx < editableFields.length - 1) {
          const nextField = editableFields[currentEditableIdx + 1];
          setEditingCell({ recordId: editingCell.recordId, fieldId: nextField.id });
          setEditValue(records[recordIdx]?.fields[nextField.id]?.toString() || '');
        } else if (recordIdx < records.length - 1) {
          const firstField = editableFields[0];
          setEditingCell({ recordId: records[recordIdx + 1].id, fieldId: firstField.id });
          setEditValue(records[recordIdx + 1]?.fields[firstField.id]?.toString() || '');
        }
      }
    }
  };

  const renderCell = (record: TableRecord, field: Field) => {
    const value = record.fields[field.id];
    const isEditing = editingCell?.recordId === record.id && editingCell?.fieldId === field.id;

    if (isEditing && ['text', 'number', 'date'].includes(field.type)) {
      return (
        <div className="relative">
          <input
            ref={inputRef}
            autoFocus
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            aria-label={field.name}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setValidationError(null);
            }}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyDown}
            className={`w-full h-full px-2 outline-none rounded ${
              validationError
                ? 'bg-red-50 border border-red-400'
                : 'bg-blue-50 border border-blue-400'
            }`}
          />
          {validationError && (
            <div className="absolute top-full left-0 z-20 mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded shadow-lg flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validationError}
            </div>
          )}
        </div>
      );
    }

    switch (field.type) {
      case 'text':
        return <div className="px-2 truncate">{value || ''}</div>;

      case 'number':
        return <div className="px-2 text-right">{value ?? ''}</div>;

      case 'checkbox':
        return (
          <div className="px-2">
            <input
              type="checkbox"
              checked={!!value}
              readOnly
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
            />
          </div>
        );

      case 'select': {
        const option = field.options?.choices?.find((c) => c.id === value);
        return option ? (
          <div className="px-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${option.color}20`,
                color: option.color === '#gray' ? '#4B5563' : option.color,
              }}
            >
              {option.name}
            </span>
          </div>
        ) : null;
      }

      case 'multiselect': {
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="px-2 flex gap-1 flex-wrap">
            {selected.map((id: string) => {
              const opt = field.options?.choices?.find((c) => c.id === id);
              return opt ? (
                <span
                  key={id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${opt.color}20`,
                    color: opt.color === '#gray' ? '#4B5563' : opt.color,
                  }}
                >
                  {opt.name}
                </span>
              ) : null;
            })}
          </div>
        );
      }

      case 'user': {
        const user = members.find((m) => m.id === value);
        return user ? (
          <div className="px-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-medium">
              {user.name.charAt(0)}
            </div>
            <span className="text-sm">{user.name}</span>
          </div>
        ) : null;
      }

      case 'date':
        return value ? (
          <div className="px-2 text-sm">
            {new Date(value).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        ) : null;

      default:
        return <div className="px-2 truncate">{value?.toString() || ''}</div>;
    }
  };

  const getFieldIcon = (type: string) => {
    return FIELD_ICONS[type] || Type;
  };

  const handleAddRecord = () => {
    if (onAddRecord) {
      onAddRecord();
    } else {
      toast.info('New record coming soon...');
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr>
            <th className="border border-gray-200 w-12 h-9">
              <div className="flex items-center justify-center">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
            </th>
            {fields.map((field) => {
              const Icon = getFieldIcon(field.type);
              return (
                <th
                  key={field.id}
                  className="border border-gray-200 min-w-[180px] h-9 text-left bg-gray-50 group hover:bg-gray-100"
                >
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-700">{field.name}</span>
                      {field.required && <span className="text-red-500 text-xs">*</span>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                </th>
              );
            })}
            <th className="border border-gray-200 w-12 h-9 bg-gray-50">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toast.info('Add field coming soon...')}>
                <Plus className="w-4 h-4" />
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, idx) => (
            <tr
              key={record.id}
              className="group hover:bg-blue-50"
            >
              <td className="border border-gray-200 text-center text-xs text-gray-400">
                <div className="flex items-center justify-center gap-1">
                  <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  <span>{idx + 1}</span>
                </div>
              </td>
              {fields.map((field) => (
                <td
                  key={field.id}
                  className="border border-gray-200 h-10 cursor-pointer hover:ring-1 hover:ring-blue-400"
                  onClick={() => handleCellClick(record, field)}
                >
                  {renderCell(record, field)}
                </td>
              ))}
              <td className="border border-gray-200 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={() => onRecordClick(record)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={fields.length + 2} className="border border-gray-200 h-10">
              <Button variant="ghost" className="w-full justify-start text-sm text-gray-500" onClick={handleAddRecord}>
                <Plus className="w-4 h-4 mr-2" />
                New record
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
