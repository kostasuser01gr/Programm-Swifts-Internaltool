import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Search as SearchIcon, Undo2, Redo2, Bell, Settings2 } from 'lucide-react';
import { Sidebar } from './components/enterprise/Sidebar';
import { ViewToolbar } from './components/enterprise/ViewToolbar';
import { ErrorBoundary } from './components/enterprise/ErrorBoundary';
import { useEnterpriseData } from './hooks/useEnterpriseData';
import { Base, Table, View, Record as TableRecord, Filter, Sort, Group, Automation, Notification, FieldValue } from './types';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSearch } from './hooks/useSearch';
import { toast } from 'sonner';
import { SkeletonTable } from './design-system';

// ─── Lazy-loaded views (reduce main chunk by ~150KB) ─────────
const GridView = lazy(() => import('./components/enterprise/GridView').then(m => ({ default: m.GridView })));
const KanbanView = lazy(() => import('./components/enterprise/KanbanView').then(m => ({ default: m.KanbanView })));
const CalendarView = lazy(() => import('./components/enterprise/CalendarView').then(m => ({ default: m.CalendarView })));
const GalleryView = lazy(() => import('./components/enterprise/GalleryView').then(m => ({ default: m.GalleryView })));
const TimelineView = lazy(() => import('./components/enterprise/TimelineView').then(m => ({ default: m.TimelineView })));
const FormView = lazy(() => import('./components/enterprise/FormView').then(m => ({ default: m.FormView })));
const AnalyticsDashboard = lazy(() => import('./components/enterprise/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const AIAssistant = lazy(() => import('./components/enterprise/AIAssistant').then(m => ({ default: m.AIAssistant })));
const RecordDetail = lazy(() => import('./components/enterprise/RecordDetail').then(m => ({ default: m.RecordDetail })));
const FilterPanel = lazy(() => import('./components/enterprise/FilterPanel').then(m => ({ default: m.FilterPanel })));
const SortPanel = lazy(() => import('./components/enterprise/SortPanel').then(m => ({ default: m.SortPanel })));
const GroupPanel = lazy(() => import('./components/enterprise/GroupPanel').then(m => ({ default: m.GroupPanel })));
const SearchCommand = lazy(() => import('./components/enterprise/SearchCommand').then(m => ({ default: m.SearchCommand })));
const NotificationCenter = lazy(() => import('./components/enterprise/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const BulkActions = lazy(() => import('./components/enterprise/BulkActions').then(m => ({ default: m.BulkActions })));
const ImportExportPanel = lazy(() => import('./components/enterprise/ImportExportPanel').then(m => ({ default: m.ImportExportPanel })));
const AutomationBuilder = lazy(() => import('./components/enterprise/AutomationBuilder').then(m => ({ default: m.AutomationBuilder })));
const FieldEditor = lazy(() => import('./components/enterprise/FieldEditor').then(m => ({ default: m.FieldEditor })));

// Inline loading fallback for lazy views
const ViewLoading = () => (
  <div className="flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
    <SkeletonTable rows={8} cols={5} />
  </div>
);

export default function App() {
  const navigate = useNavigate();
  const {
    workspace, currentBase, currentTable, tableData, automations, notifications,
    isLoading, isApiMode,
    setCurrentBase, setCurrentTable, setTableData, setAutomations, setNotifications,
    createRecord: apiCreateRecord, updateRecord: apiUpdateRecord, deleteRecord: apiDeleteRecord,
    bulkDeleteRecords: apiBulkDelete,
  } = useEnterpriseData();

  const [currentView, setCurrentView] = useState<View>(tableData.views[0]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TableRecord | null>(null);

  // Panel visibility
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [showSearchCommand, setShowSearchCommand] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showAutomations, setShowAutomations] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Bulk selection
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Undo/Redo
  const { pushAction, undo, redo, canUndo, canRedo } = useUndoRedo();

  // Search
  const { results: searchResults, search: performSearch } = useSearch(tableData.records, tableData.fields);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'mod+k': () => setShowSearchCommand(true),
    'mod+z': () => { if (canUndo) { undo(); toast.info('Undo'); } },
    'mod+shift+z': () => { if (canRedo) { redo(); toast.info('Redo'); } },
    'escape': () => {
      setShowSearchCommand(false);
      setSelectedRecords([]);
    },
  });

  // Notification handlers
  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleDismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Automation handlers
  const handleSaveAutomation = useCallback((automation: Automation) => {
    setAutomations((prev) => {
      const existing = prev.findIndex((a) => a.id === automation.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = automation;
        return next;
      }
      return [...prev, automation];
    });
  }, []);

  const handleToggleAutomation = useCallback((id: string) => {
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }, []);

  const handleDeleteAutomation = useCallback((id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleBaseSelect = (base: Base) => {
    setCurrentBase(base);
    setCurrentTable(base.tables[0] || null);
    if (base.tables[0]) {
      setCurrentView(base.tables[0].views[0]);
      setTableData(base.tables[0]);
    }
  };

  const handleTableSelect = (table: Table) => {
    setCurrentTable(table);
    setCurrentView(table.views[0]);
    setTableData(table);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setShowFilterPanel(false);
    setShowSortPanel(false);
    setShowGroupPanel(false);
    setShowAnalytics(false);
  };

  const handleCellChange = (recordId: string, fieldId: string, value: FieldValue) => {
    const oldRecord = tableData.records.find((r) => r.id === recordId);
    const oldValue = oldRecord?.fields[fieldId];
    const applyChange = (newVal: FieldValue) => {
      setTableData((prev) => ({
        ...prev,
        records: prev.records.map((record) =>
          record.id === recordId
            ? {
                ...record,
                fields: { ...record.fields, [fieldId]: newVal },
                modifiedTime: new Date().toISOString(),
                version: record.version + 1,
              }
            : record
        ),
      }));
    };
    pushAction({
      type: 'cellChange',
      description: `Update field in record`,
      undo: () => applyChange(oldValue as FieldValue),
      redo: () => applyChange(value),
    });
    // Use API update (handles both mock and API modes)
    apiUpdateRecord(recordId, fieldId, value);
  };

  const handleRecordClick = (record: TableRecord) => {
    setSelectedRecord(record);
  };

  const handleRecordDetailClose = () => {
    setSelectedRecord(null);
  };

  const handleAddRecord = () => {
    const fields: Record<string, FieldValue> = {};
    tableData.fields.forEach((field) => {
      if (field.type === 'checkbox') fields[field.id] = false;
      else if (field.type === 'multiselect') fields[field.id] = [];
      else fields[field.id] = '';
    });

    // Use API create (handles both mock and API modes)
    apiCreateRecord(fields).then(() => {
      // Select the newly created record if it was added
      const latest = tableData.records[tableData.records.length - 1];
      if (latest) setSelectedRecord(latest);
    });
  };

  const handleRecordFieldChange = (fieldId: string, value: FieldValue) => {
    if (selectedRecord) {
      handleCellChange(selectedRecord.id, fieldId, value);
      setSelectedRecord((prev) =>
        prev ? { ...prev, fields: { ...prev.fields, [fieldId]: value } } : null
      );
    }
  };

  // Form submit handler
  const handleFormSubmit = useCallback((record: Partial<TableRecord>) => {
    const newRecord: TableRecord = {
      id: record.id || `rec-${Date.now()}`,
      fields: record.fields || {},
      createdTime: new Date().toISOString(),
      createdBy: workspace.members[0]?.id || 'unknown',
      modifiedTime: new Date().toISOString(),
      modifiedBy: workspace.members[0]?.id || 'unknown',
      version: 1,
    };
    setTableData((prev) => ({ ...prev, records: [...prev.records, newRecord] }));
  }, [workspace]);

  // Import handler
  const handleImport = useCallback((records: Partial<TableRecord>[]) => {
    const newRecords: TableRecord[] = records.map((r) => ({
      id: r.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      fields: r.fields || {},
      createdTime: new Date().toISOString(),
      createdBy: workspace.members[0]?.id || 'unknown',
      modifiedTime: new Date().toISOString(),
      modifiedBy: workspace.members[0]?.id || 'unknown',
      version: 1,
    }));
    setTableData((prev) => ({ ...prev, records: [...prev.records, ...newRecords] }));
  }, [workspace]);

  // Bulk action handlers
  const handleBulkDelete = useCallback((ids: string[]) => {
    apiBulkDelete(ids);
    setSelectedRecords([]);
  }, [apiBulkDelete]);

  const handleBulkUpdateField = useCallback((ids: string[], fieldId: string, value: FieldValue) => {
    setTableData((prev) => ({
      ...prev,
      records: prev.records.map((r) =>
        ids.includes(r.id) ? { ...r, fields: { ...r.fields, [fieldId]: value }, modifiedTime: new Date().toISOString() } : r
      ),
    }));
    setSelectedRecords([]);
  }, []);

  const handleBulkDuplicate = useCallback((ids: string[]) => {
    const newRecords = tableData.records
      .filter((r) => ids.includes(r.id))
      .map((r) => ({
        ...r,
        id: `rec-dup-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        version: 1,
      }));
    setTableData((prev) => ({ ...prev, records: [...prev.records, ...newRecords] }));
    toast.success(`Duplicated ${newRecords.length} records`);
    setSelectedRecords([]);
  }, [tableData.records]);

  const handleBulkExport = useCallback((ids: string[]) => {
    const selected = tableData.records.filter((r) => ids.includes(r.id));
    const data = selected.map((r) => {
      const obj: Record<string, unknown> = { id: r.id };
      tableData.fields.forEach((f) => { obj[f.name] = r.fields[f.id]; });
      return obj;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-records.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} records`);
  }, [tableData]);

  // Field editor save
  const handleFieldsSave = useCallback((fields: typeof tableData.fields) => {
    setTableData((prev) => ({ ...prev, fields }));
  }, []);

  // Filter/Sort/Group handlers
  const handleFiltersChange = (filters: Filter[]) => {
    setCurrentView((prev) => ({ ...prev, filters }));
  };

  const handleSortsChange = (sorts: Sort[]) => {
    setCurrentView((prev) => ({ ...prev, sorts }));
  };

  const handleGroupsChange = (groups: Group[]) => {
    setCurrentView((prev) => ({ ...prev, groups }));
  };

  // Apply filters to records
  const getFilteredRecords = () => {
    let filtered = tableData.records;

    for (const filter of currentView.filters) {
      filtered = filtered.filter((record) => {
        const value = record.fields[filter.fieldId];
        switch (filter.operator) {
          case 'equals':
          case 'is':
            return value === filter.value;
          case 'notEquals':
          case 'isNot':
            return value !== filter.value;
          case 'contains':
            return String(value || '').toLowerCase().includes(String(filter.value).toLowerCase());
          case 'notContains':
            return !String(value || '').toLowerCase().includes(String(filter.value).toLowerCase());
          case 'isEmpty':
            return !value || value === '' || (Array.isArray(value) && value.length === 0);
          case 'isNotEmpty':
            return value && value !== '' && !(Array.isArray(value) && value.length === 0);
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          default:
            return true;
        }
      });
    }

    if (currentView.sorts.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of currentView.sorts) {
          const aVal = a.fields[sort.fieldId];
          const bVal = b.fields[sort.fieldId];
          const cmp = String(aVal || '').localeCompare(String(bVal || ''), undefined, { numeric: true });
          if (cmp !== 0) return sort.direction === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }

    return filtered;
  };

  const filteredRecords = getFilteredRecords();

  // Search command actions
  const searchActions = useMemo(() => [
    { id: 'search', label: 'Search records...', description: 'Find records across all fields', icon: <SearchIcon className="w-4 h-4" />, category: 'General', shortcut: '⌘K', action: () => {} },
    { id: 'add-record', label: 'Add new record', description: 'Create a new record in the current table', icon: <SearchIcon className="w-4 h-4" />, category: 'Actions', action: handleAddRecord },
    { id: 'toggle-ai', label: 'Open AI Assistant', description: 'Get AI-powered help', icon: <SearchIcon className="w-4 h-4" />, category: 'Tools', action: () => setShowAIAssistant(true) },
    { id: 'show-analytics', label: 'Open Analytics Dashboard', description: 'View charts and stats', icon: <SearchIcon className="w-4 h-4" />, category: 'Tools', action: () => setShowAnalytics(true) },
    { id: 'show-automations', label: 'Manage Automations', description: 'Create and edit automations', icon: <SearchIcon className="w-4 h-4" />, category: 'Tools', action: () => setShowAutomations(true) },
    { id: 'import-export', label: 'Import / Export Data', description: 'CSV or JSON format', icon: <SearchIcon className="w-4 h-4" />, category: 'Actions', action: () => setShowImportExport(true) },
    { id: 'edit-fields', label: 'Edit Fields', description: 'Add, remove, or modify fields', icon: <Settings2 className="w-4 h-4" />, category: 'Settings', action: () => setShowFieldEditor(true) },
    ...currentTable!.views.map((v) => ({
      id: `view-${v.id}`, label: `Switch to ${v.name}`, description: `${v.type} view`, icon: <SearchIcon className="w-4 h-4" />, category: 'Views', action: () => handleViewChange(v),
    })),
  ], [currentTable, handleAddRecord]);

  if (!currentTable) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Data Workspace</h2>
          <p className="text-muted-foreground">Select a base to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Enterprise data sidebar (base/table/view navigation) */}
      <Sidebar
        workspace={workspace}
        currentBase={currentBase}
        currentTable={currentTable}
        onBaseSelect={handleBaseSelect}
        onTableSelect={handleTableSelect}
        onAIAssistantToggle={() => setShowAIAssistant(!showAIAssistant)}
        onNotificationsToggle={() => setShowNotifications(!showNotifications)}
        unreadNotifications={unreadCount}
        onAnalyticsToggle={() => setShowAnalytics(!showAnalytics)}
        onAutomationsToggle={() => setShowAutomations(!showAutomations)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ViewToolbar
          currentView={currentView}
          views={currentTable.views}
          onViewChange={handleViewChange}
          onViewCreate={(type) => toast.info(`Creating ${type} view...`)}
          onFilterClick={() => { setShowFilterPanel(!showFilterPanel); setShowSortPanel(false); setShowGroupPanel(false); }}
          onSortClick={() => { setShowSortPanel(!showSortPanel); setShowFilterPanel(false); setShowGroupPanel(false); }}
          onGroupClick={() => { setShowGroupPanel(!showGroupPanel); setShowFilterPanel(false); setShowSortPanel(false); }}
          onShareClick={() => toast.success('Share link copied to clipboard!')}
          filterCount={currentView.filters.length}
          sortCount={currentView.sorts.length}
          groupCount={currentView.groups?.length || 0}
          onSearchClick={() => setShowSearchCommand(true)}
          onUndoClick={canUndo ? () => { undo(); toast.info('Undo'); } : undefined}
          onRedoClick={canRedo ? () => { redo(); toast.info('Redo'); } : undefined}
          canUndo={canUndo}
          canRedo={canRedo}
          onImportExportClick={() => setShowImportExport(!showImportExport)}
          onFieldEditorClick={() => setShowFieldEditor(!showFieldEditor)}
        />

        {/* Filter/Sort/Group Panels */}
        <Suspense fallback={null}>
        {showFilterPanel && (
          <FilterPanel
            fields={tableData.fields}
            filters={currentView.filters}
            onFiltersChange={handleFiltersChange}
            onClose={() => setShowFilterPanel(false)}
          />
        )}
        {showSortPanel && (
          <SortPanel
            fields={tableData.fields}
            sorts={currentView.sorts}
            onSortsChange={handleSortsChange}
            onClose={() => setShowSortPanel(false)}
          />
        )}
        {showGroupPanel && (
          <GroupPanel
            fields={tableData.fields}
            groups={currentView.groups || []}
            onGroupsChange={handleGroupsChange}
            onClose={() => setShowGroupPanel(false)}
          />
        )}
        </Suspense>

        <ErrorBoundary fallbackTitle="View failed to render">
          <Suspense fallback={<ViewLoading />}>
          {/* Analytics dashboard */}
          {showAnalytics && (
            <AnalyticsDashboard
              fields={tableData.fields}
              records={tableData.records}
              tableName={currentTable.name}
              members={workspace.members}
            />
          )}

          {/* View rendering */}
          {!showAnalytics && currentView.type === 'grid' && (
            <GridView
              fields={tableData.fields}
              records={filteredRecords}
              onRecordClick={handleRecordClick}
              onCellChange={handleCellChange}
              onAddRecord={handleAddRecord}
              members={workspace.members}
            />
          )}

          {!showAnalytics && currentView.type === 'kanban' && currentView.config?.groupByFieldId && (
            <KanbanView
              fields={tableData.fields}
              records={filteredRecords}
              groupByFieldId={currentView.config.groupByFieldId}
              onRecordClick={handleRecordClick}
              onCellChange={handleCellChange}
              members={workspace.members}
            />
          )}

          {!showAnalytics && currentView.type === 'calendar' && currentView.config?.dateFieldId && (
            <CalendarView
              fields={tableData.fields}
              records={filteredRecords}
              dateFieldId={currentView.config.dateFieldId}
              onRecordClick={handleRecordClick}
              members={workspace.members}
            />
          )}

          {!showAnalytics && currentView.type === 'calendar' && !currentView.config?.dateFieldId && (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 m-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Calendar View</h3>
                <p className="text-gray-600 dark:text-gray-400">Select a date field to display calendar</p>
              </div>
            </div>
          )}

          {!showAnalytics && currentView.type === 'gallery' && (
            <GalleryView
              fields={tableData.fields}
              records={filteredRecords}
              onRecordClick={handleRecordClick}
              members={workspace.members}
              cardSize={(currentView.config?.cardSize as 'small' | 'medium' | 'large') || 'medium'}
            />
          )}

          {!showAnalytics && currentView.type === 'timeline' && (
            <TimelineView
              fields={tableData.fields}
              records={filteredRecords}
              dateFieldId={currentView.config?.startDateFieldId || currentView.config?.dateFieldId || ''}
              endDateFieldId={currentView.config?.endDateFieldId}
              onRecordClick={handleRecordClick}
              members={workspace.members}
            />
          )}

          {!showAnalytics && currentView.type === 'form' && (
            <FormView
              fields={tableData.fields}
              tableName={currentTable.name}
              onSubmit={handleFormSubmit}
              formDescription={currentView.config?.formDescription}
              submitLabel={currentView.config?.formSubmitLabel}
            />
          )}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Right-side panels */}
      <Suspense fallback={null}>
      {selectedRecord && !showNotifications && !showImportExport && !showAutomations && !showFieldEditor && (
        <ErrorBoundary fallbackTitle="Record detail failed to load">
          <RecordDetail
            record={selectedRecord}
            fields={tableData.fields}
            onClose={handleRecordDetailClose}
            onFieldChange={handleRecordFieldChange}
            members={workspace.members}
          />
        </ErrorBoundary>
      )}

      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDismiss={handleDismissNotification}
          onClearAll={handleClearAllNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showImportExport && (
        <ImportExportPanel
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          fields={tableData.fields}
          records={filteredRecords}
          tableName={currentTable.name}
          onImport={handleImport}
        />
      )}

      {showAutomations && (
        <AutomationBuilder
          automations={automations}
          onSave={handleSaveAutomation}
          onToggle={handleToggleAutomation}
          onDelete={handleDeleteAutomation}
          onClose={() => setShowAutomations(false)}
        />
      )}

      {showFieldEditor && (
        <FieldEditor
          fields={tableData.fields}
          onSave={handleFieldsSave}
          onClose={() => setShowFieldEditor(false)}
        />
      )}

      {showAIAssistant && (
        <ErrorBoundary fallbackTitle="AI Assistant encountered an error">
          <AIAssistant
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            tableName={currentTable.name}
          />
        </ErrorBoundary>
      )}
      </Suspense>

      {/* Global overlays */}
      <Suspense fallback={null}>
      <SearchCommand
        isOpen={showSearchCommand}
        onClose={() => setShowSearchCommand(false)}
        actions={searchActions}
        onSearch={performSearch}
        searchResults={searchResults.map((r) => ({ id: r.record.id, title: r.matches[0]?.snippet || r.record.id, subtitle: `Score: ${r.score}` }))}
        onResultClick={(id) => {
          const rec = tableData.records.find((r) => r.id === id);
          if (rec) setSelectedRecord(rec);
        }}
      />

      <BulkActions
        selectedRecords={selectedRecords}
        records={tableData.records}
        fields={tableData.fields}
        onDelete={handleBulkDelete}
        onUpdateField={handleBulkUpdateField}
        onExport={handleBulkExport}
        onDuplicate={handleBulkDuplicate}
        onClearSelection={() => setSelectedRecords([])}
      />
      </Suspense>
    </div>
  );
}
