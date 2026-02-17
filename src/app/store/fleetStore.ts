import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FleetVehicle, FleetNote, FleetPhoto, DamageReport } from '../types/platform';

// ─── Sample Fleet Data ───────────────────────────────────────

const SAMPLE_VEHICLES: FleetVehicle[] = [
  {
    id: 'v-1', plate: 'ΗΡΑ-4521', brand: 'Renault', model: 'Clio', category: 'economy', color: 'Λευκό', year: 2024,
    company: 'GoldCar', status: 'available', currentLocation: 'Parking A', fuelLevel: 85, mileage: 12430,
    lastService: '2025-05-01', nextService: '2025-08-01', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-2', plate: 'ΗΡΑ-7832', brand: 'Seat', model: 'Ibiza', category: 'economy', color: 'Μαύρο', year: 2023,
    company: 'Europcar', status: 'rented', currentLocation: 'Πελάτης', fuelLevel: 60, mileage: 28910,
    lastService: '2025-04-15', nextService: '2025-07-15', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-3', plate: 'ΗΡΑ-1193', brand: 'VW', model: 'Polo', category: 'compact', color: 'Ασημί', year: 2024,
    company: 'GoldCar', status: 'in_wash', currentLocation: 'Πλυντήριο', fuelLevel: 70, mileage: 8750,
    lastService: '2025-06-01', nextService: '2025-09-01', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-4', plate: 'ΗΡΑ-9045', brand: 'Toyota', model: 'Yaris', category: 'economy', color: 'Κόκκινο', year: 2023,
    company: 'Europcar', status: 'available', currentLocation: 'Parking B', fuelLevel: 95, mileage: 35200,
    lastService: '2025-03-20', nextService: '2025-06-20', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-5', plate: 'ΗΡΑ-2287', brand: 'Renault', model: 'Captur', category: 'suv', color: 'Μπλε', year: 2024,
    company: 'GoldCar', status: 'available', currentLocation: 'Parking A', fuelLevel: 90, mileage: 5600,
    lastService: '2025-05-15', nextService: '2025-08-15', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-6', plate: 'ΗΡΑ-3378', brand: 'Fiat', model: '500', category: 'economy', color: 'Κίτρινο', year: 2022,
    company: 'Europcar', status: 'maintenance', currentLocation: 'Συνεργείο', fuelLevel: 30, mileage: 48100,
    lastService: '2025-01-10', nextService: '2025-04-10', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-7', plate: 'ΗΡΑ-5561', brand: 'VW', model: 'T-Cross', category: 'suv', color: 'Λευκό', year: 2024,
    company: 'GoldCar', status: 'rented', currentLocation: 'Πελάτης', fuelLevel: 50, mileage: 11200,
    lastService: '2025-06-10', nextService: '2025-09-10', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-8', plate: 'ΗΡΑ-6694', brand: 'Seat', model: 'Leon', category: 'compact', color: 'Γκρι', year: 2023,
    company: 'Europcar', status: 'damaged', currentLocation: 'Parking C', fuelLevel: 40, mileage: 31400,
    lastService: '2025-02-20', nextService: '2025-05-20', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-9', plate: 'ΗΡΑ-8812', brand: 'Renault', model: 'Megane', category: 'sedan', color: 'Μαύρο', year: 2024,
    company: 'GoldCar', status: 'available', currentLocation: 'Parking A', fuelLevel: 100, mileage: 3200,
    lastService: '2025-06-15', nextService: '2025-09-15', notes: [], photos: [], damageReports: [], washHistory: [],
  },
  {
    id: 'v-10', plate: 'ΗΡΑ-7720', brand: 'Toyota', model: 'RAV4', category: 'suv', color: 'Σκούρο Γκρι', year: 2024,
    company: 'Both', status: 'available', currentLocation: 'Parking B', fuelLevel: 80, mileage: 7800,
    lastService: '2025-05-25', nextService: '2025-08-25', notes: [], photos: [], damageReports: [], washHistory: [],
  },
];

// ─── Status Transition Rules (state machine) ────────────────
const VALID_TRANSITIONS: Record<FleetVehicle['status'], FleetVehicle['status'][]> = {
  available:      ['rented', 'in_wash', 'maintenance', 'out_of_service'],
  rented:         ['available', 'damaged', 'maintenance'],
  in_wash:        ['available', 'damaged'],
  maintenance:    ['available', 'out_of_service'],
  damaged:        ['maintenance', 'out_of_service'],
  out_of_service: ['available', 'maintenance'],
};

// ─── Store State ─────────────────────────────────────────────

interface FleetState {
  vehicles: FleetVehicle[];
  selectedVehicleId: string | null;
  searchQuery: string;
  filterStatus: FleetVehicle['status'] | 'all';
  filterCompany: FleetVehicle['company'] | 'all';
  filterCategory: FleetVehicle['category'] | 'all';
  sortBy: 'plate' | 'brand' | 'status' | 'lastService';
  sortOrder: 'asc' | 'desc';

  // Actions
  selectVehicle: (id: string | null) => void;
  setSearch: (q: string) => void;
  setFilterStatus: (s: FleetVehicle['status'] | 'all') => void;
  setFilterCompany: (c: FleetVehicle['company'] | 'all') => void;
  setFilterCategory: (c: FleetVehicle['category'] | 'all') => void;
  setSortBy: (s: FleetState['sortBy']) => void;
  toggleSortOrder: () => void;

  // Vehicle CRUD
  addVehicle: (vehicle: Omit<FleetVehicle, 'id' | 'notes' | 'photos' | 'damageReports' | 'washHistory'>) => void;
  updateVehicle: (id: string, updates: Partial<FleetVehicle>) => void;
  updateVehicleStatus: (id: string, status: FleetVehicle['status']) => boolean;
  updateFuelLevel: (id: string, fuelLevel: number) => void;
  updateMileage: (id: string, mileage: number) => void;
  canTransitionTo: (id: string, status: FleetVehicle['status']) => boolean;
  getValidTransitions: (id: string) => FleetVehicle['status'][];

  // Notes
  addNote: (vehicleId: string, note: Omit<FleetNote, 'id' | 'vehicleId' | 'timestamp' | 'isResolved'>) => void;
  resolveNote: (vehicleId: string, noteId: string, resolvedBy: string) => void;

  // Photos
  addPhoto: (vehicleId: string, photo: Omit<FleetPhoto, 'id' | 'vehicleId' | 'timestamp'>) => void;
  removePhoto: (vehicleId: string, photoId: string) => void;

  // Damage
  addDamageReport: (vehicleId: string, report: Omit<DamageReport, 'id' | 'vehicleId' | 'timestamp' | 'status'>) => void;
  updateDamageStatus: (vehicleId: string, reportId: string, status: DamageReport['status'], resolvedBy?: string) => void;

  // Computed
  getFilteredVehicles: () => FleetVehicle[];
  getSelectedVehicle: () => FleetVehicle | undefined;
  getVehicleByPlate: (plate: string) => FleetVehicle | undefined;
  getVehicleStats: () => { total: number; available: number; rented: number; inWash: number; maintenance: number; damaged: number };
  getVehiclesNeedingService: () => FleetVehicle[];
  getLowFuelVehicles: (threshold?: number) => FleetVehicle[];
}

// ─── Store ───────────────────────────────────────────────────

export const useFleetStore = create<FleetState>()(
  persist(
    (set, get) => ({
      vehicles: SAMPLE_VEHICLES,
      selectedVehicleId: null,
      searchQuery: '',
      filterStatus: 'all',
      filterCompany: 'all',
      filterCategory: 'all',
      sortBy: 'plate',
      sortOrder: 'asc',

      selectVehicle: (id) => set({ selectedVehicleId: id }),
      setSearch: (q) => set({ searchQuery: q }),
      setFilterStatus: (s) => set({ filterStatus: s }),
      setFilterCompany: (c) => set({ filterCompany: c }),
      setFilterCategory: (c) => set({ filterCategory: c }),
      setSortBy: (s) => set({ sortBy: s }),
      toggleSortOrder: () => set(st => ({ sortOrder: st.sortOrder === 'asc' ? 'desc' : 'asc' })),

      addVehicle: (vehicle) => {
        const newVehicle: FleetVehicle = {
          ...vehicle,
          id: `v-${Date.now()}`,
          notes: [],
          photos: [],
          damageReports: [],
          washHistory: [],
        };
        set(state => ({ vehicles: [...state.vehicles, newVehicle] }));
      },

      updateVehicle: (id, updates) => {
        set(state => ({
          vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...updates } : v),
        }));
      },

      updateVehicleStatus: (id, status) => {
        const vehicle = get().vehicles.find(v => v.id === id);
        if (!vehicle) return false;
        const allowed = VALID_TRANSITIONS[vehicle.status] || [];
        if (!allowed.includes(status)) return false;
        set(state => ({
          vehicles: state.vehicles.map(v => v.id === id ? { ...v, status } : v),
        }));
        return true;
      },

      updateFuelLevel: (id, fuelLevel) => {
        const clamped = Math.max(0, Math.min(100, fuelLevel));
        set(state => ({
          vehicles: state.vehicles.map(v => v.id === id ? { ...v, fuelLevel: clamped } : v),
        }));
      },

      updateMileage: (id, mileage) => {
        const vehicle = get().vehicles.find(v => v.id === id);
        if (!vehicle || mileage < vehicle.mileage) return; // Mileage can only increase
        set(state => ({
          vehicles: state.vehicles.map(v => v.id === id ? { ...v, mileage } : v),
        }));
      },

      canTransitionTo: (id, status) => {
        const vehicle = get().vehicles.find(v => v.id === id);
        if (!vehicle) return false;
        return (VALID_TRANSITIONS[vehicle.status] || []).includes(status);
      },

      getValidTransitions: (id) => {
        const vehicle = get().vehicles.find(v => v.id === id);
        if (!vehicle) return [];
        return VALID_TRANSITIONS[vehicle.status] || [];
      },

      addNote: (vehicleId, noteData) => {
        const note: FleetNote = {
          ...noteData,
          id: `fn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          vehicleId,
          timestamp: new Date().toISOString(),
          isResolved: false,
        };
        set(state => ({
          vehicles: state.vehicles.map(v =>
            v.id === vehicleId ? { ...v, notes: [note, ...v.notes] } : v
          ),
        }));
      },

      resolveNote: (vehicleId, noteId, resolvedBy) => {
        set(state => ({
          vehicles: state.vehicles.map(v =>
            v.id === vehicleId
              ? {
                  ...v,
                  notes: v.notes.map(n =>
                    n.id === noteId ? { ...n, isResolved: true, resolvedBy, resolvedAt: new Date().toISOString() } : n
                  ),
                }
              : v
          ),
        }));
      },

      addPhoto: (vehicleId, photoData) => {
        const photo: FleetPhoto = {
          ...photoData,
          id: `fp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          vehicleId,
          timestamp: new Date().toISOString(),
        };
        set(state => ({
          vehicles: state.vehicles.map(v =>
            v.id === vehicleId ? { ...v, photos: [photo, ...v.photos] } : v
          ),
        }));
      },

      removePhoto: (vehicleId, photoId) => {
        set(state => ({
          vehicles: state.vehicles.map(v =>
            v.id === vehicleId ? { ...v, photos: v.photos.filter(p => p.id !== photoId) } : v
          ),
        }));
      },

      addDamageReport: (vehicleId, reportData) => {
        const report: DamageReport = {
          ...reportData,
          id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          vehicleId,
          timestamp: new Date().toISOString(),
          status: 'reported',
        };
        set(state => ({
          vehicles: state.vehicles.map(v =>
            v.id === vehicleId
              ? { ...v, damageReports: [report, ...v.damageReports], status: 'damaged' as const }
              : v
          ),
        }));
      },

      updateDamageStatus: (vehicleId, reportId, status, resolvedBy) => {
        set(state => ({
          vehicles: state.vehicles.map(v =>
            v.id === vehicleId
              ? {
                  ...v,
                  damageReports: v.damageReports.map(d =>
                    d.id === reportId
                      ? { ...d, status, ...(resolvedBy ? { resolvedBy, resolvedAt: new Date().toISOString() } : {}) }
                      : d
                  ),
                }
              : v
          ),
        }));
      },

      getFilteredVehicles: () => {
        const { vehicles, searchQuery, filterStatus, filterCompany, filterCategory, sortBy, sortOrder } = get();
        let filtered = [...vehicles];

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(v =>
            v.plate.toLowerCase().includes(q) ||
            v.brand.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q)
          );
        }
        if (filterStatus !== 'all') filtered = filtered.filter(v => v.status === filterStatus);
        if (filterCompany !== 'all') filtered = filtered.filter(v => v.company === filterCompany || v.company === 'Both');
        if (filterCategory !== 'all') filtered = filtered.filter(v => v.category === filterCategory);

        filtered.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          const cmp = String(aVal).localeCompare(String(bVal), 'el');
          return sortOrder === 'asc' ? cmp : -cmp;
        });

        return filtered;
      },

      getSelectedVehicle: () => {
        const { vehicles, selectedVehicleId } = get();
        return vehicles.find(v => v.id === selectedVehicleId);
      },

      getVehicleByPlate: (plate) => get().vehicles.find(v => v.plate === plate),

      getVehicleStats: () => {
        const vehicles = get().vehicles;
        return {
          total: vehicles.length,
          available: vehicles.filter(v => v.status === 'available').length,
          rented: vehicles.filter(v => v.status === 'rented').length,
          inWash: vehicles.filter(v => v.status === 'in_wash').length,
          maintenance: vehicles.filter(v => v.status === 'maintenance').length,
          damaged: vehicles.filter(v => v.status === 'damaged').length,
        };
      },

      getVehiclesNeedingService: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().vehicles.filter(v =>
          v.nextService && v.nextService <= today && v.status !== 'out_of_service'
        );
      },

      getLowFuelVehicles: (threshold = 25) => {
        return get().vehicles.filter(v =>
          v.fuelLevel <= threshold && v.status === 'available'
        );
      },
    }),
    {
      name: 'station-fleet-storage',
      partialize: (state) => ({
        vehicles: state.vehicles,
      }),
    }
  )
);
