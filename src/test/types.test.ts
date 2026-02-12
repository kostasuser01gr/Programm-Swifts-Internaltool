import { describe, it, expect } from 'vitest';
import { mockWorkspace, mockBase, mockTable, mockFields, mockRecords, mockViews, mockAutomations, mockNotifications, mockComments } from '../app/data/mockData';

describe('Mock Data Integrity', () => {
  it('workspace has required properties', () => {
    expect(mockWorkspace.id).toBe('ws-1');
    expect(mockWorkspace.name).toBe('Acme Corporation');
    expect(mockWorkspace.members).toHaveLength(3);
    expect(mockWorkspace.bases).toHaveLength(1);
  });

  it('base contains tables', () => {
    expect(mockBase.id).toBe('base-1');
    expect(mockBase.tables).toHaveLength(1);
    expect(mockBase.tables[0].id).toBe('table-1');
  });

  it('table has fields, records, and views', () => {
    expect(mockTable.fields.length).toBeGreaterThan(0);
    expect(mockTable.records.length).toBeGreaterThan(0);
    expect(mockTable.views.length).toBeGreaterThan(0);
    expect(mockTable.primaryFieldId).toBe('fld-1');
  });

  it('fields have valid types', () => {
    const validTypes = ['text', 'number', 'select', 'multiselect', 'date', 'checkbox', 'user', 'attachment', 'formula', 'lookup', 'rollup', 'link', 'email', 'phone', 'url', 'rating', 'currency', 'percent', 'duration', 'autonumber', 'barcode', 'richtext'];
    mockFields.forEach((field) => {
      expect(validTypes).toContain(field.type);
    });
  });

  it('records reference valid field ids', () => {
    const fieldIds = new Set(mockFields.map((f) => f.id));
    mockRecords.forEach((record) => {
      Object.keys(record.fields).forEach((fieldId) => {
        expect(fieldIds.has(fieldId)).toBe(true);
      });
    });
  });

  it('views reference valid table id', () => {
    mockViews.forEach((view) => {
      expect(view.tableId).toBe('table-1');
    });
  });

  it('member roles are valid', () => {
    const validRoles = ['owner', 'admin', 'editor', 'commenter', 'viewer'];
    mockWorkspace.members.forEach((member) => {
      expect(validRoles).toContain(member.role);
    });
  });

  it('member statuses are valid', () => {
    const validStatuses = ['online', 'away', 'offline'];
    mockWorkspace.members.forEach((member) => {
      if (member.status) {
        expect(validStatuses).toContain(member.status);
      }
    });
  });

  it('automations have valid trigger and action types', () => {
    const validTriggers = ['recordCreated', 'recordUpdated', 'fieldChanged', 'viewEntered', 'scheduled', 'webhook'];
    const validActions = ['updateRecord', 'createRecord', 'sendEmail', 'sendNotification', 'runScript', 'webhook', 'duplicateRecord', 'deleteRecord'];
    mockAutomations.forEach((auto: any) => {
      expect(validTriggers).toContain(auto.trigger.type);
      auto.actions.forEach((action: any) => {
        expect(validActions).toContain(action.type);
      });
    });
  });

  it('notifications have required userId field', () => {
    mockNotifications.forEach((notif: any) => {
      expect(notif.userId).toBeTruthy();
    });
  });

  it('comments have required recordId and content fields', () => {
    mockComments.forEach((comment: any) => {
      expect(comment.recordId).toBeTruthy();
      expect(comment.content).toBeTruthy();
      expect(comment.timestamp).toBeTruthy();
    });
  });

  it('records have version tracking', () => {
    mockRecords.forEach((record) => {
      expect(record.version).toBeGreaterThanOrEqual(1);
      expect(record.createdTime).toBeTruthy();
      expect(record.modifiedTime).toBeTruthy();
      expect(record.createdBy).toBeTruthy();
      expect(record.modifiedBy).toBeTruthy();
    });
  });
});
