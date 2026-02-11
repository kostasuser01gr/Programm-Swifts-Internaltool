import { Workspace, Base, Table, Field, Record, View, Automation } from '../types';

// Mock data for demonstration
export const mockWorkspace: Workspace = {
  id: 'ws-1',
  name: 'Acme Corporation',
  bases: [],
  members: [
    {
      id: 'user-1',
      email: 'john@acme.com',
      name: 'John Smith',
      role: 'owner',
    },
    {
      id: 'user-2',
      email: 'sarah@acme.com',
      name: 'Sarah Johnson',
      role: 'admin',
    },
    {
      id: 'user-3',
      email: 'mike@acme.com',
      name: 'Mike Chen',
      role: 'editor',
    },
  ],
};

export const mockFields: Field[] = [
  {
    id: 'fld-1',
    name: 'Task Name',
    type: 'text',
    isPrimary: true,
    required: true,
  },
  {
    id: 'fld-2',
    name: 'Status',
    type: 'select',
    options: {
      choices: [
        { id: 'opt-1', name: 'To Do', color: '#gray' },
        { id: 'opt-2', name: 'In Progress', color: '#blue' },
        { id: 'opt-3', name: 'Review', color: '#yellow' },
        { id: 'opt-4', name: 'Done', color: '#green' },
        { id: 'opt-5', name: 'Blocked', color: '#red' },
      ],
    },
  },
  {
    id: 'fld-3',
    name: 'Assignee',
    type: 'user',
  },
  {
    id: 'fld-4',
    name: 'Priority',
    type: 'select',
    options: {
      choices: [
        { id: 'pri-1', name: 'Low', color: '#gray' },
        { id: 'pri-2', name: 'Medium', color: '#blue' },
        { id: 'pri-3', name: 'High', color: '#orange' },
        { id: 'pri-4', name: 'Urgent', color: '#red' },
      ],
    },
  },
  {
    id: 'fld-5',
    name: 'Due Date',
    type: 'date',
  },
  {
    id: 'fld-6',
    name: 'Effort (hours)',
    type: 'number',
  },
  {
    id: 'fld-7',
    name: 'Tags',
    type: 'multiselect',
    options: {
      choices: [
        { id: 'tag-1', name: 'Frontend', color: '#purple' },
        { id: 'tag-2', name: 'Backend', color: '#blue' },
        { id: 'tag-3', name: 'Design', color: '#pink' },
        { id: 'tag-4', name: 'Bug', color: '#red' },
        { id: 'tag-5', name: 'Feature', color: '#green' },
      ],
    },
  },
  {
    id: 'fld-8',
    name: 'Completed',
    type: 'checkbox',
  },
  {
    id: 'fld-9',
    name: 'Description',
    type: 'text',
  },
];

export const mockRecords: Record[] = [
  {
    id: 'rec-1',
    fields: {
      'fld-1': 'Implement user authentication',
      'fld-2': 'opt-2',
      'fld-3': 'user-1',
      'fld-4': 'pri-3',
      'fld-5': '2026-02-15',
      'fld-6': 8,
      'fld-7': ['tag-2', 'tag-5'],
      'fld-8': false,
      'fld-9': 'Set up JWT-based authentication system with refresh tokens',
    },
    createdTime: '2026-02-01T10:00:00Z',
    createdBy: 'user-1',
    modifiedTime: '2026-02-11T14:30:00Z',
    modifiedBy: 'user-1',
    version: 3,
  },
  {
    id: 'rec-2',
    fields: {
      'fld-1': 'Design new dashboard layout',
      'fld-2': 'opt-3',
      'fld-3': 'user-2',
      'fld-4': 'pri-2',
      'fld-5': '2026-02-13',
      'fld-6': 12,
      'fld-7': ['tag-3', 'tag-5'],
      'fld-8': false,
      'fld-9': 'Create mockups for the new analytics dashboard',
    },
    createdTime: '2026-02-02T09:00:00Z',
    createdBy: 'user-2',
    modifiedTime: '2026-02-10T16:45:00Z',
    modifiedBy: 'user-2',
    version: 5,
  },
  {
    id: 'rec-3',
    fields: {
      'fld-1': 'Fix mobile responsive issues',
      'fld-2': 'opt-4',
      'fld-3': 'user-3',
      'fld-4': 'pri-3',
      'fld-5': '2026-02-10',
      'fld-6': 4,
      'fld-7': ['tag-1', 'tag-4'],
      'fld-8': true,
      'fld-9': 'Address layout issues on mobile devices',
    },
    createdTime: '2026-02-03T11:00:00Z',
    createdBy: 'user-3',
    modifiedTime: '2026-02-09T10:20:00Z',
    modifiedBy: 'user-3',
    version: 2,
  },
  {
    id: 'rec-4',
    fields: {
      'fld-1': 'Optimize database queries',
      'fld-2': 'opt-1',
      'fld-3': 'user-1',
      'fld-4': 'pri-2',
      'fld-5': '2026-02-18',
      'fld-6': 6,
      'fld-7': ['tag-2'],
      'fld-8': false,
      'fld-9': 'Improve query performance for large datasets',
    },
    createdTime: '2026-02-04T14:00:00Z',
    createdBy: 'user-1',
    modifiedTime: '2026-02-11T09:15:00Z',
    modifiedBy: 'user-1',
    version: 1,
  },
  {
    id: 'rec-5',
    fields: {
      'fld-1': 'API documentation update',
      'fld-2': 'opt-5',
      'fld-3': 'user-2',
      'fld-4': 'pri-4',
      'fld-5': '2026-02-12',
      'fld-6': 3,
      'fld-7': ['tag-2'],
      'fld-8': false,
      'fld-9': 'Waiting for API finalization from backend team',
    },
    createdTime: '2026-02-05T10:30:00Z',
    createdBy: 'user-2',
    modifiedTime: '2026-02-11T11:00:00Z',
    modifiedBy: 'user-2',
    version: 4,
  },
  {
    id: 'rec-6',
    fields: {
      'fld-1': 'Set up CI/CD pipeline',
      'fld-2': 'opt-2',
      'fld-3': 'user-3',
      'fld-4': 'pri-3',
      'fld-5': '2026-02-16',
      'fld-6': 10,
      'fld-7': ['tag-2', 'tag-5'],
      'fld-8': false,
      'fld-9': 'Configure GitHub Actions for automated deployments',
    },
    createdTime: '2026-02-06T13:00:00Z',
    createdBy: 'user-3',
    modifiedTime: '2026-02-11T15:20:00Z',
    modifiedBy: 'user-3',
    version: 2,
  },
  {
    id: 'rec-7',
    fields: {
      'fld-1': 'Implement dark mode',
      'fld-2': 'opt-1',
      'fld-3': 'user-1',
      'fld-4': 'pri-1',
      'fld-5': '2026-02-20',
      'fld-6': 5,
      'fld-7': ['tag-1', 'tag-5'],
      'fld-8': false,
      'fld-9': 'Add dark mode theme toggle to the application',
    },
    createdTime: '2026-02-07T09:30:00Z',
    createdBy: 'user-1',
    modifiedTime: '2026-02-08T14:00:00Z',
    modifiedBy: 'user-1',
    version: 1,
  },
  {
    id: 'rec-8',
    fields: {
      'fld-1': 'User testing session',
      'fld-2': 'opt-3',
      'fld-3': 'user-2',
      'fld-4': 'pri-3',
      'fld-5': '2026-02-14',
      'fld-6': 4,
      'fld-7': ['tag-3'],
      'fld-8': false,
      'fld-9': 'Conduct user testing for new features',
    },
    createdTime: '2026-02-08T11:00:00Z',
    createdBy: 'user-2',
    modifiedTime: '2026-02-10T13:30:00Z',
    modifiedBy: 'user-2',
    version: 3,
  },
];

export const mockViews: View[] = [
  {
    id: 'view-1',
    name: 'All Tasks',
    type: 'grid',
    tableId: 'table-1',
    filters: [],
    sorts: [{ fieldId: 'fld-5', direction: 'asc' }],
    hiddenFields: [],
    fieldOrder: ['fld-1', 'fld-2', 'fld-3', 'fld-4', 'fld-5', 'fld-6', 'fld-7', 'fld-8'],
  },
  {
    id: 'view-2',
    name: 'Kanban Board',
    type: 'kanban',
    tableId: 'table-1',
    filters: [],
    sorts: [{ fieldId: 'fld-4', direction: 'desc' }],
    hiddenFields: ['fld-9'],
    fieldOrder: ['fld-1', 'fld-3', 'fld-4', 'fld-5', 'fld-6', 'fld-7'],
    config: {
      groupByFieldId: 'fld-2',
    },
  },
  {
    id: 'view-3',
    name: 'Calendar View',
    type: 'calendar',
    tableId: 'table-1',
    filters: [],
    sorts: [],
    hiddenFields: [],
    fieldOrder: ['fld-1', 'fld-2', 'fld-3', 'fld-4'],
    config: {
      dateFieldId: 'fld-5',
    },
  },
  {
    id: 'view-4',
    name: 'High Priority',
    type: 'grid',
    tableId: 'table-1',
    filters: [
      {
        id: 'filter-1',
        fieldId: 'fld-4',
        operator: 'is',
        value: 'pri-3',
      },
    ],
    sorts: [{ fieldId: 'fld-5', direction: 'asc' }],
    hiddenFields: [],
    fieldOrder: ['fld-1', 'fld-2', 'fld-3', 'fld-4', 'fld-5', 'fld-6'],
  },
];

export const mockAutomations: Automation[] = [
  {
    id: 'auto-1',
    name: 'Notify on high priority tasks',
    tableId: 'table-1',
    enabled: true,
    trigger: {
      type: 'recordCreated',
    },
    conditions: [
      {
        id: 'cond-1',
        fieldId: 'fld-4',
        operator: 'equals',
        value: 'pri-4',
      },
    ],
    actions: [
      {
        type: 'sendNotification',
        config: {
          recipients: ['user-1', 'user-2'],
          message: 'New urgent task created: {Task Name}',
        },
      },
    ],
  },
  {
    id: 'auto-2',
    name: 'Auto-complete when checked',
    tableId: 'table-1',
    enabled: true,
    trigger: {
      type: 'fieldChanged',
      config: { fieldId: 'fld-8' },
    },
    conditions: [
      {
        id: 'cond-2',
        fieldId: 'fld-8',
        operator: 'equals',
        value: true,
      },
    ],
    actions: [
      {
        type: 'updateRecord',
        config: {
          fieldId: 'fld-2',
          value: 'opt-4',
        },
      },
    ],
  },
];

export const mockTable: Table = {
  id: 'table-1',
  name: 'Product Development',
  baseId: 'base-1',
  fields: mockFields,
  records: mockRecords,
  views: mockViews,
  primaryFieldId: 'fld-1',
  icon: '🚀',
  color: '#blue',
  description: 'Track all product development tasks and features',
};

export const mockBase: Base = {
  id: 'base-1',
  name: 'Product Management',
  workspaceId: 'ws-1',
  tables: [mockTable],
  icon: '📊',
  color: '#purple',
  description: 'Central hub for product planning and execution',
};

mockWorkspace.bases = [mockBase];
