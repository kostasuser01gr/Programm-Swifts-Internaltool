import { useState } from 'react';
import { Image, User, Calendar as CalendarIcon, MoreHorizontal, Plus, Grid3x3, LayoutGrid } from 'lucide-react';
import { Field, Record as TableRecord } from '../../types';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface GalleryViewProps {
  fields: Field[];
  records: TableRecord[];
  onRecordClick: (record: TableRecord) => void;
  members: { id: string; name: string; email: string }[];
  cardSize?: 'small' | 'medium' | 'large';
}

export function GalleryView({ fields, records, onRecordClick, members, cardSize = 'medium' }: GalleryViewProps) {
  const [size, setSize] = useState(cardSize);

  const primaryField = fields.find((f) => f.isPrimary);
  const statusField = fields.find((f) => f.type === 'select');
  const assigneeField = fields.find((f) => f.type === 'user');
  const dateField = fields.find((f) => f.type === 'date');
  const descField = fields.find((f) => f.name.toLowerCase().includes('description') || f.name.toLowerCase().includes('notes'));
  const tagsField = fields.find((f) => f.type === 'multiselect');
  const numberField = fields.find((f) => f.type === 'number');

  const gridCols = {
    small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    medium: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  const colors = [
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-orange-400 to-rose-500',
    'from-violet-400 to-purple-500',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-500',
    'from-pink-400 to-rose-500',
    'from-lime-400 to-emerald-500',
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      {/* Gallery controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {records.length} {records.length === 1 ? 'record' : 'records'}
        </div>
        <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-gray-800">
          <Button
            variant={size === 'small' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setSize('small')}
            title="Small cards"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={size === 'medium' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setSize('medium')}
            title="Medium cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={size === 'large' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setSize('large')}
            title="Large cards"
          >
            <Image className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Cards grid */}
      <div className={`grid ${gridCols[size]} gap-4`}>
        {records.map((record, idx) => {
          const title = primaryField ? String(record.fields[primaryField.id] || 'Untitled') : 'Untitled';
          const description = descField ? String(record.fields[descField.id] || '') : '';
          const assignee = assigneeField ? members.find((m) => m.id === record.fields[assigneeField.id]) : null;
          const status = statusField?.options?.choices?.find((c) => c.id === record.fields[statusField.id]);
          const dueDate = dateField ? record.fields[dateField.id] : null;
          const tags = tagsField && Array.isArray(record.fields[tagsField.id]) ? record.fields[tagsField.id] as string[] : [];
          const effort = numberField ? record.fields[numberField.id] : null;
          const colorGrad = colors[idx % colors.length];

          return (
            <div
              key={record.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => onRecordClick(record)}
            >
              {/* Cover image area */}
              <div className={`h-32 bg-gradient-to-br ${colorGrad} relative`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-semibold text-sm truncate drop-shadow-sm">
                    {title}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/40 text-white"
                  onClick={(e) => { e.stopPropagation(); onRecordClick(record); }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Card body */}
              <div className="p-3 space-y-2">
                {/* Status badge */}
                {status && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${status.color === '#gray' ? '#9CA3AF' : status.color}20`,
                      color: status.color === '#gray' ? '#4B5563' : status.color,
                    }}
                  >
                    {status.name}
                  </span>
                )}

                {/* Description preview */}
                {description && size !== 'small' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 3).map((tagId) => {
                      const tag = tagsField?.options?.choices?.find((c) => c.id === tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${tag.color === '#gray' ? '#9CA3AF' : tag.color}20`,
                            color: tag.color === '#gray' ? '#4B5563' : tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                    {tags.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer metadata */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {assignee && (
                      <div className="flex items-center gap-1" title={assignee.name}>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-medium">
                          {assignee.name.charAt(0)}
                        </div>
                        {size !== 'small' && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">{assignee.name.split(' ')[0]}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {effort !== null && effort !== undefined && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        {effort}h
                      </span>
                    )}
                    {dueDate && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(String(dueDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add new card */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[200px] cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
          onClick={() => toast.info('New record coming soon...')}
        >
          <div className="text-center">
            <Plus className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <span className="text-sm text-gray-400 dark:text-gray-500">Add record</span>
          </div>
        </div>
      </div>
    </div>
  );
}
