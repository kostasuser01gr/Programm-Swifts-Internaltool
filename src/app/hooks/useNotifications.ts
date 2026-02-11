import { useState, useCallback } from 'react';
import type { Notification } from '../types';

// Initial mock notifications
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'assignment',
    title: 'New task assigned',
    message: 'Sarah Johnson assigned "Design new dashboard layout" to you',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    userId: 'user-1',
    entityType: 'record',
    entityId: 'rec-2',
  },
  {
    id: 'notif-2',
    type: 'comment',
    title: 'New comment',
    message: 'Mike Chen commented on "Set up CI/CD pipeline"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    userId: 'user-1',
    entityType: 'record',
    entityId: 'rec-6',
  },
  {
    id: 'notif-3',
    type: 'automation',
    title: 'Automation triggered',
    message: 'Auto-complete when checked ran for "Fix mobile responsive issues"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
    userId: 'user-1',
    entityType: 'record',
    entityId: 'rec-3',
  },
  {
    id: 'notif-4',
    type: 'reminder',
    title: 'Task overdue',
    message: '"API documentation update" was due yesterday',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    read: false,
    userId: 'user-1',
    entityType: 'record',
    entityId: 'rec-5',
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Weekly summary',
    message: 'Your team completed 3 tasks this week. 2 are overdue.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    userId: 'user-1',
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    addNotification,
    clearAll,
  };
}
