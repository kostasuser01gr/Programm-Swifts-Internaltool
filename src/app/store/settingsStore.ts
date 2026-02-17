import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlatformSettings, ShiftConfig, WashTypeConfig } from '../types/platform';

// ─── Default Configuration ───────────────────────────────────

const DEFAULT_SHIFTS: ShiftConfig[] = [
  { id: 'shift-p', name: 'Πρωινή',    code: 'Π', startTime: '06:00', endTime: '14:00', color: '#3b82f6' },
  { id: 'shift-a', name: 'Απογευματινή', code: 'Α', startTime: '14:00', endTime: '22:00', color: '#f59e0b' },
  { id: 'shift-n', name: 'Νυχτερινή',  code: 'Ν', startTime: '22:00', endTime: '06:00', color: '#6366f1' },
];

const DEFAULT_WASH_TYPES: WashTypeConfig[] = [
  { id: 'wt-quick',    name: 'Γρήγορο',   code: 'quick',    estimatedMinutes: 15, color: '#22c55e', checklist: ['Εξωτερικό πλύσιμο', 'Στέγνωμα', 'Παράθυρα', 'Σκούπισμα εσωτερικού', 'Ταμπλό'] },
  { id: 'wt-standard', name: 'Κανονικό',  code: 'standard', estimatedMinutes: 30, color: '#3b82f6', checklist: ['Εξωτερικό πλύσιμο', 'Στέγνωμα', 'Ζάντες', 'Ελαστικά', 'Ηλεκτρική σκούπα', 'Πατάκια', 'Πορτ μπαγκάζ', 'Αρωματικό'] },
  { id: 'wt-deep',     name: 'Βαθύ',      code: 'deep',     estimatedMinutes: 60, color: '#f59e0b', checklist: ['Εξωτερικό πλύσιμο', 'Κέρωμα', 'Ζάντες', 'Κινητήρας', 'Δερμάτινα', 'Αεραγωγοί', 'Απολύμανση'] },
  { id: 'wt-vip',      name: 'VIP',       code: 'vip',      estimatedMinutes: 90, color: '#a855f7', checklist: ['Όλα τα παραπάνω', 'Χρώμια', 'Paint sealant', 'Οζονοποίηση', 'Premium αρωματικό'] },
];

const DEFAULT_SETTINGS: PlatformSettings = {
  stationName: 'Σταθμός Ηράκλειο',
  stationCode: 'HER',
  timezone: 'Europe/Athens',
  defaultLanguage: 'el',
  themeMode: 'dark',
  shifts: DEFAULT_SHIFTS,
  companies: ['GoldCar', 'Europcar'],
  vehicleCategories: ['economy', 'compact', 'sedan', 'suv', 'van', 'premium'],
  washTypes: DEFAULT_WASH_TYPES,
  autoLogoutMinutes: 480,
  kioskAutoLogoutMinutes: 5,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  messageRetentionDays: 90,
  enableVoiceCommands: true,
  enableFileUpload: true,
  maxFileSizeMB: 10,
  allowedFileTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.xlsx', '.csv'],
  enablePushNotifications: true,
  maintenanceMode: false,
};

// ─── Store State ─────────────────────────────────────────────

interface SettingsState {
  settings: PlatformSettings;
  isDirty: boolean;
  activeSection: string;

  // Actions
  updateSettings: (updates: Partial<PlatformSettings>) => void;
  resetSettings: () => void;
  setActiveSection: (section: string) => void;

  // Shift management
  addShift: (shift: ShiftConfig) => void;
  updateShift: (id: string, updates: Partial<ShiftConfig>) => void;
  removeShift: (id: string) => void;

  // Wash type management
  addWashType: (washType: WashTypeConfig) => void;
  updateWashType: (id: string, updates: Partial<WashTypeConfig>) => void;
  removeWashType: (id: string) => void;

  // Helpers
  getShiftByCode: (code: string) => ShiftConfig | undefined;
  getCurrentShift: () => ShiftConfig | undefined;
}

// ─── Store ───────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isDirty: false,
      activeSection: 'general',

      updateSettings: (updates) => {
        set(state => ({
          settings: { ...state.settings, ...updates },
          isDirty: true,
        }));
      },

      resetSettings: () => set({ settings: DEFAULT_SETTINGS, isDirty: false }),
      setActiveSection: (section) => set({ activeSection: section }),

      addShift: (shift) => {
        set(state => ({
          settings: { ...state.settings, shifts: [...state.settings.shifts, shift] },
          isDirty: true,
        }));
      },

      updateShift: (id, updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            shifts: state.settings.shifts.map(s => s.id === id ? { ...s, ...updates } : s),
          },
          isDirty: true,
        }));
      },

      removeShift: (id) => {
        set(state => ({
          settings: {
            ...state.settings,
            shifts: state.settings.shifts.filter(s => s.id !== id),
          },
          isDirty: true,
        }));
      },

      addWashType: (washType) => {
        set(state => ({
          settings: { ...state.settings, washTypes: [...state.settings.washTypes, washType] },
          isDirty: true,
        }));
      },

      updateWashType: (id, updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            washTypes: state.settings.washTypes.map(w => w.id === id ? { ...w, ...updates } : w),
          },
          isDirty: true,
        }));
      },

      removeWashType: (id) => {
        set(state => ({
          settings: {
            ...state.settings,
            washTypes: state.settings.washTypes.filter(w => w.id !== id),
          },
          isDirty: true,
        }));
      },

      getShiftByCode: (code) => get().settings.shifts.find(s => s.code === code),

      getCurrentShift: () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentMinutes = hours * 60 + minutes;

        return get().settings.shifts.find(shift => {
          const [sh, sm] = shift.startTime.split(':').map(Number);
          const [eh, em] = shift.endTime.split(':').map(Number);
          const start = sh * 60 + sm;
          const end = eh * 60 + em;

          if (start < end) {
            return currentMinutes >= start && currentMinutes < end;
          } else {
            // Night shift wraps around midnight
            return currentMinutes >= start || currentMinutes < end;
          }
        });
      },
    }),
    {
      name: 'station-settings-storage',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
