import { X, Calendar, User, Tag, History } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Field, FieldValue, Record as TableRecord } from '../../types';
import { toast } from 'sonner';

interface RecordDetailProps {
  record: TableRecord;
  fields: Field[];
  onClose: () => void;
  onFieldChange: (fieldId: string, value: FieldValue) => void;
  members: { id: string; name: string; email: string }[];
}

export function RecordDetail({ record, fields, onClose, onFieldChange, members }: RecordDetailProps) {
  const primaryField = fields.find((f) => f.isPrimary);

  const renderFieldInput = (field: Field) => {
    const value = record.fields[field.id];

    switch (field.type) {
      case 'text':
        if (field.name.toLowerCase().includes('description') || field.name.toLowerCase().includes('notes')) {
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}...`}
              className="min-h-[100px]"
            />
          );
        }
        return (
          <Input
            value={value || ''}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onFieldChange(field.id, parseFloat(e.target.value))}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">Checked</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            aria-label={field.name}
          >
            <option value="">Select an option</option>
            {field.options?.choices?.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.name}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.choices?.map((choice) => (
              <label key={choice.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(choice.id)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...selected, choice.id]
                      : selected.filter((id) => id !== choice.id);
                    onFieldChange(field.id, newValue);
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${choice.color}20`,
                    color: choice.color === '#gray' ? '#4B5563' : choice.color,
                  }}
                >
                  {choice.name}
                </span>
              </label>
            ))}
          </div>
        );

      case 'user':
        return (
          <select
            value={value || ''}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            aria-label={field.name}
          >
            <option value="">Select a user</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        );
    }
  };

  const getFieldIcon = (type: string) => {
    const icons: Record<string, any> = {
      date: Calendar,
      user: User,
      select: Tag,
      multiselect: Tag,
    };
    return icons[type];
  };

  return (
    <div className="w-[500px] bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <Input
            value={record.fields[primaryField?.id || ''] || 'Untitled'}
            onChange={(e) => primaryField && onFieldChange(primaryField.id, e.target.value)}
            className="font-semibold text-lg border-none shadow-none px-0 focus-visible:ring-0"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Fields */}
          {fields.filter((f) => !f.isPrimary).map((field) => {
            const Icon = getFieldIcon(field.type);
            
            return (
              <div key={field.id} className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                  {field.name}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderFieldInput(field)}
                {field.description && (
                  <p className="text-xs text-gray-500">{field.description}</p>
                )}
              </div>
            );
          })}

          <Separator className="my-6" />

          {/* Activity */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <History className="w-4 h-4" />
              Activity
            </h4>
            
            <div className="space-y-3">
              <div className="flex gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                  {members.find((m) => m.id === record.modifiedBy)?.name.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-gray-900">
                    <span className="font-medium">
                      {members.find((m) => m.id === record.modifiedBy)?.name || 'Unknown'}
                    </span>{' '}
                    updated this record
                  </p>
                  <p className="text-gray-500">
                    {new Date(record.modifiedTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                  {members.find((m) => m.id === record.createdBy)?.name.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-gray-900">
                    <span className="font-medium">
                      {members.find((m) => m.id === record.createdBy)?.name || 'Unknown'}
                    </span>{' '}
                    created this record
                  </p>
                  <p className="text-gray-500">
                    {new Date(record.createdTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <Separator className="my-6" />
          
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Record ID</span>
              <span className="font-mono">{record.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Version</span>
              <span>{record.version}</span>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1" onClick={() => { toast.success('Changes saved successfully'); onClose(); }}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
