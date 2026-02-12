import { useState } from 'react';
import { Plus, Trash2, GripVertical, Type, Hash, Calendar, CheckSquare2, List, Star, Users, Link, Mail, Phone, Image, X, Settings2, Save } from 'lucide-react';
import { Field, FieldType } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { ColorDot } from '../ui/ColorBadge';

interface FieldEditorProps {
  fields: Field[];
  onSave: (fields: Field[]) => void;
  onClose: () => void;
}

const FIELD_TYPE_OPTIONS: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Single Line Text', icon: <Type className="w-4 h-4" /> },
  { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
  { type: 'select', label: 'Single Select', icon: <List className="w-4 h-4" /> },
  { type: 'multiselect', label: 'Multi Select', icon: <List className="w-4 h-4" /> },
  { type: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare2 className="w-4 h-4" /> },
  { type: 'user', label: 'User', icon: <Users className="w-4 h-4" /> },
  { type: 'rating', label: 'Rating', icon: <Star className="w-4 h-4" /> },
  { type: 'currency', label: 'Currency', icon: <Hash className="w-4 h-4" /> },
  { type: 'percent', label: 'Percent', icon: <Hash className="w-4 h-4" /> },
  { type: 'url', label: 'URL', icon: <Link className="w-4 h-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { type: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
  { type: 'attachment', label: 'Attachment', icon: <Image className="w-4 h-4" /> },
  { type: 'richtext', label: 'Rich Text', icon: <Type className="w-4 h-4" /> },
];

const CHOICE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#9CA3AF'];

export function FieldEditor({ fields, onSave, onClose }: FieldEditorProps) {
  const [editableFields, setEditableFields] = useState<Field[]>([...fields]);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [addingField, setAddingField] = useState(false);

  const handleFieldChange = (fieldId: string, updates: Partial<Field>) => {
    setEditableFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  };

  const handleAddChoice = (fieldId: string) => {
    setEditableFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const choices = f.options?.choices || [];
          return {
            ...f,
            options: {
              ...f.options,
              choices: [
                ...choices,
                {
                  id: `choice-${Date.now()}`,
                  name: `Option ${choices.length + 1}`,
                  color: CHOICE_COLORS[choices.length % CHOICE_COLORS.length],
                },
              ],
            },
          };
        }
        return f;
      })
    );
  };

  const handleRemoveChoice = (fieldId: string, choiceId: string) => {
    setEditableFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            options: {
              ...f.options,
              choices: f.options?.choices?.filter((c) => c.id !== choiceId),
            },
          };
        }
        return f;
      })
    );
  };

  const handleUpdateChoice = (fieldId: string, choiceId: string, name: string) => {
    setEditableFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            options: {
              ...f.options,
              choices: f.options?.choices?.map((c) => (c.id === choiceId ? { ...c, name } : c)),
            },
          };
        }
        return f;
      })
    );
  };

  const handleAddField = (type: FieldType) => {
    const typeInfo = FIELD_TYPE_OPTIONS.find((t) => t.type === type);
    const newField: Field = {
      id: `fld-${Date.now()}`,
      name: typeInfo?.label || 'New Field',
      type,
      required: false,
      options: type === 'select' || type === 'multiselect' ? {
        choices: [
          { id: `choice-${Date.now()}-1`, name: 'Option 1', color: '#3B82F6' },
          { id: `choice-${Date.now()}-2`, name: 'Option 2', color: '#10B981' },
        ],
      } : undefined,
    };

    setEditableFields((prev) => [...prev, newField]);
    setAddingField(false);
    setExpandedField(newField.id);
    toast.success('Field added');
  };

  const handleDeleteField = (fieldId: string) => {
    const field = editableFields.find((f) => f.id === fieldId);
    if (field?.isPrimary) {
      toast.error('Cannot delete primary field');
      return;
    }
    setEditableFields((prev) => prev.filter((f) => f.id !== fieldId));
    toast.success('Field removed');
  };

  const handleSave = () => {
    onSave(editableFields);
    toast.success('Fields saved');
    onClose();
  };

  return (
    <div className="w-[400px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Field Editor</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="default" size="sm" className="h-7 text-xs" onClick={handleSave}>
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {editableFields.map((field) => (
            <div
              key={field.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Field header */}
              <button
                className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
              >
                <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 cursor-grab" />
                <div className="flex-shrink-0 text-gray-400">
                  {FIELD_TYPE_OPTIONS.find((t) => t.type === field.type)?.icon || <Type className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 truncate">
                  {field.name}
                </span>
                <span className="text-[10px] text-gray-400 flex-shrink-0 capitalize">{field.type}</span>
                {field.isPrimary && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 rounded">primary</span>
                )}
              </button>

              {/* Expanded field editor */}
              {expandedField === field.id && (
                <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Field Name</label>
                    <Input
                      value={field.name}
                      onChange={(e) => handleFieldChange(field.id, { name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <Input
                      value={field.description || ''}
                      onChange={(e) => handleFieldChange(field.id, { description: e.target.value })}
                      placeholder="Optional description..."
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) => handleFieldChange(field.id, { required: e.target.checked })}
                        className="w-3.5 h-3.5 rounded"
                      />
                      Required
                    </label>
                  </div>

                  {/* Select/multiselect choices */}
                  {(field.type === 'select' || field.type === 'multiselect') && (
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">Options</label>
                      <div className="space-y-1">
                        {field.options?.choices?.map((choice) => (
                          <div key={choice.id} className="flex items-center gap-2">
                            <ColorDot
                              color={choice.color}
                              className="w-3 h-3 rounded-full flex-shrink-0"
                            />
                            <Input
                              value={choice.name}
                              onChange={(e) => handleUpdateChoice(field.id, choice.id, e.target.value)}
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-300 hover:text-red-400"
                              onClick={() => handleRemoveChoice(field.id, choice.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-blue-500 w-full justify-start"
                          onClick={() => handleAddChoice(field.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add option
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Delete button */}
                  {!field.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs w-full justify-start"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete field
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add field */}
        <div className="p-4 pt-0">
          {addingField ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Choose field type</p>
              <div className="grid grid-cols-2 gap-1">
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    onClick={() => handleAddField(opt.type)}
                  >
                    <span className="text-gray-400">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-xs w-full mt-2" onClick={() => setAddingField(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setAddingField(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add field
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
