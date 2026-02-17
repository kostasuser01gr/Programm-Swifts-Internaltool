import { useState, useCallback } from 'react';
import type { Notification } from '../types';

// Initial mock notifications
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'assignment',
    title: 'Νέα ανάθεση βάρδιας',
    message: 'Ο ΜΟΙΡΑΚΗΣ τοποθετήθηκε σε νυχτερινή βάρδια',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    userId: 'user-1',
    entityType: 'record',
    entityId: 'rec-8',
  },
  {
    id: 'notif-2',
    type: 'comment',
    title: 'Νέο σχόλιο',
    message: 'Σχόλιο στη βάρδια ΤΖΑΝΙΔΑΚΗ: Αλλαγή ωραρίου',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    userId: 'user-1',
    entityType: 'record',
    entityId: 'rec-1',
  },
  {
    id: 'notif-3',
    type: 'automation',
    title: 'Αυτοματισμός ενεργοποιήθηκε',
    message: 'Η "Αυτόματη παρουσία" εκτελέστηκε για ΣΥΡΙΓΩΝΑΚΗ',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
    userId: 'user-1',
    entityType: 'record',
    entityId: 'rec-7',
  },
  {
    id: 'notif-4',
    type: 'reminder',
    title: 'Υπενθύμιση βάρδιας',
    message: 'Η βάρδια του ΠΑΣΠΑΛΑΚΗΣ αρχίζει σε 1 ώρα',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    read: false,
    userId: 'user-1',
    entityType: 'record',
    entityId: 'rec-3',
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Εβδομαδιαία αναφορά',
    message: 'Σύνολο 23 μέλη προσωπικού ενεργά. 1 σε ρεπό.',
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
