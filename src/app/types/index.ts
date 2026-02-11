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
  | 'currency';

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
  };
  required?: boolean;
  description?: string;
  isPrimary?: boolean;
}

export interface Record {
  id: string;
  fields: { [fieldId: string]: FieldValue };
  createdTime: string;
  createdBy: string;
  modifiedTime: string;
  modifiedBy: string;
  version: number;
}

export interface Filter {
  id: string;
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan' | 'is' | 'isNot';
  value: FieldValue;
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
    groupByFieldId?: string; // For kanban
    dateFieldId?: string; // For calendar
    coverFieldId?: string; // For gallery
  };
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
}

export interface Automation {
  id: string;
  name: string;
  tableId: string;
  enabled: boolean;
  trigger: {
    type: 'recordCreated' | 'recordUpdated' | 'fieldChanged' | 'viewEntered' | 'scheduled';
    config?: TriggerConfig;
  };
  conditions?: Filter[];
  actions: {
    type: 'updateRecord' | 'createRecord' | 'sendEmail' | 'sendNotification' | 'runScript' | 'webhook';
    config: ActionConfig;
  }[];
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
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entityType: 'record' | 'field' | 'table' | 'view' | 'automation';
  entityId: string;
  changes?: Record<string, { old: FieldValue; new: FieldValue }>;
  metadata?: Record<string, string>;
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
