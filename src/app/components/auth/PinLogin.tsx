import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types/chat';

// ─── PIN Login & Sign-Up Screen ──────────────────────────────
// Full-screen auth: login (select user or type name) or sign up (name + PIN).

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#e2e8f0', zIndex: 9999,
  },
  logo: {
    fontSize: 48, marginBottom: 8,
  },
  title: {
    fontSize: 28, fontWeight: 700, marginBottom: 4, letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: 14, color: '#94a3b8', marginBottom: 32,
  },
  card: {
    background: 'rgba(30, 41, 59, 0.8)', borderRadius: 24,
    border: '1px solid rgba(148, 163, 184, 0.1)',
    backdropFilter: 'blur(20px)', padding: '32px 28px',
    width: 380, maxWidth: '92vw',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
  },
  tabRow: {
    display: 'flex', gap: 0, marginBottom: 24, borderRadius: 14, overflow: 'hidden',
    border: '1px solid rgba(148, 163, 184, 0.15)',
  },
  tab: {
    flex: 1, padding: '12px 16px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', border: 'none', color: '#94a3b8',
    background: 'rgba(15, 23, 42, 0.4)', transition: 'all 0.2s',
    textAlign: 'center' as const,
  },
  tabActive: {
    color: '#e2e8f0', background: 'rgba(59, 130, 246, 0.2)',
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.15)',
    background: 'rgba(15, 23, 42, 0.5)', color: '#e2e8f0',
    fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box' as const,
  },
  label: {
    fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block',
  },
  userSelect: {
    display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20,
    maxHeight: 240, overflowY: 'auto' as const, paddingRight: 4,
  },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 14,
    border: '1px solid rgba(148, 163, 184, 0.1)',
    background: 'rgba(51, 65, 85, 0.4)', cursor: 'pointer',
    transition: 'all 0.2s', color: '#e2e8f0', width: '100%',
    fontSize: 14, textAlign: 'left' as const,
  },
  userBtnActive: {
    border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.15)',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)',
  },
  avatar: {
    fontSize: 24, width: 40, height: 40, borderRadius: 12,
    background: 'rgba(51, 65, 85, 0.6)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userName: {
    fontWeight: 600, fontSize: 14,
  },
  userRole: {
    fontSize: 11, color: '#94a3b8', marginTop: 2,
  },
  pinSection: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 16,
  },
  pinLabel: {
    fontSize: 14, color: '#94a3b8',
  },
  pinDots: {
    display: 'flex', gap: 12, marginBottom: 8,
  },
  dot: {
    width: 16, height: 16, borderRadius: '50%',
    border: '2px solid rgba(148, 163, 184, 0.3)',
    transition: 'all 0.2s',
  },
  dotFilled: {
    background: '#3b82f6', borderColor: '#3b82f6',
    boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
  },
  dotConfirm: {
    background: '#10b981', borderColor: '#10b981',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
  },
  numpad: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10, width: '100%', maxWidth: 240, margin: '0 auto',
  },
  numKey: {
    width: '100%', aspectRatio: '1.3', borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'rgba(51, 65, 85, 0.3)', color: '#e2e8f0',
    fontSize: 24, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
  numKeySpecial: {
    fontSize: 16, fontWeight: 500,
  },
  error: {
    color: '#ef4444', fontSize: 13, textAlign: 'center' as const,
    marginTop: 8, minHeight: 20,
  },
  success: {
    color: '#10b981', fontSize: 13, textAlign: 'center' as const,
    marginTop: 8, minHeight: 20,
  },
  backBtn: {
    fontSize: 14, color: '#94a3b8', cursor: 'pointer',
    background: 'none', border: 'none', marginTop: 16,
    padding: '8px 16px',
  },
  roleSelect: {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.15)',
    background: 'rgba(15, 23, 42, 0.5)', color: '#e2e8f0',
    fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' as const,
    appearance: 'none' as const, cursor: 'pointer',
  },
  version: {
    position: 'absolute' as const, bottom: 16, fontSize: 11, color: '#475569',
  },
};

const ROLE_LABELS: Record<string, string> = {
  coordinator: 'Συντονιστής',
  supervisor: 'Επόπτης',
  fleet_supervisor: 'Επόπτης Στόλου',
  head_rep: 'Head Rep',
  employee: 'Υπάλληλος',
  washer: 'Πλύντης',
  viewer: 'Επισκέπτης',
};

const SIGNUP_ROLES: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'Υπάλληλος' },
  { value: 'washer', label: 'Πλύντης' },
  { value: 'viewer', label: 'Επισκέπτης' },
];

type AuthMode = 'login' | 'signup';
type LoginStep = 'select' | 'pin';
type SignupStep = 'form' | 'pin' | 'confirm';

export function PinLogin({ onLogin }: { onLogin: () => void }) {
  const { profiles, login, loginByName, signup, isLoggingIn } = useAuthStore();

  // Shared
  const [mode, setMode] = useState<AuthMode>('login');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Login state
  const [loginStep, setLoginStep] = useState<LoginStep>('select');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Signup state
  const [signupStep, setSignupStep] = useState<SignupStep>('form');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('employee');
  const [signupPin, setSignupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const selectedUser = profiles.find(p => p.id === selectedUserId);
  const isInPinStep = (mode === 'login' && loginStep === 'pin') || (mode === 'signup' && (signupStep === 'pin' || signupStep === 'confirm'));

  // ─── Reset on mode change ───
  const switchMode = (m: AuthMode) => {
    setMode(m);
    setPin('');
    setError('');
    setLoginStep('select');
    setSelectedUserId(null);
    setSearch('');
    setSignupStep('form');
    setSignupName('');
    setSignupRole('employee');
    setSignupPin('');
    setConfirmPin('');
  };

  // ─── Login handlers ───
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setLoginStep('pin');
    setPin('');
    setError('');
  };

  const handleLoginBack = () => {
    setLoginStep('select');
    setSelectedUserId(null);
    setPin('');
    setError('');
  };

  const handleLoginPinSubmit = useCallback(async (fullPin: string) => {
    if (!selectedUserId) return;
    const result = await login(selectedUserId, fullPin);
    if (result.success) {
      onLogin();
    } else {
      setError(result.error || 'Αποτυχία σύνδεσης');
      setPin('');
    }
  }, [selectedUserId, login, onLogin]);

  // ─── Signup handlers ───
  const handleSignupFormNext = () => {
    const trimmed = signupName.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      return;
    }
    const exists = profiles.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError('Αυτό το όνομα χρησιμοποιείται ήδη.');
      return;
    }
    setError('');
    setSignupStep('pin');
    setPin('');
  };

  const handleSignupPinSet = useCallback((fullPin: string) => {
    setSignupPin(fullPin);
    setSignupStep('confirm');
    setPin('');
    setError('');
  }, []);

  const handleSignupConfirm = useCallback(async (fullPin: string) => {
    if (fullPin !== signupPin) {
      setError('Τα PIN δεν ταιριάζουν. Δοκιμάστε ξανά.');
      setSignupStep('pin');
      setSignupPin('');
      setPin('');
      return;
    }
    const result = await signup(signupName.trim(), fullPin, signupRole);
    if (result.success) {
      onLogin();
    } else {
      setError(result.error || 'Αποτυχία εγγραφής');
      setSignupStep('pin');
      setSignupPin('');
      setPin('');
    }
  }, [signupPin, signupName, signupRole, signup, onLogin]);

  const handleSignupBack = () => {
    if (signupStep === 'confirm') {
      setSignupStep('pin');
      setSignupPin('');
      setPin('');
      setError('');
    } else if (signupStep === 'pin') {
      setSignupStep('form');
      setPin('');
      setError('');
    }
  };

  // ─── Numpad handler ───
  const handleNumPress = useCallback((num: string) => {
    if (num === 'clear') {
      setPin('');
      setError('');
      return;
    }
    if (num === 'back') {
      setPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    setPin(p => {
      const next = p + num;
      if (next.length === 4) {
        setTimeout(() => {
          if (mode === 'login' && loginStep === 'pin') {
            handleLoginPinSubmit(next);
          } else if (mode === 'signup' && signupStep === 'pin') {
            handleSignupPinSet(next);
          } else if (mode === 'signup' && signupStep === 'confirm') {
            handleSignupConfirm(next);
          }
        }, 150);
      }
      return next.length <= 4 ? next : p;
    });
  }, [mode, loginStep, signupStep, handleLoginPinSubmit, handleSignupPinSet, handleSignupConfirm]);

  // ─── Keyboard ───
  useEffect(() => {
    if (!isInPinStep) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleNumPress(e.key);
      else if (e.key === 'Backspace') handleNumPress('back');
      else if (e.key === 'Escape') {
        if (mode === 'login') handleLoginBack();
        else handleSignupBack();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isInPinStep, handleNumPress, mode]);

  // Handle Enter key on signup form
  useEffect(() => {
    if (mode !== 'signup' || signupStep !== 'form') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSignupFormNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, signupStep, signupName]);

  const filteredProfiles = profiles.filter(p =>
    p.isActive && !p.isSuspended &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  // ─── Numpad component ───
  const Numpad = () => (
    <div style={styles.numpad}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map(key => (
        <button
          key={key}
          style={{
            ...styles.numKey,
            ...(key === 'clear' || key === 'back' ? styles.numKeySpecial : {}),
          }}
          onClick={() => handleNumPress(key)}
          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          {key === 'clear' ? 'C' : key === 'back' ? '⌫' : key}
        </button>
      ))}
    </div>
  );

  // ─── PIN dots ───
  const PinDots = ({ filled, isConfirm = false }: { filled: number; isConfirm?: boolean }) => (
    <div style={styles.pinDots}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          ...styles.dot,
          ...(i < filled ? (isConfirm ? styles.dotConfirm : styles.dotFilled) : {}),
        }} />
      ))}
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.logo}>🚗</div>
      <div style={styles.title}>Station Manager</div>
      <div style={styles.subtitle}>Σταθμός Ηράκλειο • GoldCar & Europcar</div>

      <div style={styles.card}>
        {/* ─── Tab Bar ─── */}
        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
            onClick={() => switchMode('login')}
          >
            🔑 Σύνδεση
          </button>
          <button
            style={{ ...styles.tab, ...(mode === 'signup' ? styles.tabActive : {}) }}
            onClick={() => switchMode('signup')}
          >
            ✨ Εγγραφή
          </button>
        </div>

        {/* ─── LOGIN MODE ─── */}
        {mode === 'login' && loginStep === 'select' && (
          <>
            <input
              style={styles.input}
              placeholder="🔍 Αναζήτηση ονόματος..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div style={styles.userSelect}>
              {filteredProfiles.map(profile => (
                <button
                  key={profile.id}
                  style={{
                    ...styles.userBtn,
                    ...(selectedUserId === profile.id ? styles.userBtnActive : {}),
                  }}
                  onClick={() => handleSelectUser(profile.id)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.12)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(51, 65, 85, 0.4)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(148, 163, 184, 0.1)';
                  }}
                >
                  <div style={styles.avatar}>{profile.avatar}</div>
                  <div>
                    <div style={styles.userName}>{profile.name}</div>
                    <div style={styles.userRole}>{ROLE_LABELS[profile.role] || profile.role}</div>
                  </div>
                </button>
              ))}
              {filteredProfiles.length === 0 && (
                <div style={{ textAlign: 'center', color: '#64748b', padding: 20, fontSize: 14 }}>
                  Δεν βρέθηκε χρήστης. Δοκιμάστε την <button
                    style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
                    onClick={() => switchMode('signup')}
                  >Εγγραφή</button>.
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'login' && loginStep === 'pin' && (
          <div style={styles.pinSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ ...styles.avatar, fontSize: 28, width: 48, height: 48 }}>{selectedUser?.avatar}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser?.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{ROLE_LABELS[selectedUser?.role || '']}</div>
              </div>
            </div>

            <div style={styles.pinLabel}>Εισάγετε PIN</div>
            <PinDots filled={pin.length} />
            <Numpad />
            <div style={styles.error}>{isLoggingIn ? 'Επαλήθευση...' : error}</div>

            <button style={styles.backBtn} onClick={handleLoginBack}>
              ← Επιλογή χρήστη
            </button>
          </div>
        )}

        {/* ─── SIGNUP MODE ─── */}
        {mode === 'signup' && signupStep === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={styles.label}>Όνομα *</label>
            <input
              style={styles.input}
              placeholder="π.χ. Γιάννης Παπαδόπουλος"
              value={signupName}
              onChange={e => { setSignupName(e.target.value); setError(''); }}
              autoFocus
              maxLength={40}
            />
            <label style={styles.label}>Ρόλος</label>
            <select
              style={styles.roleSelect}
              value={signupRole}
              onChange={e => setSignupRole(e.target.value as UserRole)}
            >
              {SIGNUP_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: signupName.trim().length >= 2 ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(51, 65, 85, 0.5)',
                color: '#fff', fontSize: 16, fontWeight: 700, cursor: signupName.trim().length >= 2 ? 'pointer' : 'default',
                transition: 'all 0.2s', marginTop: 8,
              }}
              onClick={handleSignupFormNext}
              disabled={signupName.trim().length < 2}
            >
              Συνέχεια →
            </button>
            {error && <div style={styles.error}>{error}</div>}
          </div>
        )}

        {mode === 'signup' && signupStep === 'pin' && (
          <div style={styles.pinSection}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{signupName}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{ROLE_LABELS[signupRole]}</div>
            </div>
            <div style={styles.pinLabel}>Δημιουργήστε PIN (4 ψηφία)</div>
            <PinDots filled={pin.length} />
            <Numpad />
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.backBtn} onClick={handleSignupBack}>
              ← Πίσω
            </button>
          </div>
        )}

        {mode === 'signup' && signupStep === 'confirm' && (
          <div style={styles.pinSection}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{signupName}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{ROLE_LABELS[signupRole]}</div>
            </div>
            <div style={styles.pinLabel}>Επιβεβαιώστε το PIN</div>
            <PinDots filled={pin.length} isConfirm />
            <Numpad />
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.backBtn} onClick={handleSignupBack}>
              ← Πίσω
            </button>
          </div>
        )}
      </div>

      <div style={styles.version}>v2.0.0 • Station Manager</div>
    </div>
  );
}

export default PinLogin;
