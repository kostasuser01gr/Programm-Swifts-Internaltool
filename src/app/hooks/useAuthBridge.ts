// ─── Unified Auth Bridge ────────────────────────────────────
// Bridges the API auth system (useAuthStore from api/useAuth)
// with the platform auth system (useAuthStore from store/authStore).
// When API auth succeeds, creates a compatible UserProfile
// so that all platform features (settings, chat, etc.) work.

import { useEffect } from 'react';
import { useAuthStore as useApiAuth } from '../api/useAuth';
import { useAuthStore as usePlatformAuth } from '../store/authStore';
import { useDataMode } from '../store/dataMode';

/**
 * Call this hook once in the app shell to keep the two auth
 * systems synchronized. When the API user changes, a matching
 * platform profile is created or updated.
 */
export function useAuthBridge() {
  const dataMode = useDataMode();
  const apiUser = useApiAuth((s) => s.user);
  const apiIsAuthenticated = useApiAuth((s) => s.isAuthenticated);
  const platformAuth = usePlatformAuth();

  useEffect(() => {
    // Only bridge when in API mode and user is authenticated
    if (dataMode.mode !== 'api' || !apiIsAuthenticated || !apiUser) return;

    // Check if a platform profile already exists for this API user
    const existing = platformAuth.profiles.find(
      (p) => p.id === apiUser.id || p.email === apiUser.email
    );

    if (existing) {
      // If not already the current profile, set it
      if (platformAuth.currentProfile?.id !== existing.id) {
        usePlatformAuth.setState({
          currentProfile: existing,
          isAuthenticated: true,
          session: {
            userId: existing.id,
            deviceId: 'api-session',
            loginAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isKiosk: false,
          },
        });
      }
    } else {
      // Create a new platform profile from the API user
      const nameParts = (apiUser.display_name || apiUser.email).split(' ');
      const initials =
        nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : (apiUser.display_name || apiUser.email).slice(0, 2).toUpperCase();

      const newProfile = {
        id: apiUser.id,
        name: apiUser.display_name || apiUser.email,
        role: apiUser.role === 'admin' ? ('coordinator' as const) : ('employee' as const),
        avatar: initials,
        status: 'online' as const,
        group: 'Διοίκηση' as const,
        position: apiUser.role === 'admin' ? 'Coordinator' : 'User',
        lastSeen: new Date().toISOString(),
        email: apiUser.email,
        pin: '', // Not used in API mode
        skills: [],
        certifications: [],
        languages: ['en'],
        preferences: {
          language: 'en' as const,
          theme: 'dark' as const,
          notificationsEnabled: true,
          notificationSound: true,
          notificationChannels: {},
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
          compactMode: false,
          fontSize: 'medium' as const,
          showAvatars: true,
          autoStatus: true,
          defaultView: 'chat' as const,
          hapticFeedback: true,
          voiceCommandsEnabled: false,
          quickActions: [],
        },
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

      usePlatformAuth.setState((state) => ({
        profiles: [...state.profiles, newProfile],
        currentProfile: newProfile,
        isAuthenticated: true,
        session: {
          userId: newProfile.id,
          deviceId: 'api-session',
          loginAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isKiosk: false,
        },
      }));
    }
  }, [dataMode.mode, apiIsAuthenticated, apiUser?.id]);

  // On API logout, also clear platform auth
  useEffect(() => {
    if (dataMode.mode === 'api' && !apiIsAuthenticated && platformAuth.isAuthenticated) {
      platformAuth.logout();
    }
  }, [dataMode.mode, apiIsAuthenticated]);
}
