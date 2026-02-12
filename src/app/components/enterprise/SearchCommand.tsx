import { useState, useRef, useEffect } from 'react';
import { Search, ArrowRight, Grid3x3, Kanban, Calendar, Image, BarChart3, FileText, Database } from 'lucide-react';
import { ViewType } from '../../types';

interface SearchAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface SearchCommandProps {
  isOpen: boolean;
  onClose: () => void;
  actions: SearchAction[];
  onSearch?: (query: string) => void;
  searchResults?: { id: string; title: string; subtitle?: string }[];
  onResultClick?: (id: string) => void;
}

const VIEW_ICONS: Record<ViewType, React.ReactNode> = {
  grid: <Grid3x3 className="w-4 h-4" />,
  kanban: <Kanban className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  gallery: <Image className="w-4 h-4" />,
  timeline: <BarChart3 className="w-4 h-4" />,
  form: <FileText className="w-4 h-4" />,
};

export function SearchCommand({ isOpen, onClose, actions, onSearch, searchResults, onResultClick }: SearchCommandProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter actions by query
  const filteredActions = query.trim()
    ? actions.filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description?.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      )
    : actions;

  // Group by category
  const groupedActions: Record<string, SearchAction[]> = {};
  filteredActions.forEach((action) => {
    if (!groupedActions[action.category]) {
      groupedActions[action.category] = [];
    }
    groupedActions[action.category].push(action);
  });

  const allItems = filteredActions;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    if (onSearch) onSearch(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Command palette */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions, records, and more..."
            className="flex-1 h-14 px-3 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
          </div>
        </div>

        {/* Search results from data */}
        {searchResults && searchResults.length > 0 && query.trim() && (
          <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">Records</div>
            {searchResults.slice(0, 5).map((result) => (
              <button
                key={result.id}
                className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  onResultClick?.(result.id);
                  onClose();
                }}
              >
                <Database className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{result.subtitle}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Actions list */}
        <div className="max-h-80 overflow-auto px-2 py-2">
          {Object.entries(groupedActions).map(([category, categoryActions]) => (
            <div key={category}>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800">
                {category}
              </div>
              {categoryActions.map((action) => {
                const globalIdx = allItems.indexOf(action);
                const isSelected = globalIdx === selectedIndex;
                return (
                  <button
                    key={action.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      action.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                  >
                    <div className={`flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</div>
                      {action.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{action.description}</div>
                      )}
                    </div>
                    {action.shortcut && (
                      <kbd className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                        {action.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredActions.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
