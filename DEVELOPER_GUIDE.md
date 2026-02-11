# DataOS - Developer Guide

## Quick Start for Developers

This guide helps you understand the codebase architecture and extend DataOS with new features.

---

## Core Concepts

### Data Model Hierarchy

```typescript
Workspace (Tenant/Organization)
  └── Base (Project/Database)
        └── Table (Entity)
              ├── Field (Column/Property)
              ├── Record (Row/Instance)
              ├── View (Perspective)
              └── Automation (Workflow)
```

### Type System

All core types are defined in `/src/app/types/index.ts`:

```typescript
// Central type definitions
- FieldType: Union of all supported field types
- Field: Column definition with config
- Record: Data row with versioning
- View: Saved perspective with filters/sorts
- Table: Collection of fields + records
- Base: Collection of tables
- Workspace: Top-level container
```

---

## Adding a New Field Type

### 1. Update Type Definition

```typescript
// /src/app/types/index.ts
export type FieldType = 
  | 'text' 
  | 'number'
  | 'your_new_type'; // Add here
```

### 2. Add Field Configuration

```typescript
export interface Field {
  id: string;
  name: string;
  type: FieldType;
  options?: {
    // Add type-specific options
    yourTypeConfig?: {
      format?: string;
      validation?: any;
    };
  };
}
```

### 3. Implement Renderer in GridView

```typescript
// /src/app/components/enterprise/GridView.tsx
const renderCell = (record: TableRecord, field: Field) => {
  switch (field.type) {
    case 'your_new_type':
      return (
        <div className="px-2">
          <YourCustomRenderer value={value} />
        </div>
      );
    // ... existing cases
  }
};
```

### 4. Add Editor in RecordDetail

```typescript
// /src/app/components/enterprise/RecordDetail.tsx
const renderFieldInput = (field: Field) => {
  switch (field.type) {
    case 'your_new_type':
      return (
        <YourCustomEditor
          value={record.fields[field.id]}
          onChange={(val) => onFieldChange(field.id, val)}
        />
      );
  }
};
```

---

## Creating a New View Type

### 1. Define View Type

```typescript
// /src/app/types/index.ts
export type ViewType = 
  | 'grid' 
  | 'kanban' 
  | 'your_new_view';
```

### 2. Create View Component

```typescript
// /src/app/components/enterprise/YourNewView.tsx
import { Field, Record as TableRecord } from '../../types';

interface YourNewViewProps {
  fields: Field[];
  records: TableRecord[];
  onRecordClick: (record: TableRecord) => void;
  members: { id: string; name: string }[];
}

export function YourNewView({ 
  fields, 
  records, 
  onRecordClick, 
  members 
}: YourNewViewProps) {
  return (
    <div className="flex-1 overflow-auto">
      {/* Your view implementation */}
    </div>
  );
}
```

### 3. Register in ViewToolbar

```typescript
// /src/app/components/enterprise/ViewToolbar.tsx
import { YourIcon } from 'lucide-react';

const viewIcons: Record<ViewType, any> = {
  grid: Grid3x3,
  kanban: Kanban,
  your_new_view: YourIcon,
  // ...
};
```

### 4. Add to App Router

```typescript
// /src/app/App.tsx
import { YourNewView } from './components/enterprise/YourNewView';

// In render:
{currentView.type === 'your_new_view' && (
  <YourNewView
    fields={tableData.fields}
    records={tableData.records}
    onRecordClick={handleRecordClick}
    members={workspace.members}
  />
)}
```

---

## Implementing Automation Actions

### 1. Define Action Type

```typescript
// /src/app/types/index.ts
type ActionType =
  | 'update_record'
  | 'your_custom_action';

interface Action {
  type: ActionType;
  config: {
    // Action-specific configuration
    customParam?: string;
  };
}
```

### 2. Create Execution Handler

```typescript
// /src/app/utils/automationEngine.ts
export class AutomationEngine {
  async executeAction(action: Action, context: Context) {
    switch (action.type) {
      case 'your_custom_action':
        return this.executeYourAction(action.config, context);
      // ... existing cases
    }
  }

  private async executeYourAction(config: any, context: Context) {
    // Implementation
    console.log('Executing custom action:', config);
    // Perform action logic
  }
}
```

---

## Adding AI Capabilities

### 1. Extend AI Service

```typescript
// /src/app/utils/aiService.ts
export class AIService {
  async yourCustomAIFeature(input: string, context: any) {
    const prompt = this.buildPrompt(input, context);
    
    const response = await this.callLLM({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'System prompt...' },
        { role: 'user', content: prompt }
      ],
    });

    return this.parseResponse(response);
  }
}
```

### 2. Add AI Assistant Handler

```typescript
// /src/app/components/enterprise/AIAssistant.tsx
const getAIResponse = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('your_keyword')) {
    // Call your custom AI feature
    return `Response from your feature...`;
  }
  
  // ... existing handlers
};
```

---

## State Management Patterns

### Local Component State

```typescript
// For UI-only state (e.g., modals, editing)
const [isOpen, setIsOpen] = useState(false);
const [editingCell, setEditingCell] = useState<CellRef | null>(null);
```

### Lifted State (Parent Component)

```typescript
// For shared state across components
const [tableData, setTableData] = useState(mockTable);

const handleCellChange = (recordId, fieldId, value) => {
  setTableData(prev => ({
    ...prev,
    records: prev.records.map(record =>
      record.id === recordId
        ? { ...record, fields: { ...record.fields, [fieldId]: value } }
        : record
    ),
  }));
};
```

### Future: Context + Hooks

```typescript
// For global state (workspace, user, etc.)
const WorkspaceContext = createContext<WorkspaceState>();

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
```

---

## Performance Optimization

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

// Expensive computations
const filteredRecords = useMemo(() => {
  return records.filter(record => 
    filters.every(filter => matchesFilter(record, filter))
  );
}, [records, filters]);

// Callback stability
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);
```

### Virtualization (Future)

```typescript
// For large datasets
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: records.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40, // Row height
  overscan: 5,
});
```

---

## Testing Strategies

### Unit Tests

```typescript
// /src/app/utils/__tests__/formulas.test.ts
import { evaluateFormula } from '../formulas';

describe('Formula Engine', () => {
  it('should calculate SUM correctly', () => {
    const result = evaluateFormula('=SUM(A1:A5)', mockData);
    expect(result).toBe(150);
  });
});
```

### Component Tests

```typescript
// /src/app/components/__tests__/GridView.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GridView } from '../enterprise/GridView';

test('renders records correctly', () => {
  render(<GridView {...mockProps} />);
  expect(screen.getByText('Task Name')).toBeInTheDocument();
});

test('handles cell click', () => {
  const onCellChange = jest.fn();
  render(<GridView onCellChange={onCellChange} {...mockProps} />);
  
  fireEvent.click(screen.getByText('Task 1'));
  expect(onCellChange).toHaveBeenCalled();
});
```

---

## API Integration (Future)

### GraphQL Client Setup

```typescript
// /src/app/lib/apollo.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: createHttpLink({
    uri: '/graphql',
    credentials: 'include',
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Record: {
        fields: {
          fields: {
            merge: true, // Deep merge for nested objects
          },
        },
      },
    },
  }),
});
```

### Query Hook Pattern

```typescript
// /src/app/hooks/useTable.ts
import { useQuery, gql } from '@apollo/client';

const GET_TABLE = gql`
  query GetTable($tableId: ID!) {
    table(id: $tableId) {
      id
      name
      fields {
        id
        name
        type
      }
      records {
        id
        fields
      }
    }
  }
`;

export function useTable(tableId: string) {
  const { data, loading, error } = useQuery(GET_TABLE, {
    variables: { tableId },
  });

  return {
    table: data?.table,
    loading,
    error,
  };
}
```

### Mutation Hook Pattern

```typescript
// /src/app/hooks/useUpdateRecord.ts
import { useMutation, gql } from '@apollo/client';

const UPDATE_RECORD = gql`
  mutation UpdateRecord($input: UpdateRecordInput!) {
    updateRecord(input: $input) {
      id
      fields
      version
    }
  }
`;

export function useUpdateRecord() {
  const [updateRecord, { loading }] = useMutation(UPDATE_RECORD, {
    optimisticResponse: (variables) => ({
      updateRecord: {
        __typename: 'Record',
        id: variables.input.recordId,
        fields: variables.input.fields,
        version: 999, // Will be replaced by server response
      },
    }),
    update: (cache, { data }) => {
      // Update Apollo cache
      cache.modify({
        id: cache.identify(data.updateRecord),
        fields: {
          fields: () => data.updateRecord.fields,
        },
      });
    },
  });

  return { updateRecord, loading };
}
```

---

## Real-time Sync (Future)

### WebSocket Setup

```typescript
// /src/app/lib/realtime.ts
import { io } from 'socket.io-client';

export const socket = io('wss://api.dataos.com', {
  auth: {
    token: localStorage.getItem('auth_token'),
  },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to real-time server');
});

socket.on('record:updated', (data) => {
  // Update local state
  updateRecordInCache(data);
});
```

### CRDT Integration

```typescript
// /src/app/hooks/useCollaboration.ts
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function useCollaboration(tableId: string) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider] = useState(() => 
    new WebsocketProvider('wss://sync.dataos.com', tableId, ydoc)
  );

  useEffect(() => {
    const ymap = ydoc.getMap('records');
    
    const observer = (event: Y.YMapEvent<any>) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'update') {
          updateRecord(key, ymap.get(key));
        }
      });
    };

    ymap.observe(observer);
    return () => ymap.unobserve(observer);
  }, [ydoc]);

  return { ydoc, provider };
}
```

---

## Deployment

### Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.dataos.com
VITE_WS_URL=wss://sync.dataos.com
VITE_OPENAI_API_KEY=sk-...
VITE_SENTRY_DSN=https://...
```

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          icons: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

---

## Common Patterns

### Loading States

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner />
      <span>Loading table...</span>
    </div>
  );
}
```

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Optimistic Updates

```typescript
const handleUpdate = async (recordId, data) => {
  // 1. Update UI immediately
  setRecords(prev => 
    prev.map(r => r.id === recordId ? { ...r, ...data } : r)
  );

  try {
    // 2. Persist to server
    await api.updateRecord(recordId, data);
    toast.success('Updated');
  } catch (error) {
    // 3. Rollback on error
    setRecords(originalRecords);
    toast.error('Update failed');
  }
};
```

---

## Best Practices

### 1. Component Organization
- Keep components small and focused
- Extract reusable logic into hooks
- Co-locate related files

### 2. Type Safety
- Use strict TypeScript mode
- Avoid `any` type
- Define prop interfaces

### 3. Performance
- Memoize expensive computations
- Use `useCallback` for callbacks passed to children
- Virtualize large lists

### 4. Accessibility
- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation

### 5. Error Handling
- Always handle async errors
- Provide user feedback
- Log errors to monitoring service

---

## Troubleshooting

### Types Not Working
```bash
# Restart TypeScript server
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### State Not Updating
- Check if you're mutating state directly (use spread operator)
- Verify dependency arrays in hooks
- Check React DevTools for re-renders

### Performance Issues
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Verify virtualization is enabled for large lists

---

## Resources

- **React Docs**: https://react.dev
- **TypeScript Handbook**: https://typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://radix-ui.com
- **Apollo Client**: https://apollographql.com/docs/react

---

## Contributing

When adding new features:

1. Update type definitions in `/src/app/types/`
2. Add component implementation
3. Update mock data if needed
4. Document in this guide
5. Add tests (when testing is set up)

---

Happy coding! 🚀
