import { useState, useCallback, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Sidebar } from './components/enterprise/Sidebar';
import { ViewToolbar } from './components/enterprise/ViewToolbar';
import { GridView } from './components/enterprise/GridView';
import { KanbanView } from './components/enterprise/KanbanView';
import { CalendarView } from './components/enterprise/CalendarView';
import { AIAssistant } from './components/enterprise/AIAssistant';
import { RecordDetail } from './components/enterprise/RecordDetail';
import { FilterPanel } from './components/enterprise/FilterPanel';
import { SortPanel } from './components/enterprise/SortPanel';
import { GroupPanel } from './components/enterprise/GroupPanel';
import { ErrorBoundary } from './components/enterprise/ErrorBoundary';
import { mockWorkspace, mockBase, mockTable } from './data/mockData';
import { Base, Table, View, Record as TableRecord, Filter, Sort, Group } from './types';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

export default function App() {
  const [workspace] = useState(mockWorkspace);
  const [currentBase, setCurrentBase] = useState<Base | null>(mockBase);
  const [currentTable, setCurrentTable] = useState<Table | null>(mockTable);
  const [currentView, setCurrentView] = useState<View>(mockTable.views[0]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TableRecord | null>(null);
  const [tableData, setTableData] = useState(mockTable);

  // Panel visibility
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dataos-dark-mode') === 'true';
    }
    return false;
  });

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('dataos-dark-mode', String(next));
      return next;
    });
  }, []);

  // Initialize dark mode on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
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
  };

  const handleCellChange = (recordId: string, fieldId: string, value: unknown) => {
    setTableData((prev) => ({
      ...prev,
      records: prev.records.map((record) =>
        record.id === recordId
          ? {
              ...record,
              fields: { ...record.fields, [fieldId]: value },
              modifiedTime: new Date().toISOString(),
              version: record.version + 1,
            }
          : record
      ),
    }));
    toast.success('Record updated');
  };

  const handleRecordClick = (record: TableRecord) => {
    setSelectedRecord(record);
  };

  const handleRecordDetailClose = () => {
    setSelectedRecord(null);
  };

  const handleAddRecord = () => {
    const newRecord: TableRecord = {
      id: `rec-${Date.now()}`,
      fields: {},
      createdTime: new Date().toISOString(),
      createdBy: workspace.members[0]?.id || 'unknown',
      modifiedTime: new Date().toISOString(),
      modifiedBy: workspace.members[0]?.id || 'unknown',
      version: 1,
    };
    // Pre-populate defaults
    tableData.fields.forEach((field) => {
      if (field.type === 'checkbox') newRecord.fields[field.id] = false;
      else if (field.type === 'multiselect') newRecord.fields[field.id] = [];
      else newRecord.fields[field.id] = '';
    });
    setTableData((prev) => ({
      ...prev,
      records: [...prev.records, newRecord],
    }));
    setSelectedRecord(newRecord);
    toast.success('New record created');
  };

  const handleRecordFieldChange = (fieldId: string, value: unknown) => {
    if (selectedRecord) {
      handleCellChange(selectedRecord.id, fieldId, value);
      setSelectedRecord((prev) =>
        prev ? { ...prev, fields: { ...prev.fields, [fieldId]: value } } : null
      );
    }
  };

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

    // Apply sorts
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

  if (!currentTable) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Welcome to DataOS</h2>
          <p className="text-gray-600 dark:text-gray-400">Select a base to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar
        workspace={workspace}
        currentBase={currentBase}
        currentTable={currentTable}
        onBaseSelect={handleBaseSelect}
        onTableSelect={handleTableSelect}
        onAIAssistantToggle={() => setShowAIAssistant(!showAIAssistant)}
        onDarkModeToggle={toggleDarkMode}
        isDarkMode={isDarkMode}
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
        />

        {/* Filter/Sort/Group Panels */}
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

        <ErrorBoundary fallbackTitle="View failed to render">
          {currentView.type === 'grid' && (
            <GridView
              fields={tableData.fields}
              records={filteredRecords}
              onRecordClick={handleRecordClick}
              onCellChange={handleCellChange}
              onAddRecord={handleAddRecord}
              members={workspace.members}
            />
          )}

          {currentView.type === 'kanban' && currentView.config?.groupByFieldId && (
            <KanbanView
              fields={tableData.fields}
              records={filteredRecords}
              groupByFieldId={currentView.config.groupByFieldId}
              onRecordClick={handleRecordClick}
              onCellChange={handleCellChange}
              members={workspace.members}
            />
          )}

          {currentView.type === 'calendar' && currentView.config?.dateFieldId && (
            <CalendarView
              fields={tableData.fields}
              records={filteredRecords}
              dateFieldId={currentView.config.dateFieldId}
              onRecordClick={handleRecordClick}
              members={workspace.members}
            />
          )}

          {currentView.type === 'calendar' && !currentView.config?.dateFieldId && (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 m-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Calendar View</h3>
                <p className="text-gray-600 dark:text-gray-400">Select a date field to display calendar</p>
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>

      {selectedRecord && (
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

      {showAIAssistant && (
        <ErrorBoundary fallbackTitle="AI Assistant encountered an error">
          <AIAssistant
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            tableName={currentTable.name}
          />
        </ErrorBoundary>
      )}

      <Toaster />
    </div>
  );
}
