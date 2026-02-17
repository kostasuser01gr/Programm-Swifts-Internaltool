import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { ROLE_PERMISSIONS } from '../../types/chat';
import { useI18n } from '../../i18n/I18nProvider';
import { useTheme } from '../../theme/ThemeProvider';

// ─── Comprehensive Settings Panel ────────────────────────────
// Every single detail accessible. Sections: General, Profile, Shifts,
// Wash Types, Security, Notifications, Display, Voice, Users, Audit Log.

const SECTIONS = [
  { id: 'general',       label: 'Γενικά',           icon: '⚙️' },
  { id: 'profile',       label: 'Προφίλ',           icon: '👤' },
  { id: 'shifts',        label: 'Βάρδιες',          icon: '📅' },
  { id: 'wash',          label: 'Τύποι Πλύσης',     icon: '🚿' },
  { id: 'security',      label: 'Ασφάλεια',         icon: '🔒' },
  { id: 'notifications', label: 'Ειδοποιήσεις',     icon: '🔔' },
  { id: 'display',       label: 'Εμφάνιση',         icon: '🎨' },
  { id: 'voice',         label: 'Φωνητικές Εντολές', icon: '🎤' },
  { id: 'users',         label: 'Χρήστες',          icon: '👥' },
  { id: 'audit',         label: 'Αρχείο Ενεργειών', icon: '📋' },
  { id: 'about',         label: 'Σχετικά',          icon: 'ℹ️' },
];

const ss: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  nav: {
    width: 260, borderRight: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(15,23,42,0.5)', display: 'flex', flexDirection: 'column' as const,
    overflowY: 'auto' as const,
  },
  navTitle: {
    padding: '20px 16px 12px', fontSize: 18, fontWeight: 700,
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', cursor: 'pointer',
    fontSize: 14, color: '#94a3b8', transition: 'all 0.2s',
    border: 'none', background: 'none', width: '100%', textAlign: 'left' as const,
  },
  navItemActive: {
    color: '#e2e8f0', background: 'rgba(59,130,246,0.08)',
    borderRight: '3px solid #3b82f6',
  },
  main: {
    flex: 1, overflowY: 'auto' as const, padding: 32,
  },
  sectionTitle: {
    fontSize: 22, fontWeight: 700, marginBottom: 24,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  group: {
    padding: 20, borderRadius: 16,
    border: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(30,41,59,0.3)', marginBottom: 16,
  },
  groupTitle: {
    fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#94a3b8',
    textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.04)',
  },
  rowLabel: {
    fontSize: 14,
  },
  rowDesc: {
    fontSize: 12, color: '#64748b', marginTop: 2,
  },
  input: {
    padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(15,23,42,0.5)', color: '#e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  },
  select: {
    padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(15,23,42,0.5)', color: '#e2e8f0',
    fontSize: 13, outline: 'none',
  },
  toggle: {
    width: 48, height: 26, borderRadius: 13,
    position: 'relative' as const, cursor: 'pointer',
    transition: 'all 0.2s', border: 'none',
  },
  toggleDot: {
    width: 20, height: 20, borderRadius: '50%',
    background: '#fff', position: 'absolute' as const,
    top: 3, transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  shiftCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(15,23,42,0.3)', marginBottom: 8,
  },
  shiftColor: {
    width: 8, height: 40, borderRadius: 4,
  },
  userCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.06)',
    background: 'rgba(30,41,59,0.2)', marginBottom: 6,
  },
  badge: {
    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
  },
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: '#3b82f6', color: '#fff', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  btnDanger: {
    background: '#ef4444',
  },
  auditRow: {
    padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.04)',
    fontSize: 13,
  },
  backBtn: {
    padding: '8px 14px', borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(30,41,59,0.6)', color: '#94a3b8',
    cursor: 'pointer', fontSize: 13, marginBottom: 16,
  },
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      style={{ ...ss.toggle, background: value ? '#3b82f6' : 'rgba(148,163,184,0.2)' }}
      onClick={() => onChange(!value)}
    >
      <div style={{ ...ss.toggleDot, left: value ? 25 : 3 }} />
    </button>
  );
}

export function SettingsPanel() {
  const settings = useSettingsStore();
  const auth = useAuthStore();
  const { locale, setLocale, availableLocales } = useI18n();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [activeSection, setActiveSection] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const { currentProfile, profiles } = auth;
  const prefs = currentProfile?.preferences;
  const perms = currentProfile ? ROLE_PERMISSIONS[currentProfile.role] : null;

  // Section search filtering
  const SECTION_KEYWORDS: Record<string, string[]> = {
    general:       ['σταθμός', 'station', 'εταιρεία', 'γλώσσα', 'language', 'ζώνη', 'αρχεία', 'μεταφόρτωση', 'upload', 'συντήρηση'],
    profile:       ['όνομα', 'name', 'ρόλος', 'role', 'avatar', 'προφίλ', 'email'],
    shifts:        ['βάρδια', 'shift', 'πρωί', 'απόγευμα', 'morning', 'evening'],
    wash:          ['πλύσιμο', 'wash', 'γρήγορο', 'standard', 'deep', 'vip', 'checklist'],
    security:      ['pin', 'κωδικός', 'password', 'ασφάλεια', 'security', 'session', 'συνεδρία'],
    notifications: ['ειδοποίηση', 'notification', 'ήχος', 'sound', 'push', 'email'],
    display:       ['θέμα', 'theme', 'σκοτεινό', 'dark', 'light', 'μέγεθος', 'font', 'γραμματοσειρά'],
    voice:         ['φωνή', 'voice', 'μικρόφωνο', 'mic', 'speech'],
    users:         ['χρήστης', 'user', 'διαχειριστής', 'admin', 'δικαιώματα', 'permissions'],
    audit:         ['ενέργεια', 'action', 'log', 'αρχείο', 'ιστορικό'],
    about:         ['σχετικά', 'about', 'version', 'έκδοση', 'license'],
  };

  const filteredSections = searchQuery.trim()
    ? SECTIONS.filter(s => {
        const q = searchQuery.toLowerCase();
        return s.label.toLowerCase().includes(q) ||
          (SECTION_KEYWORDS[s.id]?.some(kw => kw.includes(q)) ?? false);
      })
    : SECTIONS;

  // PIN change
  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  const handlePinChange = async () => {
    const result = await auth.changePin(oldPin, newPin);
    setPinMsg(result.success ? '✅ PIN αλλάχθηκε' : `❌ ${result.error}`);
    if (result.success) { setOldPin(''); setNewPin(''); setShowPinChange(false); }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <>
            <div style={ss.sectionTitle}>⚙️ Γενικά</div>
            <div style={ss.group}>
              <div style={ss.groupTitle}>Σταθμός</div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Όνομα σταθμού</div></div>
                <input style={{ ...ss.input, width: 220 }} value={settings.settings.stationName}
                  onChange={e => settings.updateSettings({ stationName: e.target.value })} />
              </div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Κωδικός σταθμού</div></div>
                <input style={{ ...ss.input, width: 100 }} value={settings.settings.stationCode}
                  onChange={e => settings.updateSettings({ stationCode: e.target.value })} />
              </div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Ζώνη ώρας</div></div>
                <input style={{ ...ss.input, width: 180 }} value={settings.settings.timezone}
                  onChange={e => settings.updateSettings({ timezone: e.target.value })} />
              </div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Γλώσσα</div></div>
                <select style={ss.select} value={settings.settings.defaultLanguage}
                  onChange={e => settings.updateSettings({ defaultLanguage: e.target.value as 'el' | 'en' })}>
                  <option value="el">Ελληνικά</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div style={ss.group}>
              <div style={ss.groupTitle}>Εταιρείες</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                {settings.settings.companies.join(', ')}
              </div>
            </div>
            <div style={ss.group}>
              <div style={ss.groupTitle}>Αρχεία & Μεταφόρτωση</div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Ενεργοποίηση μεταφόρτωσης</div></div>
                <Toggle value={settings.settings.enableFileUpload}
                  onChange={v => settings.updateSettings({ enableFileUpload: v })} />
              </div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Μέγιστο μέγεθος αρχείου (MB)</div></div>
                <input style={{ ...ss.input, width: 80 }} type="number"
                  value={settings.settings.maxFileSizeMB}
                  onChange={e => settings.updateSettings({ maxFileSizeMB: Number(e.target.value) })} />
              </div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Λειτουργία Συντήρησης</div></div>
                <Toggle value={settings.settings.maintenanceMode}
                  onChange={v => settings.updateSettings({ maintenanceMode: v })} />
              </div>
            </div>
          </>
        );

      case 'profile':
        return (
          <>
            <div style={ss.sectionTitle}>👤 Προφίλ</div>
            {currentProfile && (
              <>
                <div style={ss.group}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 48 }}>{currentProfile.avatar}</div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{currentProfile.name}</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{currentProfile.position}</div>
                      <div style={{ ...ss.badge, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', marginTop: 4 }}>
                        {currentProfile.role}
                      </div>
                    </div>
                  </div>
                  <div style={ss.row}>
                    <div><div style={ss.rowLabel}>Email</div></div>
                    <input style={{ ...ss.input, width: 240 }} value={currentProfile.email || ''}
                      onChange={e => auth.updateProfile(currentProfile.id, { email: e.target.value })} />
                  </div>
                  <div style={ss.row}>
                    <div><div style={ss.rowLabel}>Τηλέφωνο</div></div>
                    <input style={{ ...ss.input, width: 180 }} value={currentProfile.phone || ''}
                      onChange={e => auth.updateProfile(currentProfile.id, { phone: e.target.value })} />
                  </div>
                  <div style={ss.row}>
                    <div><div style={ss.rowLabel}>Γλώσσες</div></div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{currentProfile.languages.join(', ')}</div>
                  </div>
                </div>
                <div style={ss.group}>
                  <div style={ss.groupTitle}>Στατιστικά</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div><div style={{ fontSize: 24, fontWeight: 700 }}>{currentProfile.stats.loginCount}</div><div style={{ fontSize: 11, color: '#64748b' }}>Συνδέσεις</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 700 }}>{currentProfile.stats.messagesSent}</div><div style={{ fontSize: 11, color: '#64748b' }}>Μηνύματα</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 700 }}>{currentProfile.stats.shiftsWorked}</div><div style={{ fontSize: 11, color: '#64748b' }}>Βάρδιες</div></div>
                  </div>
                </div>
              </>
            )}
          </>
        );

      case 'shifts':
        return (
          <>
            <div style={ss.sectionTitle}>📅 Βάρδιες</div>
            <div style={ss.group}>
              {settings.settings.shifts.map(shift => (
                <div key={shift.id} style={ss.shiftCard}>
                  <div style={{ ...ss.shiftColor, background: shift.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{shift.name} ({shift.code})</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{shift.startTime} – {shift.endTime}</div>
                  </div>
                  <input
                    type="color" value={shift.color}
                    onChange={e => settings.updateShift(shift.id, { color: e.target.value })}
                    style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'wash':
        return (
          <>
            <div style={ss.sectionTitle}>🚿 Τύποι Πλύσης</div>
            <div style={ss.group}>
              {settings.settings.washTypes.map(wt => (
                <div key={wt.id} style={ss.shiftCard}>
                  <div style={{ ...ss.shiftColor, background: wt.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{wt.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>~{wt.estimatedMinutes} λεπτά • {wt.checklist.length} βήματα</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'security':
        return (
          <>
            <div style={ss.sectionTitle}>🔒 Ασφάλεια</div>
            <div style={ss.group}>
              <div style={ss.groupTitle}>PIN</div>
              {!showPinChange ? (
                <button style={ss.btn} onClick={() => setShowPinChange(true)}>Αλλαγή PIN</button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Παλιό PIN</div>
                    <input style={{ ...ss.input, width: 100 }} type="password" maxLength={4} value={oldPin} onChange={e => setOldPin(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Νέο PIN</div>
                    <input style={{ ...ss.input, width: 100 }} type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)} />
                  </div>
                  <button style={ss.btn} onClick={handlePinChange}>Αλλαγή</button>
                  <button style={{ ...ss.btn, background: '#475569' }} onClick={() => setShowPinChange(false)}>Ακύρωση</button>
                  {pinMsg && <div style={{ fontSize: 13, marginLeft: 8 }}>{pinMsg}</div>}
                </div>
              )}
            </div>
            <div style={ss.group}>
              <div style={ss.groupTitle}>Κλειδώματα</div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Μέγιστες αποτυχημένες προσπάθειες</div></div>
                <input style={{ ...ss.input, width: 80 }} type="number"
                  value={settings.settings.maxLoginAttempts}
                  onChange={e => settings.updateSettings({ maxLoginAttempts: Number(e.target.value) })} />
              </div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Χρόνος κλειδώματος (λεπτά)</div></div>
                <input style={{ ...ss.input, width: 80 }} type="number"
                  value={settings.settings.lockoutMinutes}
                  onChange={e => settings.updateSettings({ lockoutMinutes: Number(e.target.value) })} />
              </div>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Αυτόματη αποσύνδεση (λεπτά)</div></div>
                <input style={{ ...ss.input, width: 80 }} type="number"
                  value={settings.settings.autoLogoutMinutes}
                  onChange={e => settings.updateSettings({ autoLogoutMinutes: Number(e.target.value) })} />
              </div>
            </div>
          </>
        );

      case 'notifications':
        return (
          <>
            <div style={ss.sectionTitle}>🔔 Ειδοποιήσεις</div>
            <div style={ss.group}>
              <div style={ss.row}>
                <div><div style={ss.rowLabel}>Push ειδοποιήσεις</div></div>
                <Toggle value={settings.settings.enablePushNotifications}
                  onChange={v => settings.updateSettings({ enablePushNotifications: v })} />
              </div>
              {prefs && (
                <>
                  <div style={ss.row}>
                    <div><div style={ss.rowLabel}>Ήχος ειδοποιήσεων</div></div>
                    <Toggle value={prefs.notificationSound}
                      onChange={v => auth.updatePreferences({ notificationSound: v })} />
                  </div>
                  <div style={ss.row}>
                    <div>
                      <div style={ss.rowLabel}>Ώρες ησυχίας</div>
                      <div style={ss.rowDesc}>Χωρίς ειδοποιήσεις εκτός αν urgent</div>
                    </div>
                    <Toggle value={prefs.quietHoursEnabled}
                      onChange={v => auth.updatePreferences({ quietHoursEnabled: v })} />
                  </div>
                  {prefs.quietHoursEnabled && (
                    <div style={ss.row}>
                      <div><div style={ss.rowLabel}>Ώρες</div></div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input style={{ ...ss.input, width: 80 }} type="time" value={prefs.quietHoursStart}
                          onChange={e => auth.updatePreferences({ quietHoursStart: e.target.value })} />
                        <span>–</span>
                        <input style={{ ...ss.input, width: 80 }} type="time" value={prefs.quietHoursEnd}
                          onChange={e => auth.updatePreferences({ quietHoursEnd: e.target.value })} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        );

      case 'display':
        return (
          <>
            <div style={ss.sectionTitle}>🎨 Εμφάνιση</div>

            {/* Language & Theme (global, stored in PlatformSettings) */}
            <div style={ss.group}>
              <div style={ss.groupTitle}>Γλώσσα & Θέμα</div>
              <div style={ss.row}>
                <div>
                  <div style={ss.rowLabel}>🌐 Γλώσσα / Language</div>
                  <div style={ss.rowDesc}>Αλλαγή γλώσσας διεπαφής</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {availableLocales.map(l => (
                    <button
                      key={l.code}
                      onClick={() => setLocale(l.code)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        background: locale === l.code ? '#3b82f6' : 'rgba(51,65,85,0.5)',
                        color: locale === l.code ? '#fff' : '#94a3b8',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={ss.row}>
                <div>
                  <div style={ss.rowLabel}>🎨 Θέμα εφαρμογής</div>
                  <div style={ss.rowDesc}>Σκούρο, ανοιχτό ή αυτόματα από σύστημα</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { value: 'dark' as const, label: '🌙 Σκούρο' },
                    { value: 'light' as const, label: '☀️ Ανοιχτό' },
                    { value: 'system' as const, label: '💻 Σύστημα' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setThemeMode(opt.value)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        background: themeMode === opt.value ? '#3b82f6' : 'rgba(51,65,85,0.5)',
                        color: themeMode === opt.value ? '#fff' : '#94a3b8',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {prefs && (
              <div style={ss.group}>
                <div style={ss.groupTitle}>Εμφάνιση Προφίλ</div>
                <div style={ss.row}>
                  <div><div style={ss.rowLabel}>Μέγεθος γραμματοσειράς</div></div>
                  <select style={ss.select} value={prefs.fontSize}
                    onChange={e => auth.updatePreferences({ fontSize: e.target.value as any })}>
                    <option value="small">Μικρό</option>
                    <option value="medium">Κανονικό</option>
                    <option value="large">Μεγάλο</option>
                  </select>
                </div>
                <div style={ss.row}>
                  <div><div style={ss.rowLabel}>Compact mode</div></div>
                  <Toggle value={prefs.compactMode}
                    onChange={v => auth.updatePreferences({ compactMode: v })} />
                </div>
                <div style={ss.row}>
                  <div><div style={ss.rowLabel}>Εμφάνιση avatar</div></div>
                  <Toggle value={prefs.showAvatars}
                    onChange={v => auth.updatePreferences({ showAvatars: v })} />
                </div>
                <div style={ss.row}>
                  <div><div style={ss.rowLabel}>Haptic feedback</div></div>
                  <Toggle value={prefs.hapticFeedback}
                    onChange={v => auth.updatePreferences({ hapticFeedback: v })} />
                </div>
                <div style={ss.row}>
                  <div><div style={ss.rowLabel}>Προεπιλεγμένη προβολή</div></div>
                  <select style={ss.select} value={prefs.defaultView}
                    onChange={e => auth.updatePreferences({ defaultView: e.target.value as any })}>
                    <option value="chat">Chat</option>
                    <option value="schedule">Πρόγραμμα</option>
                    <option value="fleet">Στόλος</option>
                    <option value="washer">Πλυντήρια</option>
                  </select>
                </div>
              </div>
            )}
          </>
        );

      case 'voice':
        return (
          <>
            <div style={ss.sectionTitle}>🎤 Φωνητικές Εντολές</div>
            <div style={ss.group}>
              <div style={ss.row}>
                <div>
                  <div style={ss.rowLabel}>Ενεργοποίηση</div>
                  <div style={ss.rowDesc}>Χρήση Web Speech API για φωνητικές εντολές</div>
                </div>
                <Toggle value={settings.settings.enableVoiceCommands}
                  onChange={v => settings.updateSettings({ enableVoiceCommands: v })} />
              </div>
              {prefs && (
                <div style={ss.row}>
                  <div><div style={ss.rowLabel}>Φωνητικές εντολές στο προφίλ μου</div></div>
                  <Toggle value={prefs.voiceCommandsEnabled}
                    onChange={v => auth.updatePreferences({ voiceCommandsEnabled: v })} />
                </div>
              )}
            </div>
            <div style={ss.group}>
              <div style={ss.groupTitle}>Διαθέσιμες εντολές</div>
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8 }}>
                • «Αναζήτηση [πινακίδα]» – Βρίσκει όχημα<br />
                • «Στείλε στα πλυντήρια [πινακίδα]» – Προσθήκη στην ουρά<br />
                • «Σημείωση [πινακίδα] [κείμενο]» – Σημείωση στο όχημα<br />
                • «Κατάσταση [πινακίδα]» – Εμφανίζει κατάσταση<br />
                • «Μήνυμα [κανάλι] [κείμενο]» – Στέλνει μήνυμα<br />
                • «Αλλαγή βάρδιας» – Αίτημα αλλαγής<br />
                • «Έκτακτο [κείμενο]» – Στέλνει urgent μήνυμα<br />
              </div>
            </div>
          </>
        );

      case 'users':
        return (
          <>
            <div style={ss.sectionTitle}>👥 Χρήστες ({profiles.length})</div>
            <div style={ss.group}>
              {profiles.map(user => (
                <div key={user.id} style={ss.userCard}>
                  <div style={{ fontSize: 24 }}>{user.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{user.position} • {user.group}</div>
                  </div>
                  <div style={{ ...ss.badge, background: user.isSuspended ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: user.isSuspended ? '#ef4444' : '#22c55e' }}>
                    {user.isSuspended ? 'Ανεστ.' : 'Ενεργός'}
                  </div>
                  {perms?.canSuspendUsers && currentProfile?.id !== user.id && (
                    <button
                      style={{ ...ss.btn, fontSize: 11, padding: '4px 10px', background: user.isSuspended ? '#22c55e' : '#ef4444' }}
                      onClick={() => user.isSuspended ? auth.unsuspendUser(user.id) : auth.suspendUser(user.id, 'Αναστολή από ρυθμίσεις')}
                    >
                      {user.isSuspended ? 'Ενεργ.' : 'Αναστ.'}
                    </button>
                  )}
                  {perms?.canResetPin && currentProfile?.id !== user.id && (
                    <button
                      style={{ ...ss.btn, fontSize: 11, padding: '4px 10px', background: '#f59e0b' }}
                      onClick={() => { auth.resetPin(user.id); alert(`PIN επαναφέρθηκε σε 1234`); }}
                    >
                      Reset PIN
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        );

      case 'audit':
        return (
          <>
            <div style={ss.sectionTitle}>📋 Αρχείο Ενεργειών</div>
            <div style={ss.group}>
              {auth.auditLog.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Δεν υπάρχουν καταγραφές</div>
              ) : (
                auth.auditLog.slice(0, 50).map(entry => (
                  <div key={entry.id} style={ss.auditRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{entry.action}</span>
                      <span style={{ color: '#64748b', fontSize: 11 }}>
                        {new Date(entry.timestamp).toLocaleString('el')}
                      </span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{entry.details}</div>
                  </div>
                ))
              )}
            </div>
          </>
        );

      case 'about':
        return (
          <>
            <div style={ss.sectionTitle}>ℹ️ Σχετικά</div>
            <div style={ss.group}>
              <div style={ss.row}><div style={ss.rowLabel}>Εφαρμογή</div><div>Station Manager</div></div>
              <div style={ss.row}><div style={ss.rowLabel}>Έκδοση</div><div>2.0.0</div></div>
              <div style={ss.row}><div style={ss.rowLabel}>Πλατφόρμα</div><div>Cloudflare Pages</div></div>
              <div style={ss.row}><div style={ss.rowLabel}>Σταθμός</div><div>{settings.settings.stationName}</div></div>
              <div style={ss.row}><div style={ss.rowLabel}>Εταιρείες</div><div>{settings.settings.companies.join(', ')}</div></div>
            </div>
            <div style={ss.group}>
              <button style={{ ...ss.btn, ...ss.btnDanger, width: '100%' }} onClick={() => { if (confirm('Reset ρυθμίσεων;')) settings.resetSettings(); }}>
                ⚠️ Επαναφορά Εργοστασιακών
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={ss.page}>
      <div style={ss.nav}>
        <div style={ss.navTitle}>⚙️ Ρυθμίσεις</div>
        {/* Search */}
        <div style={{ padding: '8px 12px' }}>
          <input
            style={{ ...ss.input, width: '100%', fontSize: 13 }}
            placeholder="🔍 Αναζήτηση ρυθμίσεων..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        {filteredSections.map(section => (
          <button
            key={section.id}
            style={{ ...ss.navItem, ...(activeSection === section.id ? ss.navItemActive : {}) }}
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.icon}</span>
            {section.label}
          </button>
        ))}
        {filteredSections.length === 0 && (
          <div style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
            Κανένα αποτέλεσμα
          </div>
        )}
      </div>
      <div style={ss.main}>
        {renderSection()}
      </div>
    </div>
  );
}

export default SettingsPanel;
