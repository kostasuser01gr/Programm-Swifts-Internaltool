import { useState } from 'react';
import { Zap, Plus, Trash2, ChevronRight, Play, Pause, Check, Clock, AlertTriangle, Hash, Mail, ArrowRight, X } from 'lucide-react';
import { Automation } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';

interface AutomationBuilderProps {
  automations: Automation[];
  onSave: (automation: Automation) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const TRIGGER_TEMPLATES = [
  { type: 'record_created' as const, label: 'When a record is created', icon: <Plus className="w-4 h-4" />, description: 'Triggers when a new record is added to the table' },
  { type: 'record_updated' as const, label: 'When a record is updated', icon: <Check className="w-4 h-4" />, description: 'Triggers when any field in a record changes' },
  { type: 'time_based' as const, label: 'At a scheduled time', icon: <Clock className="w-4 h-4" />, description: 'Triggers on a recurring schedule' },
  { type: 'condition_met' as const, label: 'When conditions are met', icon: <AlertTriangle className="w-4 h-4" />, description: 'Triggers when field values match conditions' },
];

const ACTION_TEMPLATES = [
  { type: 'send_email' as const, label: 'Send an email', icon: <Mail className="w-4 h-4" />, description: 'Send an email notification' },
  { type: 'update_record' as const, label: 'Update record', icon: <Check className="w-4 h-4" />, description: 'Update fields in the triggering record' },
  { type: 'create_record' as const, label: 'Create a new record', icon: <Plus className="w-4 h-4" />, description: 'Create a record in the same or different table' },
  { type: 'run_script' as const, label: 'Run a script', icon: <Hash className="w-4 h-4" />, description: 'Execute custom JavaScript' },
];

export function AutomationBuilder({ automations, onSave, onToggle, onDelete, onClose }: AutomationBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<number | null>(null);
  const [selectedActions, setSelectedActions] = useState<number[]>([]);

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error('Automation name is required');
      return;
    }
    if (selectedTrigger === null) {
      toast.error('Please select a trigger');
      return;
    }
    if (selectedActions.length === 0) {
      toast.error('Please select at least one action');
      return;
    }

    const trigger = TRIGGER_TEMPLATES[selectedTrigger];
    const actions = selectedActions.map((i) => ACTION_TEMPLATES[i]);

    const automation: Automation = {
      id: `auto-${Date.now()}`,
      name: newName,
      trigger: { type: trigger.type, config: {} },
      actions: actions.map((a) => ({ type: a.type, config: {} })),
      enabled: true,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      runCount: 0,
    };

    onSave(automation);
    setCreating(false);
    setNewName('');
    setSelectedTrigger(null);
    setSelectedActions([]);
    toast.success('Automation created successfully');
  };

  return (
    <div className="w-[420px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Automations</h3>
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full px-2 py-0.5">
            {automations.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!creating && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCreating(true)}>
              <Plus className="w-3 h-3 mr-1" />
              New
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* New automation builder */}
        {creating && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4 bg-blue-50/50 dark:bg-blue-950/20">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Create Automation</h4>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Notify on high-priority tasks"
                className="h-8 text-sm"
              />
            </div>

            {/* Trigger selection */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">When this happens...</label>
              <div className="space-y-1">
                {TRIGGER_TEMPLATES.map((trigger, idx) => (
                  <button
                    key={idx}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      selectedTrigger === idx
                        ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={() => setSelectedTrigger(idx)}
                  >
                    <div className={`flex-shrink-0 ${selectedTrigger === idx ? 'text-blue-600' : 'text-gray-400'}`}>
                      {trigger.icon}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{trigger.label}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{trigger.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions selection */}
            {selectedTrigger !== null && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Then do this...</label>
                </div>
                <div className="space-y-1">
                  {ACTION_TEMPLATES.map((action, idx) => {
                    const isSelected = selectedActions.includes(idx);
                    return (
                      <button
                        key={idx}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => {
                          setSelectedActions((prev) =>
                            isSelected ? prev.filter((i) => i !== idx) : [...prev, idx]
                          );
                        }}
                      >
                        <div className={`flex-shrink-0 ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                          {action.icon}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{action.label}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{action.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Create / Cancel buttons */}
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1" onClick={handleCreate}>
                <Zap className="w-3.5 h-3.5 mr-1" />
                Create Automation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreating(false);
                  setNewName('');
                  setSelectedTrigger(null);
                  setSelectedActions([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing automations list */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {automations.map((automation) => (
            <div key={automation.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 flex-shrink-0 ${automation.enabled ? 'text-orange-500' : 'text-gray-300'}`} />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {automation.name}
                    </h4>
                  </div>
                  {automation.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{automation.description}</p>
                  )}

                  {/* Trigger & actions summary */}
                  <div className="mt-2 ml-6 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-medium">
                        Trigger
                      </span>
                      {automation.trigger.type.replace(/_/g, ' ')}
                    </div>
                    {automation.actions.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-medium">
                          Action
                        </span>
                        {action.type.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>

                  {/* Run stats */}
                  <div className="flex items-center gap-3 mt-2 ml-6 text-[10px] text-gray-400">
                    {automation.runCount !== undefined && (
                      <span>{automation.runCount} runs</span>
                    )}
                    {automation.lastRunAt && (
                      <span>Last run: {new Date(automation.lastRunAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onToggle(automation.id)}
                    title={automation.enabled ? 'Disable' : 'Enable'}
                  >
                    {automation.enabled ? (
                      <Pause className="w-3.5 h-3.5 text-orange-500" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-500"
                    onClick={() => {
                      onDelete(automation.id);
                      toast.success('Automation deleted');
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {automations.length === 0 && !creating && (
            <div className="p-8 text-center">
              <Zap className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No automations yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreating(true)}>
                <Plus className="w-3 h-3 mr-1" />
                Create your first automation
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
