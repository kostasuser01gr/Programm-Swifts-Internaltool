// ─── Notification Center ────────────────────────────────────
// Full-screen sheet from right with inbox list, read/unread,
// filters, and mark-all-read.

import React, { useState, useMemo } from 'react';
import {
  Bell, Check, CheckCheck, Filter, AlertTriangle,
  Info, MessageSquare, Zap, X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../ui/utils';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'message' | 'automation';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

const TYPE_ICONS: Record<Notification['type'], React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: Check,
  error: AlertTriangle,
  message: MessageSquare,
  automation: Zap,
};

const TYPE_COLORS: Record<Notification['type'], string> = {
  info: 'text-info',
  warning: 'text-warning',
  success: 'text-success',
  error: 'text-destructive',
  message: 'text-primary',
  automation: 'text-chart-3',
};

export function NotificationCenter({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = useMemo(() => {
    const base = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
    return base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-[400px] sm:w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-sm font-semibold">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs h-7">
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="mt-2">
            <TabsList className="h-8 w-full">
              <TabsTrigger value="all" className="text-xs flex-1">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs flex-1">
                Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <Bell className="w-10 h-10 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {filter === 'unread'
                  ? 'You have no unread notifications.'
                  : 'Notifications will appear here as things happen.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((notif) => {
                const Icon = TYPE_ICONS[notif.type];
                const colorClass = TYPE_COLORS[notif.type];
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group',
                      !notif.read && 'bg-primary/[0.03]',
                    )}
                    onClick={() => { if (!notif.read) onMarkRead(notif.id); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !notif.read) onMarkRead(notif.id); }}
                  >
                    <div className={cn('mt-0.5 shrink-0', colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm leading-snug',
                          !notif.read ? 'font-medium text-foreground' : 'text-muted-foreground',
                        )}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default NotificationCenter;
