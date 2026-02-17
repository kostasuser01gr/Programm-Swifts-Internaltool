// ─── Enterprise Data Hook ────────────────────────────────────
// Bridges mock data and real API data for the main App view.
// When VITE_API_URL is configured and API is reachable, fetches from Worker.
// Otherwise, falls back to mock data for demo mode.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDataMode } from '../store/dataMode';
import { workspaceApi, tableApi, type ApiWorkspace, type ApiRecord, type ApiBase } from '../api/client';
import { mockWorkspace, mockBase, mockTable, mockAutomations, mockNotifications } from '../data/mockData';
import type { Table, Base, Automation, Notification, Record as TableRecord, FieldValue } from '../types';
import { toast } from 'sonner';

interface EnterpriseData {
  workspace: typeof mockWorkspace;
  currentBase: Base | null;
  currentTable: Table | null;
  tableData: Table;
  automations: Automation[];
  notifications: Notification[];
  isLoading: boolean;
  isApiMode: boolean;

  // Setters
  setCurrentBase: (base: Base) => void;
  setCurrentTable: (table: Table) => void;
  setTableData: React.Dispatch<React.SetStateAction<Table>>;
  setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;

  // API operations
  createRecord: (fields: Record<string, FieldValue>) => Promise<void>;
  updateRecord: (recordId: string, fieldId: string, value: FieldValue) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  bulkDeleteRecords: (ids: string[]) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useEnterpriseData(): EnterpriseData {
  const dataMode = useDataMode();
  const isApiMode = dataMode.mode === 'api';

  // State initialized from mock data
  const [workspace] = useState(mockWorkspace);
  const [currentBase, setCurrentBase] = useState<Base | null>(mockBase);
  const [currentTable, setCurrentTable] = useState<Table | null>(mockTable);
  const [tableData, setTableData] = useState<Table>(mockTable);
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [apiWorkspaces, setApiWorkspaces] = useState<ApiWorkspace[]>([]);

  // Fetch data from API when in API mode
  useEffect(() => {
    if (!isApiMode) return;

    let cancelled = false;

    async function loadFromApi() {
      setIsLoading(true);
      try {
        // Fetch workspaces
        const wsRes = await workspaceApi.list();
        if (cancelled) return;

        if (wsRes.ok && wsRes.data && wsRes.data.length > 0) {
          setApiWorkspaces(wsRes.data);

          // Get first workspace with bases
          const wsDetail = await workspaceApi.get(wsRes.data[0].id);
          if (cancelled) return;

          if (wsDetail.ok && wsDetail.data && wsDetail.data.bases && wsDetail.data.bases.length > 0) {
            const firstBase = wsDetail.data.bases[0];

            // The API may or may not nest tables inside the base response.
            // Cast to access optional nested tables if Worker returns them.
            const baseTables = (firstBase as ApiBase & { tables?: Array<{ id: string; name: string }> }).tables;

            // Map API base → UI Base shape
            const uiBase: Base = {
              ...mockBase,
              id: firstBase.id,
              name: firstBase.name,
              tables: baseTables
                ? baseTables.map(t => ({
                    ...mockTable,
                    id: t.id,
                    name: t.name,
                    records: [],
                    fields: mockTable.fields,
                    views: mockTable.views,
                  }))
                : mockBase.tables,
            };
            setCurrentBase(uiBase);

            // If the base has tables, load the first table's records
            if (baseTables && baseTables.length > 0) {
              const firstTableId = baseTables[0].id;
              const recordsRes = await tableApi.getRecords(firstTableId);
              if (cancelled) return;

              const uiTable: Table = {
                ...mockTable,
                id: firstTableId,
                name: baseTables[0].name,
                records: recordsRes.ok && recordsRes.data
                  ? recordsRes.data.map((r: ApiRecord) => ({
                      id: r.id,
                      fields: (r.data as Record<string, FieldValue>) || {},
                      createdTime: r.created_at,
                      createdBy: r.created_by || '',
                      modifiedTime: r.updated_at,
                      modifiedBy: r.created_by || '',
                      version: 1,
                    }))
                  : [],
              };
              setCurrentTable(uiTable);
              setTableData(uiTable);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load data from API:', err);
        toast.error('Failed to connect to server. Showing demo data.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFromApi();
    return () => { cancelled = true; };
  }, [isApiMode]);

  // Create record via API or locally
  const createRecord = useCallback(async (fields: Record<string, FieldValue>) => {
    if (isApiMode && currentTable) {
      try {
        const res = await tableApi.createRecord(currentTable.id, fields);
        if (res.ok && res.data) {
          const newRecord: TableRecord = {
            id: res.data.id,
            fields: (res.data.data as Record<string, FieldValue>) || {},
            createdTime: res.data.created_at,
            createdBy: res.data.created_by || '',
            modifiedTime: res.data.updated_at,
            modifiedBy: res.data.created_by || '',
            version: 1,
          };
          setTableData(prev => ({ ...prev, records: [...prev.records, newRecord] }));
          toast.success('Record created');
          return;
        }
        toast.error('Failed to create record');
      } catch {
        toast.error('Network error — record not saved');
      }
    } else {
      // Mock mode — add locally
      const newRecord: TableRecord = {
        id: `rec-${Date.now()}`,
        fields,
        createdTime: new Date().toISOString(),
        createdBy: workspace.members[0]?.id || 'unknown',
        modifiedTime: new Date().toISOString(),
        modifiedBy: workspace.members[0]?.id || 'unknown',
        version: 1,
      };
      setTableData(prev => ({ ...prev, records: [...prev.records, newRecord] }));
      toast.success('Record created (demo mode)');
    }
  }, [isApiMode, currentTable, workspace]);

  // Update record via API or locally
  const updateRecord = useCallback(async (recordId: string, fieldId: string, value: FieldValue) => {
    // Always apply locally first (optimistic)
    setTableData(prev => ({
      ...prev,
      records: prev.records.map(r =>
        r.id === recordId
          ? { ...r, fields: { ...r.fields, [fieldId]: value }, modifiedTime: new Date().toISOString(), version: r.version + 1 }
          : r
      ),
    }));

    if (isApiMode && currentTable) {
      try {
        const record = tableData.records.find(r => r.id === recordId);
        await tableApi.updateRecord(currentTable.id, recordId, {
          ...record?.fields,
          [fieldId]: value,
        });
      } catch {
        toast.error('Failed to save — change stored locally');
      }
    }
  }, [isApiMode, currentTable, tableData]);

  // Delete record via API or locally
  const deleteRecord = useCallback(async (recordId: string) => {
    setTableData(prev => ({
      ...prev,
      records: prev.records.filter(r => r.id !== recordId),
    }));

    if (isApiMode && currentTable) {
      try {
        await tableApi.deleteRecord(currentTable.id, recordId);
      } catch {
        toast.error('Failed to delete on server');
      }
    }
  }, [isApiMode, currentTable]);

  // Bulk delete
  const bulkDeleteRecords = useCallback(async (ids: string[]) => {
    setTableData(prev => ({
      ...prev,
      records: prev.records.filter(r => !ids.includes(r.id)),
    }));

    if (isApiMode && currentTable) {
      try {
        await tableApi.bulkDeleteRecords(currentTable.id, ids);
      } catch {
        toast.error('Failed to delete records on server');
      }
    }
  }, [isApiMode, currentTable]);

  // Refetch from API
  const refetch = useCallback(async () => {
    if (!isApiMode || !currentTable) return;
    setIsLoading(true);
    try {
      const res = await tableApi.getRecords(currentTable.id);
      if (res.ok && res.data) {
        const records: TableRecord[] = res.data.map(r => ({
          id: r.id,
          fields: (r.data as Record<string, FieldValue>) || {},
          createdTime: r.created_at,
          createdBy: r.created_by || '',
          modifiedTime: r.updated_at,
          modifiedBy: r.created_by || '',
          version: 1,
        }));
        setTableData(prev => ({ ...prev, records }));
      }
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [isApiMode, currentTable]);

  return {
    workspace,
    currentBase,
    currentTable,
    tableData,
    automations,
    notifications,
    isLoading,
    isApiMode,
    setCurrentBase,
    setCurrentTable,
    setTableData,
    setAutomations,
    setNotifications,
    createRecord,
    updateRecord,
    deleteRecord,
    bulkDeleteRecords,
    refetch,
  };
}
