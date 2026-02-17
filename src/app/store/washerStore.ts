import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WashRecord, WashChecklistItem, WashStatus, WashType, FleetVehicle } from '../types/platform';

// ─── Default Checklists ──────────────────────────────────────

const QUICK_CHECKLIST: WashChecklistItem[] = [
  { id: 'wc-1', label: 'Εξωτερικό πλύσιμο', checked: false, category: 'exterior' },
  { id: 'wc-2', label: 'Στέγνωμα', checked: false, category: 'exterior' },
  { id: 'wc-3', label: 'Παράθυρα', checked: false, category: 'exterior' },
  { id: 'wc-4', label: 'Σκούπισμα εσωτερικού', checked: false, category: 'interior' },
  { id: 'wc-5', label: 'Ταμπλό / κονσόλα', checked: false, category: 'interior' },
];

const STANDARD_CHECKLIST: WashChecklistItem[] = [
  ...QUICK_CHECKLIST,
  { id: 'wc-6', label: 'Ζάντες', checked: false, category: 'exterior' },
  { id: 'wc-7', label: 'Ελαστικά (γυάλισμα)', checked: false, category: 'exterior' },
  { id: 'wc-8', label: 'Σκούπα / ηλεκτρική', checked: false, category: 'interior' },
  { id: 'wc-9', label: 'Πατάκια', checked: false, category: 'interior' },
  { id: 'wc-10', label: 'Πορτ μπαγκάζ', checked: false, category: 'interior' },
  { id: 'wc-11', label: 'Αρωματικό', checked: false, category: 'final' },
  { id: 'wc-12', label: 'Τελικός έλεγχος', checked: false, category: 'final' },
];

const DEEP_CHECKLIST: WashChecklistItem[] = [
  ...STANDARD_CHECKLIST,
  { id: 'wc-13', label: 'Κέρωμα', checked: false, category: 'exterior' },
  { id: 'wc-14', label: 'Καθαρισμός κινητήρα', checked: false, category: 'exterior' },
  { id: 'wc-15', label: 'Δερμάτινα καθίσματα', checked: false, category: 'interior' },
  { id: 'wc-16', label: 'Αεραγωγοί', checked: false, category: 'interior' },
  { id: 'wc-17', label: 'Απολύμανση', checked: false, category: 'final' },
];

const VIP_CHECKLIST: WashChecklistItem[] = [
  ...DEEP_CHECKLIST,
  { id: 'wc-18', label: 'Γυάλισμα χρωμίων', checked: false, category: 'exterior' },
  { id: 'wc-19', label: 'Προστασία paint sealant', checked: false, category: 'exterior' },
  { id: 'wc-20', label: 'Οζονοποίηση', checked: false, category: 'final' },
  { id: 'wc-21', label: 'Premium αρωματικό', checked: false, category: 'final' },
];

function getChecklist(washType: WashType): WashChecklistItem[] {
  switch (washType) {
    case 'quick': return QUICK_CHECKLIST.map(c => ({ ...c }));
    case 'standard': return STANDARD_CHECKLIST.map(c => ({ ...c }));
    case 'deep': return DEEP_CHECKLIST.map(c => ({ ...c }));
    case 'vip': return VIP_CHECKLIST.map(c => ({ ...c }));
  }
}

// ─── Store State ─────────────────────────────────────────────

interface WasherState {
  queue: WashRecord[];
  selectedRecordId: string | null;
  filterStatus: WashStatus | 'all';
  filterWashType: WashType | 'all';
  filterPriority: WashRecord['priority'] | 'all';
  viewMode: 'kanban' | 'list';

  // Stats
  todayCompleted: number;
  todayAvgMinutes: number;

  // Actions
  selectRecord: (id: string | null) => void;
  setFilterStatus: (s: WashStatus | 'all') => void;
  setFilterWashType: (t: WashType | 'all') => void;
  setFilterPriority: (p: WashRecord['priority'] | 'all') => void;
  setViewMode: (m: 'kanban' | 'list') => void;

  // Queue management
  addToQueue: (plate: string, category: FleetVehicle['category'], washType: WashType, priority: WashRecord['priority'], requestedBy: string, vehicleId?: string) => string;
  startWash: (recordId: string, washerId: string) => void;
  toggleChecklistItem: (recordId: string, itemId: string) => void;
  completeWash: (recordId: string, notes?: string) => void;
  inspectWash: (recordId: string, inspectorId: string, passed: boolean, notes?: string) => void;
  setDamageFound: (recordId: string, damageFound: boolean, damageNotes?: string) => void;
  removeFromQueue: (recordId: string) => void;
  changePriority: (recordId: string, priority: WashRecord['priority']) => void;
  changeWashType: (recordId: string, washType: WashType) => void;
  reassignWasher: (recordId: string, washerId: string) => void;

  // Photo management
  addBeforePhoto: (recordId: string, dataUrl: string) => void;
  addAfterPhoto: (recordId: string, dataUrl: string) => void;

  // Computed
  getFilteredQueue: () => WashRecord[];
  getQueueByStatus: () => Record<WashStatus, WashRecord[]>;
  getRecord: (id: string) => WashRecord | undefined;
  getWasherActiveJob: (washerId: string) => WashRecord | undefined;
  getQueueStats: () => { waiting: number; inProgress: number; done: number; inspected: number; total: number };
}

// ─── Store ───────────────────────────────────────────────────

export const useWasherStore = create<WasherState>()(
  persist(
    (set, get) => ({
      queue: [],
      selectedRecordId: null,
      filterStatus: 'all',
      filterWashType: 'all',
      filterPriority: 'all',
      viewMode: 'kanban',
      todayCompleted: 0,
      todayAvgMinutes: 0,

      selectRecord: (id) => set({ selectedRecordId: id }),
      setFilterStatus: (s) => set({ filterStatus: s }),
      setFilterWashType: (t) => set({ filterWashType: t }),
      setFilterPriority: (p) => set({ filterPriority: p }),
      setViewMode: (m) => set({ viewMode: m }),

      addToQueue: (plate, category, washType, priority, requestedBy, vehicleId) => {
        const id = `wash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const record: WashRecord = {
          id,
          vehicleId: vehicleId || '',
          plate,
          category,
          washType,
          status: 'waiting',
          priority,
          requestedBy,
          requestedAt: new Date().toISOString(),
          checklist: getChecklist(washType),
          notes: '',
          damageFound: false,
          beforePhotos: [],
          afterPhotos: [],
        };
        set(state => ({ queue: [...state.queue, record] }));
        return id;
      },

      startWash: (recordId, washerId) => {
        set(state => ({
          queue: state.queue.map(r =>
            r.id === recordId
              ? { ...r, status: 'in_progress' as WashStatus, assignedTo: washerId, startedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      toggleChecklistItem: (recordId, itemId) => {
        set(state => ({
          queue: state.queue.map(r =>
            r.id === recordId
              ? { ...r, checklist: r.checklist.map(c => c.id === itemId ? { ...c, checked: !c.checked } : c) }
              : r
          ),
        }));
      },

      completeWash: (recordId, notes) => {
        set(state => {
          const record = state.queue.find(r => r.id === recordId);
          const duration = record?.startedAt
            ? Math.round((Date.now() - new Date(record.startedAt).getTime()) / 60000)
            : undefined;
          return {
            queue: state.queue.map(r =>
              r.id === recordId
                ? { ...r, status: 'done' as WashStatus, completedAt: new Date().toISOString(), duration, notes: notes || r.notes }
                : r
            ),
            todayCompleted: state.todayCompleted + 1,
          };
        });
      },

      inspectWash: (recordId, inspectorId, passed, notes) => {
        set(state => ({
          queue: state.queue.map(r => {
            if (r.id !== recordId) return r;
            if (passed) {
              return {
                ...r,
                status: 'inspected' as WashStatus,
                inspectedBy: inspectorId,
                inspectedAt: new Date().toISOString(),
                notes: notes ? `${r.notes}\n[✅ Επιθεώρηση OK]: ${notes}` : r.notes,
              };
            }
            // Failed: re-queue with reset checklist
            return {
              ...r,
              status: 'waiting' as WashStatus,
              inspectedBy: inspectorId,
              inspectedAt: new Date().toISOString(),
              startedAt: undefined,
              completedAt: undefined,
              assignedTo: undefined,
              duration: undefined,
              checklist: r.checklist.map(c => ({ ...c, checked: false })),
              notes: notes ? `${r.notes}\n[❌ Επιθεώρηση ΑΠΟΤΥΧΙΑ]: ${notes}` : r.notes,
            };
          }),
        }));
      },

      setDamageFound: (recordId, damageFound, damageNotes) => {
        set(state => ({
          queue: state.queue.map(r =>
            r.id === recordId ? { ...r, damageFound, damageNotes: damageNotes || r.damageNotes } : r
          ),
        }));
      },

      removeFromQueue: (recordId) => {
        set(state => ({ queue: state.queue.filter(r => r.id !== recordId) }));
      },

      changePriority: (recordId, priority) => {
        set(state => ({
          queue: state.queue.map(r => r.id === recordId ? { ...r, priority } : r),
        }));
      },

      changeWashType: (recordId, washType) => {
        set(state => ({
          queue: state.queue.map(r =>
            r.id === recordId && r.status === 'waiting'
              ? { ...r, washType, checklist: getChecklist(washType) }
              : r
          ),
        }));
      },

      reassignWasher: (recordId, washerId) => {
        set(state => ({
          queue: state.queue.map(r => r.id === recordId ? { ...r, assignedTo: washerId } : r),
        }));
      },

      addBeforePhoto: (recordId, dataUrl) => {
        set(state => ({
          queue: state.queue.map(r =>
            r.id === recordId ? { ...r, beforePhotos: [...r.beforePhotos, dataUrl] } : r
          ),
        }));
      },

      addAfterPhoto: (recordId, dataUrl) => {
        set(state => ({
          queue: state.queue.map(r =>
            r.id === recordId ? { ...r, afterPhotos: [...r.afterPhotos, dataUrl] } : r
          ),
        }));
      },

      getFilteredQueue: () => {
        const { queue, filterStatus, filterWashType, filterPriority } = get();
        let filtered = [...queue];
        if (filterStatus !== 'all') filtered = filtered.filter(r => r.status === filterStatus);
        if (filterWashType !== 'all') filtered = filtered.filter(r => r.washType === filterWashType);
        if (filterPriority !== 'all') filtered = filtered.filter(r => r.priority === filterPriority);
        // Sort: urgent first, then VIP, then by request time
        return filtered.sort((a, b) => {
          const priOrder = { urgent: 0, vip: 1, normal: 2 };
          const priCmp = priOrder[a.priority] - priOrder[b.priority];
          if (priCmp !== 0) return priCmp;
          return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
        });
      },

      getQueueByStatus: () => {
        const queue = get().getFilteredQueue();
        return {
          waiting: queue.filter(r => r.status === 'waiting'),
          in_progress: queue.filter(r => r.status === 'in_progress'),
          done: queue.filter(r => r.status === 'done'),
          inspected: queue.filter(r => r.status === 'inspected'),
        };
      },

      getRecord: (id) => get().queue.find(r => r.id === id),
      getWasherActiveJob: (washerId) => get().queue.find(r => r.assignedTo === washerId && r.status === 'in_progress'),

      getQueueStats: () => {
        const queue = get().queue;
        return {
          waiting: queue.filter(r => r.status === 'waiting').length,
          inProgress: queue.filter(r => r.status === 'in_progress').length,
          done: queue.filter(r => r.status === 'done').length,
          inspected: queue.filter(r => r.status === 'inspected').length,
          total: queue.length,
        };
      },
    }),
    {
      name: 'station-washer-storage',
      partialize: (state) => ({
        queue: state.queue,
        todayCompleted: state.todayCompleted,
      }),
    }
  )
);
