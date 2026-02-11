import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search, Settings, Users, Database, Zap, BarChart, Bot, Moon, Sun, Bell, FileInput } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Base, Table } from '../../types';
import { toast } from 'sonner';

interface SidebarProps {
  workspace: { id: string; name: string; bases: Base[]; members: { id: string; name: string; email: string; role: string }[] };
  currentBase: Base | null;
  currentTable: Table | null;
  onBaseSelect: (base: Base) => void;
  onTableSelect: (table: Table) => void;
  onAIAssistantToggle: () => void;
  onDarkModeToggle?: () => void;
  isDarkMode?: boolean;
  onNotificationsToggle?: () => void;
  unreadNotifications?: number;
  onAnalyticsToggle?: () => void;
  onAutomationsToggle?: () => void;
}

export function Sidebar({
  workspace,
  currentBase,
  currentTable,
  onBaseSelect,
  onTableSelect,
  onAIAssistantToggle,
  onDarkModeToggle,
  isDarkMode,
  onNotificationsToggle,
  unreadNotifications = 0,
  onAnalyticsToggle,
  onAutomationsToggle,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBases, setExpandedBases] = useState<Set<string>>(
    new Set(currentBase ? [currentBase.id] : [])
  );

  const currentUser = workspace.members[0];

  const toggleBaseExpand = (baseId: string) => {
    setExpandedBases((prev) => {
      const next = new Set(prev);
      if (next.has(baseId)) {
        next.delete(baseId);
      } else {
        next.add(baseId);
      }
      return next;
    });
  };

  const filteredBases = workspace.bases.filter((base) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      base.name.toLowerCase().includes(q) ||
      base.tables.some((t) => t.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Workspace Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {workspace.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-semibold text-sm">{workspace.name}</h2>
              <p className="text-xs text-gray-500">Enterprise</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => toast.info('Settings panel coming soon...')}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-8 h-8 text-sm bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm mb-1"
            onClick={onAIAssistantToggle}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
            <span className="ml-auto text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded">
              AI
            </span>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start text-sm mb-1" onClick={onAutomationsToggle ?? (() => toast.info('Automation builder coming soon...'))}>
            <Zap className="w-4 h-4 mr-2" />
            Automations
          </Button>

          <Button variant="ghost" className="w-full justify-start text-sm mb-1" onClick={onAnalyticsToggle ?? (() => toast.info('Analytics dashboard coming soon...'))}>
            <BarChart className="w-4 h-4 mr-2" />
            Analytics
          </Button>

          <Button variant="ghost" className="w-full justify-start text-sm mb-1 relative" onClick={onNotificationsToggle ?? (() => toast.info('Notifications coming soon...'))}>
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {unreadNotifications > 0 && (
              <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadNotifications}
              </span>
            )}
          </Button>

          <Button variant="ghost" className="w-full justify-start text-sm mb-1" onClick={() => toast.info(`${workspace.members.length} members in workspace`)}>
            <Users className="w-4 h-4 mr-2" />
            Members
          </Button>

          <Separator className="my-2" />

          {/* Bases */}
          <div className="mb-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-medium text-gray-500 uppercase">Bases</span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => toast.info('Add base coming soon...')}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {filteredBases.map((base) => {
            const isExpanded = expandedBases.has(base.id);
            return (
              <div key={base.id} className="mb-2">
                <Button
                  variant={currentBase?.id === base.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-sm mb-1"
                  onClick={() => {
                    onBaseSelect(base);
                    if (!isExpanded) toggleBaseExpand(base.id);
                  }}
                >
                  <span className="mr-2">{base.icon || '📊'}</span>
                  {base.name}
                  <button
                    className="ml-auto p-0.5 hover:bg-gray-200 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBaseExpand(base.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                </Button>

                {isExpanded && (
                  <div className="ml-4 space-y-1">
                    {base.tables.map((table) => (
                      <Button
                        key={table.id}
                        variant={currentTable?.id === table.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-sm"
                        onClick={() => onTableSelect(table)}
                      >
                        <Database className="w-3 h-3 mr-2" />
                        <span className="mr-1">{table.icon || '📋'}</span>
                        {table.name}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm text-gray-500"
                      onClick={() => toast.info('Add table coming soon...')}
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add table
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {currentUser?.name.split(' ').map((n) => n[0]).join('') || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-500 capitalize">{currentUser?.role || 'User'}</p>
          </div>
          {onDarkModeToggle && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDarkModeToggle}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
