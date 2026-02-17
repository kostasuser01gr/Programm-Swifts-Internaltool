// ─── Platform-Wide Types ─────────────────────────────────────
// Extends chat types with auth, profiles, fleet, washer, reservations, settings

import type { UserRole, ChatUser } from './chat';

// ─── Authentication ──────────────────────────────────────────

export interface AuthCredentials {
  userId: string;
  pin: string;
}

export interface AuthSession {
  userId: string;
  loginAt: string;
  deviceId: string;
  expiresAt: string;
  isKiosk: boolean;
}

export interface LoginAttempt {
  userId: string;
  timestamp: string;
  success: boolean;
  deviceId: string;
}

// ─── User Profile (extends ChatUser) ─────────────────────────

export interface UserProfile extends ChatUser {
  pin: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  skills: string[];
  certifications: string[];
  languages: string[];
  emergencyContact?: string;
  customStatus?: string;
  customStatusEmoji?: string;
  customStatusExpiry?: string;
  preferences: UserPreferences;
  stats: UserStats;
  isActive: boolean;
  isSuspended: boolean;
  suspendedReason?: string;
  suspendedBy?: string;
  notes: SupervisorNote[];      // private supervisor notes on employee
  shortcuts: UserShortcut[];
}

export interface UserPreferences {
  language: 'el' | 'en';
  theme: 'dark' | 'light' | 'auto';
  notificationsEnabled: boolean;
  notificationSound: boolean;
  notificationChannels: Record<string, 'all' | 'mentions' | 'none'>;
  quietHoursEnabled: boolean;
  quietHoursStart: string;      // "22:00"
  quietHoursEnd: string;        // "06:00"
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  showAvatars: boolean;
  autoStatus: boolean;          // auto-set status by shift
  defaultView: 'chat' | 'schedule' | 'fleet' | 'washer';
  hapticFeedback: boolean;
  voiceCommandsEnabled: boolean;
  quickActions: string[];       // IDs of pinned quick actions
}

export interface UserStats {
  messagesSent: number;
  messagesThisMonth: number;
  avgResponseTimeMs: number;
  shiftsWorked: number;
  shiftsThisMonth: number;
  vehiclesWashed?: number;       // only for washers
  loginCount: number;
  lastLoginAt: string;
}

export interface SupervisorNote {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  category: 'performance' | 'incident' | 'praise' | 'general';
}

export interface UserShortcut {
  id: string;
  label: string;
  action: string;               // action identifier
  icon: string;
  order: number;
}

// ─── Fleet Notes & Photos ────────────────────────────────────

export interface FleetVehicle {
  id: string;
  plate: string;
  brand: string;                // "Renault", "Seat", "VW"
  model: string;                // "Clio", "Ibiza", "Polo"
  category: 'economy' | 'compact' | 'sedan' | 'suv' | 'van' | 'premium';
  color: string;
  year: number;
  company: 'GoldCar' | 'Europcar' | 'Both';
  status: 'available' | 'rented' | 'in_wash' | 'maintenance' | 'damaged' | 'out_of_service';
  currentLocation: string;
  fuelLevel: number;            // 0-100
  mileage: number;
  lastService: string;
  nextService: string;
  notes: FleetNote[];
  photos: FleetPhoto[];
  damageReports: DamageReport[];
  washHistory: WashRecord[];
}

export interface FleetNote {
  id: string;
  vehicleId: string;
  authorId: string;
  content: string;
  timestamp: string;
  category: 'general' | 'maintenance' | 'issue' | 'handover' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  attachments: string[];         // photo IDs
}

export interface FleetPhoto {
  id: string;
  vehicleId: string;
  authorId: string;
  dataUrl: string;               // base64 encoded
  caption: string;
  timestamp: string;
  category: 'general' | 'damage' | 'before_wash' | 'after_wash' | 'inspection' | 'delivery' | 'return';
  tags: string[];
}

export interface DamageReport {
  id: string;
  vehicleId: string;
  reportedBy: string;
  timestamp: string;
  location: string;              // "front_left", "rear_right", etc.
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  photos: string[];              // photo IDs
  status: 'reported' | 'inspected' | 'repair_scheduled' | 'repaired';
  repairCost?: number;
  resolvedBy?: string;
  resolvedAt?: string;
}

// ─── Vehicle Washing ─────────────────────────────────────────

export type WashStatus = 'waiting' | 'in_progress' | 'done' | 'inspected';
export type WashType = 'quick' | 'standard' | 'deep' | 'vip';

export interface WashRecord {
  id: string;
  vehicleId: string;
  plate: string;
  category: FleetVehicle['category'];
  washType: WashType;
  status: WashStatus;
  priority: 'normal' | 'urgent' | 'vip';
  assignedTo?: string;           // washer user ID
  requestedBy: string;           // who added to queue
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  inspectedBy?: string;
  inspectedAt?: string;
  duration?: number;             // minutes
  checklist: WashChecklistItem[];
  notes: string;
  damageFound: boolean;
  damageNotes?: string;
  beforePhotos: string[];
  afterPhotos: string[];
}

export interface WashChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: 'exterior' | 'interior' | 'final';
}

// ─── Reservations ────────────────────────────────────────────

export interface Reservation {
  id: string;
  reservationCode: string;       // e.g. "R-48291"
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  company: 'GoldCar' | 'Europcar';
  vehicleCategory: FleetVehicle['category'];
  assignedPlate?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  pickupLocation: string;
  returnLocation: string;
  status: 'confirmed' | 'checked_in' | 'active' | 'returned' | 'cancelled' | 'no_show';
  extras: string[];              // "GPS", "child seat", "full insurance"
  notes: string;
  createdAt: string;
  updatedAt: string;
  importedFrom?: string;         // filename if imported
  importedAt?: string;
}

export interface ReservationImport {
  id: string;
  fileName: string;
  fileType: string;
  importedBy: string;
  importedAt: string;
  recordCount: number;
  status: 'pending' | 'mapped' | 'imported' | 'failed';
  mappings: ColumnMapping[];
  errors: string[];
  rawData: Record<string, string>[];
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: keyof Reservation | 'ignore';
  confidence: number;            // 0-1 auto-mapping confidence
  isManual: boolean;
}

// ─── Natural Language Commands ───────────────────────────────

export interface NLCommand {
  id: string;
  input: string;
  parsedIntent: string;
  parsedEntities: Record<string, string>;
  action: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'confirmed' | 'executed' | 'failed' | 'cancelled';
  result?: string;
  executedBy: string;
  timestamp: string;
}

// ─── Voice Commands ──────────────────────────────────────────

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  language: 'el-GR' | 'en-US';
}

// ─── Settings ────────────────────────────────────────────────

export interface PlatformSettings {
  stationName: string;
  stationCode: string;
  timezone: string;
  defaultLanguage: 'el' | 'en';
  themeMode: 'dark' | 'light' | 'system';
  shifts: ShiftConfig[];
  companies: string[];
  vehicleCategories: string[];
  washTypes: WashTypeConfig[];
  autoLogoutMinutes: number;
  kioskAutoLogoutMinutes: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  messageRetentionDays: number;
  enableVoiceCommands: boolean;
  enableFileUpload: boolean;
  maxFileSizeMB: number;
  allowedFileTypes: string[];
  enablePushNotifications: boolean;
  maintenanceMode: boolean;
}

export interface ShiftConfig {
  id: string;
  name: string;
  code: string;                  // "Π", "Α", "Ν"
  startTime: string;             // "06:00"
  endTime: string;               // "14:00"
  color: string;
}

export interface WashTypeConfig {
  id: string;
  name: string;
  code: WashType;
  estimatedMinutes: number;
  checklist: string[];
  color: string;
}

// ─── Audit Log ───────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  target: string;
  targetId: string;
  details: string;
  timestamp: string;
  category: 'auth' | 'user' | 'channel' | 'message' | 'fleet' | 'wash' | 'reservation' | 'settings';
}

// ─── Quick Actions ───────────────────────────────────────────

export interface QuickAction {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  category: 'communication' | 'fleet' | 'wash' | 'schedule' | 'navigation';
  action: string;
  availableFor: UserRole[];
  isDefault: boolean;
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-1',  label: 'Νέο μήνυμα',         labelEn: 'New message',     icon: '✉️',  category: 'communication', action: 'open_chat',          availableFor: ['coordinator','supervisor','fleet_supervisor','head_rep','employee','viewer'], isDefault: true },
  { id: 'qa-2',  label: 'Αλλαγή βάρδιας',      labelEn: 'Change shift',    icon: '🔄',  category: 'schedule',      action: 'request_shift_swap', availableFor: ['coordinator','supervisor','fleet_supervisor','head_rep','employee'], isDefault: true },
  { id: 'qa-3',  label: 'Αναφορά ζημιάς',      labelEn: 'Report damage',   icon: '🔴',  category: 'fleet',         action: 'report_damage',      availableFor: ['coordinator','supervisor','fleet_supervisor','head_rep','employee'], isDefault: true },
  { id: 'qa-4',  label: 'Στείλε στα πλυντήρια', labelEn: 'Send to wash',   icon: '🚿',  category: 'wash',          action: 'add_to_wash_queue',  availableFor: ['coordinator','supervisor','fleet_supervisor'], isDefault: true },
  { id: 'qa-5',  label: 'Κατάσταση μου',        labelEn: 'My status',       icon: '📍',  category: 'communication', action: 'change_status',      availableFor: ['coordinator','supervisor','fleet_supervisor','head_rep','employee'], isDefault: true },
  { id: 'qa-6',  label: 'Αναζήτηση πινακίδας',  labelEn: 'Search plate',    icon: '🔍',  category: 'fleet',         action: 'search_plate',       availableFor: ['coordinator','supervisor','fleet_supervisor','head_rep','employee'], isDefault: true },
  { id: 'qa-7',  label: 'Σημείωση στόλου',      labelEn: 'Fleet note',      icon: '📝',  category: 'fleet',         action: 'add_fleet_note',     availableFor: ['coordinator','supervisor','fleet_supervisor'], isDefault: true },
  { id: 'qa-8',  label: 'Αυτοκίνητο έτοιμο',   labelEn: 'Car ready',       icon: '✅',  category: 'wash',          action: 'car_ready',          availableFor: ['coordinator','supervisor','fleet_supervisor','employee'], isDefault: true },
  { id: 'qa-9',  label: 'Έκτακτο',             labelEn: 'Emergency',       icon: '🚨',  category: 'communication', action: 'send_urgent',        availableFor: ['coordinator','supervisor','fleet_supervisor','head_rep','employee'], isDefault: true },
  { id: 'qa-10', label: 'Φωτογραφία',          labelEn: 'Take photo',      icon: '📸',  category: 'fleet',         action: 'take_photo',         availableFor: ['coordinator','supervisor','fleet_supervisor','head_rep','employee'], isDefault: true },
];
