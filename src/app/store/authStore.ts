import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, LoginAttempt, UserProfile, UserPreferences, AuditEntry } from '../types/platform';
import type { ChatUser, UserRole } from '../types/chat';
import { CHAT_USERS } from '../data/chatData';
import { hashPin, verifyPin, generateDeviceId, generateSessionToken } from '../utils/crypto';

// ─── Default Preferences ────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'el',
  theme: 'dark',
  notificationsEnabled: true,
  notificationSound: true,
  notificationChannels: {},
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
  compactMode: false,
  fontSize: 'medium',
  showAvatars: true,
  autoStatus: true,
  defaultView: 'chat',
  hapticFeedback: true,
  voiceCommandsEnabled: false,
  quickActions: ['qa-1', 'qa-3', 'qa-6', 'qa-9'],
};

// ─── Build profiles from chat users ─────────────────────────

const DEFAULT_PIN = '1234';

function buildProfile(user: ChatUser): UserProfile {
  return {
    ...user,
    pin: DEFAULT_PIN, // Will be hashed on first login or pin change
    skills: [],
    certifications: [],
    languages: ['el'],
    preferences: { ...DEFAULT_PREFERENCES },
    stats: {
      messagesSent: 0,
      messagesThisMonth: 0,
      avgResponseTimeMs: 0,
      shiftsWorked: 0,
      shiftsThisMonth: 0,
      loginCount: 0,
      lastLoginAt: '',
    },
    isActive: true,
    isSuspended: false,
    notes: [],
    shortcuts: [],
  };
}

const ALL_PROFILES: UserProfile[] = CHAT_USERS.map(buildProfile);

// ─── Store State ─────────────────────────────────────────────

interface AuthState {
  // Session
  session: AuthSession | null;
  currentProfile: UserProfile | null;
  profiles: UserProfile[];
  isAuthenticated: boolean;
  isLoggingIn: boolean;

  // Login tracking
  loginAttempts: LoginAttempt[];
  lockedUsers: Record<string, string>; // userId -> lockout expiry ISO

  // Session expiry
  sessionExpiryTimer: ReturnType<typeof setTimeout> | null;

  // Audit
  auditLog: AuditEntry[];

  // Actions (async for crypto)
  signup: (name: string, pin: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  login: (userId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginByName: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickSwitch: (userId: string) => void;

  // Profile management
  updateProfile: (userId: string, updates: Partial<UserProfile>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  changePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  resetPin: (targetUserId: string) => Promise<void>;
  suspendUser: (targetUserId: string, reason: string) => void;
  unsuspendUser: (targetUserId: string) => void;

  // Helpers
  getProfile: (userId: string) => UserProfile | undefined;
  isLocked: (userId: string) => boolean;
  checkSessionExpiry: () => boolean;

  // Audit
  addAuditEntry: (action: string, target: string, targetId: string, details: string, category: AuditEntry['category']) => void;
}

// ─── Constants ───────────────────────────────────────────────

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_HOURS = 12;

// ─── Store ───────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      currentProfile: null,
      profiles: ALL_PROFILES,
      isAuthenticated: false,
      isLoggingIn: false,
      loginAttempts: [],
      lockedUsers: {},
      sessionExpiryTimer: null,
      auditLog: [],

      signup: async (name, pin, role = 'employee') => {
        const state = get();
        const trimmed = name.trim();

        if (!trimmed || trimmed.length < 2) {
          return { success: false, error: 'Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.' };
        }
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          return { success: false, error: 'Το PIN πρέπει να είναι 4 ψηφία.' };
        }

        // Check duplicate name (case-insensitive)
        const exists = state.profiles.some(
          p => p.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) {
          return { success: false, error: 'Αυτό το όνομα χρησιμοποιείται ήδη.' };
        }

        // Weak PIN rejection
        const WEAK_PINS = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '3210', '1010', '2580'];
        if (WEAK_PINS.includes(pin)) {
          return { success: false, error: 'Αυτό το PIN είναι πολύ αδύναμο.' };
        }

        const hashedPin = await hashPin(pin);
        const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        // Generate avatar from initials
        const nameParts = trimmed.split(' ');
        const initials = nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : trimmed.slice(0, 2).toUpperCase();

        const newProfile: UserProfile = {
          id: userId,
          name: trimmed,
          role,
          avatar: initials,
          status: 'online',
          group: 'ΟΜΑΔΑ Α',
          position: role === 'employee' ? 'Υπάλληλος' : role,
          lastSeen: new Date().toISOString(),
          pin: hashedPin,
          skills: [],
          certifications: [],
          languages: ['el'],
          preferences: { ...DEFAULT_PREFERENCES },
          stats: {
            messagesSent: 0,
            messagesThisMonth: 0,
            avgResponseTimeMs: 0,
            shiftsWorked: 0,
            shiftsThisMonth: 0,
            loginCount: 1,
            lastLoginAt: new Date().toISOString(),
          },
          isActive: true,
          isSuspended: false,
          notes: [],
          shortcuts: [],
        };

        // Create session
        const deviceId = generateDeviceId();
        const session: AuthSession = {
          userId,
          loginAt: new Date().toISOString(),
          deviceId,
          expiresAt: new Date(Date.now() + SESSION_HOURS * 3600000).toISOString(),
          isKiosk: false,
        };

        const updatedProfiles = [...state.profiles, newProfile];

        set({
          profiles: updatedProfiles,
          session,
          currentProfile: newProfile,
          isAuthenticated: true,
        });

        get().addAuditEntry('signup', 'user', userId, `${trimmed} signed up`, 'auth');
        return { success: true };
      },

      loginByName: async (name, pin) => {
        const state = get();
        const trimmed = name.trim().toLowerCase();
        const profile = state.profiles.find(
          p => p.name.toLowerCase() === trimmed && p.isActive && !p.isSuspended
        );
        if (!profile) {
          return { success: false, error: 'Χρήστης δεν βρέθηκε. Ελέγξτε το όνομα ή εγγραφείτε.' };
        }
        return get().login(profile.id, pin);
      },

      login: async (userId, pin) => {
        const state = get();
        if (state.isLoggingIn) return { success: false, error: 'Σύνδεση σε εξέλιξη...' };

        set({ isLoggingIn: true });

        try {
          // Check lockout
          if (state.isLocked(userId)) {
            return { success: false, error: 'Ο λογαριασμός είναι κλειδωμένος. Δοκιμάστε αργότερα.' };
          }

          const profile = state.profiles.find(p => p.id === userId);
          if (!profile) {
            return { success: false, error: 'Χρήστης δεν βρέθηκε.' };
          }

          if (profile.isSuspended) {
            return { success: false, error: 'Ο λογαριασμός έχει ανασταλεί.' };
          }

          // Verify PIN (supports both hashed and plain-text migration)
          const pinValid = await verifyPin(pin, profile.pin);

          const deviceId = generateDeviceId();
          const attempt: LoginAttempt = {
            userId,
            timestamp: new Date().toISOString(),
            success: pinValid,
            deviceId,
          };

          if (!pinValid) {
            const recentAttempts = [...state.loginAttempts, attempt]
              .filter(a => a.userId === userId && !a.success)
              .filter(a => Date.now() - new Date(a.timestamp).getTime() < LOCKOUT_MINUTES * 60 * 1000);

            const newLockedUsers = { ...state.lockedUsers };
            if (recentAttempts.length >= MAX_ATTEMPTS) {
              newLockedUsers[userId] = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
            }

            set({
              loginAttempts: [...state.loginAttempts, attempt],
              lockedUsers: newLockedUsers,
            });

            get().addAuditEntry('login_failed', 'user', userId, `Failed login for ${profile.name}`, 'auth');
            return { success: false, error: `Λάθος PIN. ${MAX_ATTEMPTS - recentAttempts.length} προσπάθειες απομένουν.` };
          }

          // On successful login, hash PIN if it's still plain‑text (migration)
          let updatedPin = profile.pin;
          if (!profile.pin.includes(':')) {
            updatedPin = await hashPin(pin);
          }

          // Success
          const session: AuthSession = {
            userId,
            loginAt: new Date().toISOString(),
            deviceId,
            expiresAt: new Date(Date.now() + SESSION_HOURS * 3600000).toISOString(),
            isKiosk: false,
          };

          const updatedProfiles = state.profiles.map(p =>
            p.id === userId
              ? {
                  ...p,
                  pin: updatedPin,
                  status: 'online' as const,
                  lastSeen: new Date().toISOString(),
                  stats: { ...p.stats, loginCount: p.stats.loginCount + 1, lastLoginAt: new Date().toISOString() },
                }
              : p
          );

          set({
            session,
            currentProfile: updatedProfiles.find(p => p.id === userId)!,
            profiles: updatedProfiles,
            isAuthenticated: true,
            loginAttempts: [...state.loginAttempts, attempt],
          });

          get().addAuditEntry('login', 'user', userId, `${profile.name} logged in`, 'auth');
          return { success: true };
        } finally {
          set({ isLoggingIn: false });
        }
      },

      logout: () => {
        const state = get();
        if (state.currentProfile) {
          const updatedProfiles = state.profiles.map(p =>
            p.id === state.currentProfile!.id
              ? { ...p, status: 'offline' as const, lastSeen: new Date().toISOString() }
              : p
          );
          get().addAuditEntry('logout', 'user', state.currentProfile.id, `${state.currentProfile.name} logged out`, 'auth');
          set({
            session: null,
            currentProfile: null,
            isAuthenticated: false,
            profiles: updatedProfiles,
          });
        }
      },

      quickSwitch: (userId) => {
        const profile = get().profiles.find(p => p.id === userId);
        if (profile) {
          get().addAuditEntry('quick_switch', 'user', userId, `Quick switch to ${profile.name}`, 'auth');
        }
      },

      updateProfile: (userId, updates) => {
        set(state => ({
          profiles: state.profiles.map(p => p.id === userId ? { ...p, ...updates } : p),
          currentProfile: state.currentProfile?.id === userId ? { ...state.currentProfile, ...updates } as UserProfile : state.currentProfile,
        }));
      },

      updatePreferences: (prefs) => {
        const { currentProfile } = get();
        if (!currentProfile) return;
        const newPrefs = { ...currentProfile.preferences, ...prefs };
        get().updateProfile(currentProfile.id, { preferences: newPrefs });
      },

      changePin: async (oldPin, newPin) => {
        const { currentProfile } = get();
        if (!currentProfile) return { success: false, error: 'Δεν είστε συνδεδεμένοι.' };

        const oldValid = await verifyPin(oldPin, currentProfile.pin);
        if (!oldValid) return { success: false, error: 'Λάθος τρέχον PIN.' };
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) return { success: false, error: 'Το PIN πρέπει να είναι 4 ψηφία.' };

        // Weak PIN rejection
        const WEAK_PINS = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '3210', '1010', '2580'];
        if (WEAK_PINS.includes(newPin)) return { success: false, error: 'Αυτό το PIN είναι πολύ αδύναμο. Δοκιμάστε κάτι λιγότερο προβλέψιμο.' };

        // Reject sequential digits
        const digits = newPin.split('').map(Number);
        const isSequentialUp = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
        const isSequentialDown = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
        if (isSequentialUp || isSequentialDown) return { success: false, error: 'Αποφύγετε διαδοχικούς αριθμούς.' };

        const hashedNew = await hashPin(newPin);
        get().updateProfile(currentProfile.id, { pin: hashedNew });
        get().addAuditEntry('change_pin', 'user', currentProfile.id, 'PIN changed', 'user');
        return { success: true };
      },

      resetPin: async (targetUserId) => {
        const hashedDefault = await hashPin(DEFAULT_PIN);
        get().updateProfile(targetUserId, { pin: hashedDefault });
        get().addAuditEntry('reset_pin', 'user', targetUserId, 'PIN reset to default', 'user');
      },

      suspendUser: (targetUserId, reason) => {
        const { currentProfile } = get();
        get().updateProfile(targetUserId, {
          isSuspended: true,
          suspendedReason: reason,
          suspendedBy: currentProfile?.id,
        });
        get().addAuditEntry('suspend_user', 'user', targetUserId, reason, 'user');
      },

      unsuspendUser: (targetUserId) => {
        get().updateProfile(targetUserId, {
          isSuspended: false,
          suspendedReason: undefined,
          suspendedBy: undefined,
        });
        get().addAuditEntry('unsuspend_user', 'user', targetUserId, 'User unsuspended', 'user');
      },

      getProfile: (userId) => get().profiles.find(p => p.id === userId),

      isLocked: (userId) => {
        const lockExpiry = get().lockedUsers[userId];
        if (!lockExpiry) return false;
        return new Date(lockExpiry).getTime() > Date.now();
      },

      checkSessionExpiry: () => {
        const { session } = get();
        if (!session) return false;
        if (new Date(session.expiresAt).getTime() < Date.now()) {
          get().logout();
          return true;
        }
        return false;
      },

      addAuditEntry: (action, target, targetId, details, category) => {
        const { currentProfile } = get();
        const entry: AuditEntry = {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: currentProfile?.id || 'system',
          action,
          target,
          targetId,
          details,
          timestamp: new Date().toISOString(),
          category,
        };
        set(state => ({ auditLog: [entry, ...state.auditLog].slice(0, 1000) }));
      },
    }),
    {
      name: 'station-auth-storage',
      partialize: (state) => ({
        session: state.session,
        currentProfile: state.currentProfile,
        profiles: state.profiles,
        isAuthenticated: state.isAuthenticated,
        lockedUsers: state.lockedUsers,
        auditLog: state.auditLog.slice(0, 200),
      }),
    }
  )
);
