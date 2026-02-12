import type { ComponentType } from 'react';
import { Grid3x3, Kanban, Calendar, Image, Filter, SortAsc, Group, Share2, Plus, BarChart3, FileText, Search, Undo2, Redo2, FileInput, Settings2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { View, ViewType } from '../../types';

interface ViewToolbarProps {
  currentView: View;
  views: View[];
  onViewChange: (view: View) => void;
  onViewCreate: (type: ViewType) => void;
  onFilterClick: () => void;
  onSortClick: () => void;
  onGroupClick: () => void;
  onShareClick: () => void;
  filterCount: number;
  sortCount: number;
  groupCount: number;
  onSearchClick?: () => void;
  onUndoClick?: () => void;
  onRedoClick?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onImportExportClick?: () => void;
  onFieldEditorClick?: () => void;
}

const viewIcons: { [key in ViewType]: ComponentType<{ className?: string }> } = {
  grid: Grid3x3,
  kanban: Kanban,
  calendar: Calendar,
  gallery: Image,
  timeline: BarChart3,
  form: FileText,
};

export function ViewToolbar({
  currentView,
  views,
  onViewChange,
  onViewCreate,
  onFilterClick,
  onSortClick,
  onGroupClick,
  onShareClick,
  filterCount,
  sortCount,
  groupCount,
  onSearchClick,
  onUndoClick,
  onRedoClick,
  canUndo = false,
  canRedo = false,
  onImportExportClick,
  onFieldEditorClick,
}: ViewToolbarProps) {
  const CurrentViewIcon = viewIcons[currentView.type] || Grid3x3;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        {/* View Selector */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
          {views.map((view) => {
            const Icon = viewIcons[view.type] || Grid3x3;
            return (
              <Button
                key={view.id}
                variant={currentView.id === view.id ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7"
                onClick={() => onViewChange(view)}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {view.name}
              </Button>
            );
          })}
          <Button variant="ghost" size="sm" className="h-7" onClick={() => onViewCreate(currentView.type)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* View Controls */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onFilterClick}
          className={filterCount > 0 ? 'bg-blue-50 text-blue-600' : ''}
        >
          <Filter className="w-4 h-4 mr-1.5" />
          Filter
          {filterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">
              {filterCount}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSortClick}
          className={sortCount > 0 ? 'bg-blue-50 text-blue-600' : ''}
        >
          <SortAsc className="w-4 h-4 mr-1.5" />
          Sort
          {sortCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">
              {sortCount}
            </span>
          )}
        </Button>

        {currentView.type === 'grid' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onGroupClick}
            className={groupCount > 0 ? 'bg-blue-50 text-blue-600' : ''}
          >
            <Group className="w-4 h-4 mr-1.5" />
            Group
            {groupCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">
                {groupCount}
              </span>
            )}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onSearchClick && (
          <Button variant="ghost" size="sm" onClick={onSearchClick} title="Search (⌘K)">
            <Search className="w-4 h-4 mr-1.5" />
            <span className="text-xs text-gray-400">⌘K</span>
          </Button>
        )}

        {onUndoClick && (
          <Button variant="ghost" size="sm" onClick={onUndoClick} disabled={!canUndo} title="Undo (⌘Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
        )}
        {onRedoClick && (
          <Button variant="ghost" size="sm" onClick={onRedoClick} disabled={!canRedo} title="Redo (⌘⇧Z)">
            <Redo2 className="w-4 h-4" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6" />

        {onFieldEditorClick && (
          <Button variant="ghost" size="sm" onClick={onFieldEditorClick}>
            <Settings2 className="w-4 h-4 mr-1.5" />
            Fields
          </Button>
        )}

        {onImportExportClick && (
          <Button variant="ghost" size="sm" onClick={onImportExportClick}>
            <FileInput className="w-4 h-4 mr-1.5" />
            Import / Export
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={onShareClick}>
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-xs text-white font-medium">
              J
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 border-2 border-white flex items-center justify-center text-xs text-white font-medium">
              S
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 border-2 border-white flex items-center justify-center text-xs text-white font-medium">
              M
            </div>
          </div>
          <span className="text-xs text-gray-500 ml-1">3 viewing</span>
        </div>
      </div>
    </div>
  );
}

