// ─── Inspector Panel ────────────────────────────────────────
// Right-side drawer for record details, activity, comments.
// Opens on record selection in Grid/Kanban. Tabs-based layout.

import React, { useState } from 'react';
import { X, Clock, MessageSquare, FileText, Zap, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import type { Record as TableRecord, Field, FieldValue } from '../../types';

interface InspectorPanelProps {
  record: TableRecord | null;
  fields: Field[];
  onClose: () => void;
  onFieldChange?: (recordId: string, fieldId: string, value: FieldValue) => void;
}

export function InspectorPanel({ record, fields, onClose, onFieldChange }: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!record) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <h3 className="text-sm font-semibold truncate">
            {record.fields[fields[0]?.id]?.toString() || `Record ${record.id.slice(0, 8)}`}
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-10">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Activity
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Comments
          </TabsTrigger>
          <TabsTrigger value="automations" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Auto
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-4 space-y-4 mt-0">
            {/* Field values */}
            {fields.map((field) => {
              const value = record.fields[field.id];
              return (
                <div key={field.id} className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {field.name}
                  </label>
                  <FieldDisplay
                    field={field}
                    value={value}
                    onChange={onFieldChange ? (v) => onFieldChange(record.id, field.id, v) : undefined}
                  />
                </div>
              );
            })}

            <Separator />

            {/* Meta */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{new Date(record.createdTime).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{new Date(record.modifiedTime).toLocaleDateString()}</span>
              </div>
              {record.createdBy && (
                <div className="flex justify-between">
                  <span>Created by</span>
                  <span className="text-foreground">{record.createdBy}</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-4 mt-0">
            <ActivityTimeline record={record} />
          </TabsContent>

          <TabsContent value="comments" className="p-4 mt-0">
            <CommentsStub />
          </TabsContent>

          <TabsContent value="automations" className="p-4 mt-0">
            <AutomationsStub />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// ── Field Display ─────────────────────────────────────────

function FieldDisplay({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: FieldValue;
  onChange?: (value: FieldValue) => void;
}) {
  const displayValue = value ?? '';

  switch (field.type) {
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
            readOnly={!onChange}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm">{value ? 'Yes' : 'No'}</span>
        </div>
      );

    case 'select':
      if (field.options?.choices) {
        const choice = field.options.choices.find(c => c.id === value);
        return choice ? (
          <Badge variant="secondary" className="text-xs">
            {choice.name}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      }
      return <span className="text-sm">{String(displayValue)}</span>;

    case 'multiselect':
      if (Array.isArray(value) && field.options?.choices) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map(v => {
              const choice = field.options?.choices?.find(c => c.id === v);
              return choice ? (
                <Badge key={v} variant="secondary" className="text-xs">
                  {choice.name}
                </Badge>
              ) : null;
            })}
          </div>
        );
      }
      return <span className="text-sm text-muted-foreground">—</span>;

    case 'number':
      return (
        <span className="text-sm font-mono tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : '—'}
        </span>
      );

    case 'date':
      return (
        <span className="text-sm">
          {value ? new Date(String(value)).toLocaleDateString() : '—'}
        </span>
      );

    default:
      return (
        <p className="text-sm text-foreground leading-relaxed break-words">
          {String(displayValue) || '—'}
        </p>
      );
  }
}

// ── Activity Timeline ────────────────────────────────────

function ActivityTimeline({ record }: { record: TableRecord }) {
  const activities = [
    { action: 'Record created', time: record.createdTime, user: record.createdBy || 'System' },
    { action: 'Record updated', time: record.modifiedTime, user: record.modifiedBy || 'System' },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recent Activity
      </h4>
      <div className="space-y-3">
        {activities.map((activity, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              {i < activities.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-3">
              <p className="text-xs font-medium">{activity.action}</p>
              <p className="text-[11px] text-muted-foreground">
                {activity.user} · {new Date(activity.time).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stubs ─────────────────────────────────────────────────

function CommentsStub() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">No comments yet</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Comments will appear here when team members discuss this record.
      </p>
    </div>
  );
}

function AutomationsStub() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Zap className="w-8 h-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">No automations</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Automations that affect this record will be listed here.
      </p>
    </div>
  );
}

export default InspectorPanel;
