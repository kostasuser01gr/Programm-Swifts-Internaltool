import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { ROLE_PERMISSIONS } from '../../types/chat';
import { useI18n } from '../../i18n/I18nProvider';
import { useTheme } from '../../theme/ThemeProvider';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';

// ─── Comprehensive Settings Panel ────────────────────────────
// Sections: General, Profile, Shifts, Wash Types, Security,
// Notifications, Display, Voice, Users, Audit Log, About.

const SECTIONS = [
  { id: 'general',       label: 'Γενικά',            icon: '⚙️' },
  { id: 'profile',       label: 'Προφίλ',            icon: '👤' },
  { id: 'shifts',        label: 'Βάρδιες',           icon: '📅' },
  { id: 'wash',          label: 'Τύποι Πλύσης',      icon: '🚿' },
  { id: 'security',      label: 'Ασφάλεια',          icon: '🔒' },
  { id: 'notifications', label: 'Ειδοποιήσεις',      icon: '🔔' },
  { id: 'display',       label: 'Εμφάνιση',          icon: '🎨' },
  { id: 'voice',         label: 'Φωνητικές Εντολές', icon: '🎤' },
  { id: 'users',         label: 'Χρήστες',           icon: '👥' },
  { id: 'audit',         label: 'Αρχείο Ενεργειών',  icon: '📋' },
  { id: 'about',         label: 'Σχετικά',           icon: 'ℹ️' },
];

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

/* ── Reusable row ───────────────────────────── */
function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div>
        <div className="text-sm">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function SectionGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 p-5 mb-4">
      {title && <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3.5">{title}</div>}
      {children}
    </div>
  );
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3.5 py-1.5 rounded-lg border-none text-[13px] font-semibold cursor-pointer transition-all',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

/* ── Main Component ─────────────────────────── */
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

  // PIN change state
  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  const filteredSections = searchQuery.trim()
    ? SECTIONS.filter(s => {
        const q = searchQuery.toLowerCase();
        return s.label.toLowerCase().includes(q) ||
          (SECTION_KEYWORDS[s.id]?.some(kw => kw.includes(q)) ?? false);
      })
    : SECTIONS;

  const handlePinChange = async () => {
    const result = await auth.changePin(oldPin, newPin);
    setPinMsg(result.success ? '✅ PIN αλλάχθηκε' : `❌ ${result.error}`);
    if (result.success) { setOldPin(''); setNewPin(''); setShowPinChange(false); }
  };

  /* ── Section renderers ────────────────────── */

  const renderGeneral = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">⚙️ Γενικά</h2>
      <SectionGroup title="Σταθμός">
        <SettingRow label="Όνομα σταθμού">
          <Input className="w-56" value={settings.settings.stationName}
            onChange={e => settings.updateSettings({ stationName: e.target.value })} />
        </SettingRow>
        <SettingRow label="Κωδικός σταθμού">
          <Input className="w-24" value={settings.settings.stationCode}
            onChange={e => settings.updateSettings({ stationCode: e.target.value })} />
        </SettingRow>
        <SettingRow label="Ζώνη ώρας">
          <Input className="w-44" value={settings.settings.timezone}
            onChange={e => settings.updateSettings({ timezone: e.target.value })} />
        </SettingRow>
        <SettingRow label="Γλώσσα">
          <select className="rounded-lg border border-border/40 bg-background/50 text-foreground text-sm px-3 py-2 outline-none"
            value={settings.settings.defaultLanguage}
            onChange={e => settings.updateSettings({ defaultLanguage: e.target.value as 'el' | 'en' })}>
            <option value="el">Ελληνικά</option>
            <option value="en">English</option>
          </select>
        </SettingRow>
      </SectionGroup>
      <SectionGroup title="Εταιρείες">
        <div className="text-sm text-muted-foreground">{settings.settings.companies.join(', ')}</div>
      </SectionGroup>
      <SectionGroup title="Αρχεία & Μεταφόρτωση">
        <SettingRow label="Ενεργοποίηση μεταφόρτωσης">
          <Switch checked={settings.settings.enableFileUpload}
            onCheckedChange={v => settings.updateSettings({ enableFileUpload: v })} />
        </SettingRow>
        <SettingRow label="Μέγιστο μέγεθος αρχείου (MB)">
          <Input className="w-20" type="number" value={settings.settings.maxFileSizeMB}
            onChange={e => settings.updateSettings({ maxFileSizeMB: Number(e.target.value) })} />
        </SettingRow>
        <SettingRow label="Λειτουργία Συντήρησης">
          <Switch checked={settings.settings.maintenanceMode}
            onCheckedChange={v => settings.updateSettings({ maintenanceMode: v })} />
        </SettingRow>
      </SectionGroup>
    </>
  );

  const renderProfile = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">👤 Προφίλ</h2>
      {currentProfile && (
        <>
          <SectionGroup>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{currentProfile.avatar}</div>
              <div>
                <div className="text-xl font-bold">{currentProfile.name}</div>
                <div className="text-sm text-muted-foreground">{currentProfile.position}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/15 text-primary">
                  {currentProfile.role}
                </span>
              </div>
            </div>
            <SettingRow label="Email">
              <Input className="w-60" value={currentProfile.email || ''}
                onChange={e => auth.updateProfile(currentProfile.id, { email: e.target.value })} />
            </SettingRow>
            <SettingRow label="Τηλέφωνο">
              <Input className="w-44" value={currentProfile.phone || ''}
                onChange={e => auth.updateProfile(currentProfile.id, { phone: e.target.value })} />
            </SettingRow>
            <SettingRow label="Γλώσσες">
              <span className="text-sm text-muted-foreground">{currentProfile.languages.join(', ')}</span>
            </SettingRow>
          </SectionGroup>
          <SectionGroup title="Στατιστικά">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-2xl font-bold">{currentProfile.stats.loginCount}</div>
                <div className="text-[11px] text-muted-foreground">Συνδέσεις</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{currentProfile.stats.messagesSent}</div>
                <div className="text-[11px] text-muted-foreground">Μηνύματα</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{currentProfile.stats.shiftsWorked}</div>
                <div className="text-[11px] text-muted-foreground">Βάρδιες</div>
              </div>
            </div>
          </SectionGroup>
        </>
      )}
    </>
  );

  const renderShifts = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">📅 Βάρδιες</h2>
      <SectionGroup>
        {settings.settings.shifts.map(shift => (
          <div key={shift.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/30 bg-background/30 mb-2">
            <div className="w-2 h-10 rounded" style={{ background: shift.color }} />
            <div className="flex-1">
              <div className="font-semibold text-sm">{shift.name} ({shift.code})</div>
              <div className="text-xs text-muted-foreground">{shift.startTime} – {shift.endTime}</div>
            </div>
            <input type="color" value={shift.color}
              onChange={e => settings.updateShift(shift.id, { color: e.target.value })}
              className="w-8 h-8 border-none bg-transparent cursor-pointer" />
          </div>
        ))}
      </SectionGroup>
    </>
  );

  const renderWash = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">🚿 Τύποι Πλύσης</h2>
      <SectionGroup>
        {settings.settings.washTypes.map(wt => (
          <div key={wt.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/30 bg-background/30 mb-2">
            <div className="w-2 h-10 rounded" style={{ background: wt.color }} />
            <div className="flex-1">
              <div className="font-semibold text-sm">{wt.name}</div>
              <div className="text-xs text-muted-foreground">~{wt.estimatedMinutes} λεπτά • {wt.checklist.length} βήματα</div>
            </div>
          </div>
        ))}
      </SectionGroup>
    </>
  );

  const renderSecurity = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">🔒 Ασφάλεια</h2>
      <SectionGroup title="PIN">
        {!showPinChange ? (
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold cursor-pointer"
            onClick={() => setShowPinChange(true)}>Αλλαγή PIN</button>
        ) : (
          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Παλιό PIN</div>
              <Input className="w-24" type="password" maxLength={4} value={oldPin} onChange={e => setOldPin(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Νέο PIN</div>
              <Input className="w-24" type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)} />
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold cursor-pointer"
              onClick={handlePinChange}>Αλλαγή</button>
            <button className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-semibold cursor-pointer"
              onClick={() => setShowPinChange(false)}>Ακύρωση</button>
            {pinMsg && <div className="text-sm ml-2">{pinMsg}</div>}
          </div>
        )}
      </SectionGroup>
      <SectionGroup title="Κλειδώματα">
        <SettingRow label="Μέγιστες αποτυχημένες προσπάθειες">
          <Input className="w-20" type="number" value={settings.settings.maxLoginAttempts}
            onChange={e => settings.updateSettings({ maxLoginAttempts: Number(e.target.value) })} />
        </SettingRow>
        <SettingRow label="Χρόνος κλειδώματος (λεπτά)">
          <Input className="w-20" type="number" value={settings.settings.lockoutMinutes}
            onChange={e => settings.updateSettings({ lockoutMinutes: Number(e.target.value) })} />
        </SettingRow>
        <SettingRow label="Αυτόματη αποσύνδεση (λεπτά)">
          <Input className="w-20" type="number" value={settings.settings.autoLogoutMinutes}
            onChange={e => settings.updateSettings({ autoLogoutMinutes: Number(e.target.value) })} />
        </SettingRow>
      </SectionGroup>
    </>
  );

  const renderNotifications = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">🔔 Ειδοποιήσεις</h2>
      <SectionGroup>
        <SettingRow label="Push ειδοποιήσεις">
          <Switch checked={settings.settings.enablePushNotifications}
            onCheckedChange={v => settings.updateSettings({ enablePushNotifications: v })} />
        </SettingRow>
        {prefs && (
          <>
            <SettingRow label="Ήχος ειδοποιήσεων">
              <Switch checked={prefs.notificationSound}
                onCheckedChange={v => auth.updatePreferences({ notificationSound: v })} />
            </SettingRow>
            <SettingRow label="Ώρες ησυχίας" desc="Χωρίς ειδοποιήσεις εκτός αν urgent">
              <Switch checked={prefs.quietHoursEnabled}
                onCheckedChange={v => auth.updatePreferences({ quietHoursEnabled: v })} />
            </SettingRow>
            {prefs.quietHoursEnabled && (
              <SettingRow label="Ώρες">
                <div className="flex gap-2 items-center">
                  <Input className="w-20" type="time" value={prefs.quietHoursStart}
                    onChange={e => auth.updatePreferences({ quietHoursStart: e.target.value })} />
                  <span>–</span>
                  <Input className="w-20" type="time" value={prefs.quietHoursEnd}
                    onChange={e => auth.updatePreferences({ quietHoursEnd: e.target.value })} />
                </div>
              </SettingRow>
            )}
          </>
        )}
      </SectionGroup>
    </>
  );

  const renderDisplay = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">🎨 Εμφάνιση</h2>
      <SectionGroup title="Γλώσσα & Θέμα">
        <SettingRow label="🌐 Γλώσσα / Language" desc="Αλλαγή γλώσσας διεπαφής">
          <div className="flex gap-1.5">
            {availableLocales.map(l => (
              <OptionButton key={l.code} active={locale === l.code} onClick={() => setLocale(l.code)}>
                {l.flag} {l.label}
              </OptionButton>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="🎨 Θέμα εφαρμογής" desc="Σκούρο, ανοιχτό ή αυτόματα από σύστημα">
          <div className="flex gap-1.5">
            {([
              { value: 'dark' as const, label: '🌙 Σκούρο' },
              { value: 'light' as const, label: '☀️ Ανοιχτό' },
              { value: 'system' as const, label: '💻 Σύστημα' },
            ]).map(opt => (
              <OptionButton key={opt.value} active={themeMode === opt.value} onClick={() => setThemeMode(opt.value)}>
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </SettingRow>
      </SectionGroup>

      {prefs && (
        <SectionGroup title="Εμφάνιση Προφίλ">
          <SettingRow label="Μέγεθος γραμματοσειράς">
            <select className="rounded-lg border border-border/40 bg-background/50 text-foreground text-sm px-3 py-2 outline-none"
              value={prefs.fontSize}
              onChange={e => auth.updatePreferences({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}>
              <option value="small">Μικρό</option>
              <option value="medium">Κανονικό</option>
              <option value="large">Μεγάλο</option>
            </select>
          </SettingRow>
          <SettingRow label="Compact mode">
            <Switch checked={prefs.compactMode}
              onCheckedChange={v => auth.updatePreferences({ compactMode: v })} />
          </SettingRow>
          <SettingRow label="Εμφάνιση avatar">
            <Switch checked={prefs.showAvatars}
              onCheckedChange={v => auth.updatePreferences({ showAvatars: v })} />
          </SettingRow>
          <SettingRow label="Haptic feedback">
            <Switch checked={prefs.hapticFeedback}
              onCheckedChange={v => auth.updatePreferences({ hapticFeedback: v })} />
          </SettingRow>
          <SettingRow label="Προεπιλεγμένη προβολή">
            <select className="rounded-lg border border-border/40 bg-background/50 text-foreground text-sm px-3 py-2 outline-none"
              value={prefs.defaultView}
              onChange={e => auth.updatePreferences({ defaultView: e.target.value as 'chat' | 'schedule' | 'fleet' | 'washer' })}>
              <option value="chat">Chat</option>
              <option value="schedule">Πρόγραμμα</option>
              <option value="fleet">Στόλος</option>
              <option value="washer">Πλυντήρια</option>
            </select>
          </SettingRow>
        </SectionGroup>
      )}
    </>
  );

  const renderVoice = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">🎤 Φωνητικές Εντολές</h2>
      <SectionGroup>
        <SettingRow label="Ενεργοποίηση" desc="Χρήση Web Speech API για φωνητικές εντολές">
          <Switch checked={settings.settings.enableVoiceCommands}
            onCheckedChange={v => settings.updateSettings({ enableVoiceCommands: v })} />
        </SettingRow>
        {prefs && (
          <SettingRow label="Φωνητικές εντολές στο προφίλ μου">
            <Switch checked={prefs.voiceCommandsEnabled}
              onCheckedChange={v => auth.updatePreferences({ voiceCommandsEnabled: v })} />
          </SettingRow>
        )}
      </SectionGroup>
      <SectionGroup title="Διαθέσιμες εντολές">
        <div className="text-sm text-foreground/80 leading-7">
          • «Αναζήτηση [πινακίδα]» – Βρίσκει όχημα<br />
          • «Στείλε στα πλυντήρια [πινακίδα]» – Προσθήκη στην ουρά<br />
          • «Σημείωση [πινακίδα] [κείμενο]» – Σημείωση στο όχημα<br />
          • «Κατάσταση [πινακίδα]» – Εμφανίζει κατάσταση<br />
          • «Μήνυμα [κανάλι] [κείμενο]» – Στέλνει μήνυμα<br />
          • «Αλλαγή βάρδιας» – Αίτημα αλλαγής<br />
          • «Έκτακτο [κείμενο]» – Στέλνει urgent μήνυμα<br />
        </div>
      </SectionGroup>
    </>
  );

  const renderUsers = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">👥 Χρήστες ({profiles.length})</h2>
      <SectionGroup>
        {profiles.map(user => (
          <div key={user.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/20 bg-card/20 mb-1.5">
            <div className="text-2xl">{user.avatar}</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.position} • {user.group}</div>
            </div>
            <span className={cn(
              'px-2 py-0.5 rounded-md text-[11px] font-semibold',
              user.isSuspended ? 'bg-destructive/15 text-destructive' : 'bg-green-500/15 text-green-500',
            )}>
              {user.isSuspended ? 'Ανεστ.' : 'Ενεργός'}
            </span>
            {perms?.canSuspendUsers && currentProfile?.id !== user.id && (
              <button
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white cursor-pointer border-none',
                  user.isSuspended ? 'bg-green-500' : 'bg-destructive',
                )}
                onClick={() => user.isSuspended ? auth.unsuspendUser(user.id) : auth.suspendUser(user.id, 'Αναστολή από ρυθμίσεις')}
              >
                {user.isSuspended ? 'Ενεργ.' : 'Αναστ.'}
              </button>
            )}
            {perms?.canResetPin && currentProfile?.id !== user.id && (
              <button
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white cursor-pointer border-none bg-amber-500"
                onClick={async () => { const tempPin = await auth.resetPin(user.id); alert(`Νέο προσωρινό PIN: ${tempPin}\nΟ χρήστης πρέπει να το αλλάξει.`); }}
              >
                Reset PIN
              </button>
            )}
          </div>
        ))}
      </SectionGroup>
    </>
  );

  const renderAudit = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">📋 Αρχείο Ενεργειών</h2>
      <SectionGroup>
        {auth.auditLog.length === 0 ? (
          <div className="text-muted-foreground text-center py-5">Δεν υπάρχουν καταγραφές</div>
        ) : (
          auth.auditLog.slice(0, 50).map(entry => (
            <div key={entry.id} className="py-2 border-b border-border/20 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">{entry.action}</span>
                <span className="text-muted-foreground text-[11px]">
                  {new Date(entry.timestamp).toLocaleString('el')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{entry.details}</div>
            </div>
          ))
        )}
      </SectionGroup>
    </>
  );

  const renderAbout = () => (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">ℹ️ Σχετικά</h2>
      <SectionGroup>
        <SettingRow label="Εφαρμογή"><span>Station Manager</span></SettingRow>
        <SettingRow label="Έκδοση"><span>2.0.0</span></SettingRow>
        <SettingRow label="Πλατφόρμα"><span>Cloudflare Pages</span></SettingRow>
        <SettingRow label="Σταθμός"><span>{settings.settings.stationName}</span></SettingRow>
        <SettingRow label="Εταιρείες"><span>{settings.settings.companies.join(', ')}</span></SettingRow>
      </SectionGroup>
      <SectionGroup>
        <button
          className="w-full px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold cursor-pointer border-none"
          onClick={() => { if (confirm('Reset ρυθμίσεων;')) settings.resetSettings(); }}
        >
          ⚠️ Επαναφορά Εργοστασιακών
        </button>
      </SectionGroup>
    </>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general':       return renderGeneral();
      case 'profile':       return renderProfile();
      case 'shifts':        return renderShifts();
      case 'wash':          return renderWash();
      case 'security':      return renderSecurity();
      case 'notifications': return renderNotifications();
      case 'display':       return renderDisplay();
      case 'voice':         return renderVoice();
      case 'users':         return renderUsers();
      case 'audit':         return renderAudit();
      case 'about':         return renderAbout();
      default:              return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-card text-foreground font-sans">
      {/* Sidebar navigation */}
      <div className="w-[260px] border-r border-border/30 bg-background/50 flex flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-3 text-lg font-bold border-b border-border/20">⚙️ Ρυθμίσεις</div>
        <div className="px-3 py-2">
          <Input
            className="w-full text-sm"
            placeholder="🔍 Αναζήτηση ρυθμίσεων..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        {filteredSections.map(section => (
          <button
            key={section.id}
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground transition-all border-none bg-transparent w-full text-left cursor-pointer hover:text-foreground hover:bg-muted/30',
              activeSection === section.id && 'text-foreground bg-primary/8 border-r-[3px] border-r-primary',
            )}
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.icon}</span>
            {section.label}
          </button>
        ))}
        {filteredSections.length === 0 && (
          <div className="px-4 py-3 text-sm text-muted-foreground">Κανένα αποτέλεσμα</div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-8">
        {renderSection()}
      </div>
    </div>
  );
}

export default SettingsPanel;
