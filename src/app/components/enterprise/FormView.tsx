import { useState, useCallback } from 'react';
import { Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Field, Record as TableRecord } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';

interface FormViewProps {
  fields: Field[];
  tableName: string;
  onSubmit: (record: Partial<TableRecord>) => void;
  formDescription?: string;
  submitLabel?: string;
  formFields?: string[];
}

export function FormView({ fields, tableName, onSubmit, formDescription, submitLabel = 'Submit', formFields }: FormViewProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Only show specified fields or all non-primary fields
  const visibleFields = formFields
    ? fields.filter((f) => formFields.includes(f.id))
    : fields.filter((f) => !f.isPrimary || f.required);

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    visibleFields.forEach((field) => {
      if (field.required) {
        const val = formData[field.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = `${field.name} is required`;
        }
      }
      if (field.type === 'number' && formData[field.id] !== undefined) {
        const num = Number(formData[field.id]);
        if (isNaN(num)) {
          newErrors[field.id] = 'Must be a valid number';
        }
      }
      if (field.type === 'email' && formData[field.id]) {
        const email = String(formData[field.id]);
        if (!email.includes('@')) {
          newErrors[field.id] = 'Must be a valid email';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const record: Partial<TableRecord> = {
      id: `rec-${Date.now()}`,
      fields: formData as Record<string, unknown>,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      version: 1,
    };
    onSubmit(record);
    setSubmitted(true);
    toast.success('Form submitted successfully!');
  };

  const handleReset = () => {
    setFormData({});
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Thank you!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your response has been recorded successfully.
          </p>
          <Button onClick={handleReset} variant="outline">
            Submit another response
          </Button>
        </div>
      </div>
    );
  }

  const renderFieldInput = (field: Field) => {
    const value = formData[field.id];
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        if (field.name.toLowerCase().includes('description') || field.name.toLowerCase().includes('notes') || field.name.toLowerCase().includes('comment')) {
          return (
            <Textarea
              value={String(value || '')}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}...`}
              className={`min-h-[100px] ${error ? 'border-red-400' : ''}`}
            />
          );
        }
        return (
          <Input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'phone' ? 'tel' : 'text'}
            value={String(value || '')}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
            className={error ? 'border-red-400' : ''}
          />
        );

      case 'number':
      case 'currency':
      case 'percent':
        return (
          <Input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : '')}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
            className={error ? 'border-red-400' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={String(value || '')}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={error ? 'border-red-400' : ''}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 ${
              error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select an option</option>
            {field.options?.choices?.map((choice) => (
              <option key={choice.id} value={choice.id}>{choice.name}</option>
            ))}
          </select>
        );

      case 'multiselect': {
        const selected = Array.isArray(value) ? value as string[] : [];
        return (
          <div className="space-y-2">
            {field.options?.choices?.map((choice) => (
              <label key={choice.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(choice.id)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...selected, choice.id]
                      : selected.filter((id) => id !== choice.id);
                    handleFieldChange(field.id, newValue);
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${choice.color === '#gray' ? '#9CA3AF' : choice.color}15`,
                    color: choice.color === '#gray' ? '#4B5563' : choice.color,
                  }}
                >
                  {choice.name}
                </span>
              </label>
            ))}
          </div>
        );
      }

      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleFieldChange(field.id, star)}
                className={`w-8 h-8 rounded transition-colors ${
                  Number(value) >= star
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        );

      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
            className={error ? 'border-red-400' : ''}
          />
        );
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-start justify-center overflow-auto py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Form header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-medium opacity-80">FORM VIEW</span>
          </div>
          <h1 className="text-2xl font-bold">{tableName}</h1>
          {formDescription && (
            <p className="text-white/80 text-sm mt-2">{formDescription}</p>
          )}
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-b-xl shadow-lg border border-gray-200 dark:border-gray-700 border-t-0">
          <ScrollArea className="max-h-[calc(100vh-300px)]">
            <div className="p-6 space-y-6">
              {visibleFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
                  )}
                  {renderFieldInput(field)}
                  {errors[field.id] && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {errors[field.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={handleReset}>
              Clear form
            </Button>
            <Button type="submit" className="px-8">
              <Send className="w-4 h-4 mr-2" />
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
