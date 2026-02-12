// Core data types for the enterprise platform

export type FieldValue = string | number | boolean | string[] | null | undefined;

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'checkbox'
  | 'user'
  | 'attachment'
  | 'formula'
  | 'lookup'
  | 'rollup'
  | 'link'
  | 'email'
  | 'phone'
  | 'url'
  | 'rating'
  | 'currency'
  | 'percent'
  | 'duration'
  | 'autonumber'
  | 'barcode'
  | 'richtext';

export type ViewType = 'grid' | 'kanban' | 'calendar' | 'gallery' | 'timeline' | 'form';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  options?: {
    choices?: { id: string; name: string; color: string }[];
    formula?: string;
    linkedTableId?: string;
    lookupFieldId?: string;
    rollupFunction?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    format?: string;
    precision?: number;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    currencySymbol?: string;
    defaultValue?: FieldValue;
  };
  required?: boolean;
  description?: string;
  isPrimary?: boolean;
  width?: number;
  frozen?: boolean;
}

export interface Record {
  id: string;
  fields: { [fieldId: string]: FieldValue };
  createdTime: string;
  createdBy: string;
  modifiedTime: string;
  modifiedBy: string;
  version: number;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  recordId: string;
  userId: string;
  content: string;
  timestamp: string;
  edited?: boolean;
  reactions?: { emoji: string; userIds: string[] }[];
  mentions?: string[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Filter {
  id: string;
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan' | 'is' | 'isNot' | 'between' | 'isWithin';
  value: FieldValue;
  conjunction?: 'and' | 'or';
}

export interface Sort {
  fieldId: string;
  direction: 'asc' | 'desc';
}

export interface Group {
  fieldId: string;
  order: 'asc' | 'desc';
}

export interface View {
  id: string;
  name: string;
  type: ViewType;
  tableId: string;
  filters: Filter[];
  sorts: Sort[];
  groups?: Group[];
  hiddenFields: string[];
  fieldOrder: string[];
  config?: {
    groupByFieldId?: string;
    dateFieldId?: string;
    coverFieldId?: string;
    titleFieldId?: string;
    startDateFieldId?: string;
    endDateFieldId?: string;
    rowHeight?: 'short' | 'medium' | 'tall' | 'extra-tall';
    cardSize?: 'small' | 'medium' | 'large';
    formDescription?: string;
    formFields?: string[];
    formSubmitLabel?: string;
    colorFieldId?: string;
  };
  personalView?: boolean;
  lockedView?: boolean;
  description?: string;
}

export interface Table {
  id: string;
  name: string;
  baseId: string;
  fields: Field[];
  records: Record[];
  views: View[];
  description?: string;
  primaryFieldId: string;
  icon?: string;
  color?: string;
  automations?: Automation[];
}

export interface TriggerConfig {
  fieldId?: string;
  schedule?: string;
}

export interface ActionConfig {
  fieldId?: string;
  value?: FieldValue;
  recipients?: string[];
  message?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: { [key: string]: string };
  body?: string;
}

export interface Automation {
  id: string;
  name: string;
  tableId: string;
  enabled: boolean;
  trigger: {
    type: 'recordCreated' | 'recordUpdated' | 'fieldChanged' | 'viewEntered' | 'scheduled' | 'webhook';
    config?: TriggerConfig;
  };
  conditions?: Filter[];
  actions: {
    type: 'updateRecord' | 'createRecord' | 'sendEmail' | 'sendNotification' | 'runScript' | 'webhook' | 'duplicateRecord' | 'deleteRecord';
    config: ActionConfig;
  }[];
  lastRunAt?: string;
  runCount?: number;
  description?: string;
}

export interface Base {
  id: string;
  name: string;
  workspaceId: string;
  tables: Table[];
  icon?: string;
  color?: string;
  description?: string;
}

export interface Workspace {
  id: string;
  name: string;
  bases: Base[];
  members: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer';
  avatar?: string;
  status?: 'online' | 'away' | 'offline';
  lastActive?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entityType: 'record' | 'field' | 'table' | 'view' | 'automation';
  entityId: string;
  changes?: { [field: string]: { old: FieldValue; new: FieldValue } };
  metadata?: { [key: string]: string };
}

export interface AIPrompt {
  id: string;
  userId: string;
  prompt: string;
  response: string;
  timestamp: string;
  context?: {
    tableId?: string;
    viewId?: string;
    recordIds?: string[];
  };
}

export interface Permission {
  id: string;
  entityType: 'table' | 'view' | 'record' | 'field';
  entityId: string;
  userId?: string;
  roleId?: string;
  access: 'read' | 'write' | 'admin' | 'none';
  conditions?: Filter[];
}

// Notification system
export interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'comment' | 'automation' | 'share' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId: string;
  link?: string;
  entityType?: 'record' | 'table' | 'view' | 'base';
  entityId?: string;
  actionLabel?: string;
}

// Import/Export
export interface ImportConfig {
  format: 'csv' | 'json' | 'xlsx';
  mappings: { sourceColumn: string; targetFieldId: string }[];
  skipFirstRow: boolean;
  duplicateHandling: 'skip' | 'overwrite' | 'create';
}

export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx';
  fields: string[];
  filters?: Filter[];
  includeMetadata: boolean;
}

// Dashboard / Analytics
export interface DashboardWidget {
  id: string;
  type: 'count' | 'sum' | 'chart' | 'table' | 'progress' | 'text' | 'list';
  title: string;
  config: {
    fieldId?: string;
    chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter';
    groupByFieldId?: string;
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
    filters?: Filter[];
    colorScheme?: string;
    showLegend?: boolean;
    content?: string;
    limit?: number;
  };
  position: { x: number; y: number; w: number; h: number };
}

export interface Dashboard {
  id: string;
  name: string;
  tableId: string;
  widgets: DashboardWidget[];
  description?: string;
  isDefault?: boolean;
}

// Undo/Redo action tracking
export interface UndoAction {
  id: string;
  type: 'cellChange' | 'recordCreate' | 'recordDelete' | 'filterChange' | 'sortChange' | 'viewChange' | 'bulkEdit';
  timestamp: number;
  description: string;
  undo: () => void;
  redo: () => void;
}
