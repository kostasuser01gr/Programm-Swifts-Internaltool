import { useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Field, Record as TableRecord } from '../../types';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';

interface KanbanViewProps {
  fields: Field[];
  records: TableRecord[];
  groupByFieldId: string;
  onRecordClick: (record: TableRecord) => void;
  onCellChange: (recordId: string, fieldId: string, value: unknown) => void;
  members: { id: string; name: string; email: string }[];
}

const ITEM_TYPE = 'KANBAN_CARD';

interface DragItem {
  recordId: string;
  sourceColumnId: string;
}

function KanbanCard({
  record,
  fields,
  members,
  groupByFieldId,
  onRecordClick,
}: {
  record: TableRecord;
  fields: Field[];
  members: { id: string; name: string; email: string }[];
  groupByFieldId: string;
  onRecordClick: (record: TableRecord) => void;
}) {
  const primaryField = fields.find((f) => f.isPrimary);
  const assigneeField = fields.find((f) => f.type === 'user');
  const dateField = fields.find((f) => f.type === 'date');
  const tagsField = fields.find((f) => f.type === 'multiselect');

  const [{ isDragging }, dragRef] = useDrag({
    type: ITEM_TYPE,
    item: (): DragItem => ({
      recordId: record.id,
      sourceColumnId: record.fields[groupByFieldId],
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
      onClick={() => onRecordClick(record)}
    >
      <h4 className="font-medium text-sm mb-2">
        {primaryField ? record.fields[primaryField.id] : 'Untitled'}
      </h4>

      {tagsField && record.fields[tagsField.id] && (
        <div className="flex gap-1 flex-wrap mb-2">
          {(Array.isArray(record.fields[tagsField.id]) ? record.fields[tagsField.id] : []).map((tagId: string) => {
            const tag = tagsField.options?.choices?.find((c) => c.id === tagId);
            return tag ? (
              <span
                key={tagId}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color === '#gray' ? '#4B5563' : tag.color,
                }}
              >
                {tag.name}
              </span>
            ) : null;
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        {assigneeField && record.fields[assigneeField.id] && (() => {
          const user = members.find((m) => m.id === record.fields[assigneeField.id]);
          return user ? (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-medium">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs text-gray-600">{user.name.split(' ')[0]}</span>
            </div>
          ) : null;
        })()}

        {dateField && record.fields[dateField.id] && (
          <div className="text-xs text-gray-500">
            {new Date(record.fields[dateField.id]).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  records,
  fields,
  members,
  groupByFieldId,
  onRecordClick,
  onDrop,
}: {
  column: { id: string; name: string; color: string };
  records: TableRecord[];
  fields: Field[];
  members: { id: string; name: string; email: string }[];
  groupByFieldId: string;
  onRecordClick: (record: TableRecord) => void;
  onDrop: (recordId: string, targetColumnId: string) => void;
}) {
  const [{ isOver }, dropRef] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => {
      if (item.sourceColumnId !== column.id) {
        onDrop(item.recordId, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={dropRef as unknown as React.Ref<HTMLDivElement>}
      className={`flex-shrink-0 w-80 flex flex-col rounded-lg transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: column.color === '#gray' ? '#9CA3AF' : column.color,
            }}
          />
          <h3 className="font-medium text-sm">{column.name}</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {records.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => toast.info(`Column actions for "${column.name}" coming soon...`)}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 pb-2">
          {records.map((record) => (
            <KanbanCard
              key={record.id}
              record={record}
              fields={fields}
              members={members}
              groupByFieldId={groupByFieldId}
              onRecordClick={onRecordClick}
            />
          ))}

          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-gray-500 border border-dashed border-gray-300 hover:border-gray-400"
            onClick={() => toast.info('New record coming soon...')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

export function KanbanView({ fields, records, groupByFieldId, onRecordClick, onCellChange, members }: KanbanViewProps) {
  const groupField = fields.find((f) => f.id === groupByFieldId);

  const handleDrop = useCallback(
    (recordId: string, targetColumnId: string) => {
      onCellChange(recordId, groupByFieldId, targetColumnId);
    },
    [onCellChange, groupByFieldId],
  );

  if (!groupField || groupField.type !== 'select') {
    return <div className="p-8 text-center text-gray-500">Select a single-select field to group by</div>;
  }

  const columns = groupField.options?.choices || [];

  const getRecordsForColumn = (columnId: string) => {
    return records.filter((record) => record.fields[groupByFieldId] === columnId);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="flex gap-4 h-full">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              records={getRecordsForColumn(column.id)}
              fields={fields}
              members={members}
              groupByFieldId={groupByFieldId}
              onRecordClick={onRecordClick}
              onDrop={handleDrop}
            />
          ))}

          <div className="flex-shrink-0 w-80">
            <Button
              variant="outline"
              className="w-full justify-start text-sm border-dashed"
              onClick={() => toast.info('Add column coming soon...')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add column
            </Button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
