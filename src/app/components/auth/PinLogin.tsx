import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types/chat';

// ─── PIN Login & Sign-Up Screen ──────────────────────────────
// Full-screen auth: login (select user or type name) or sign up (name + PIN).

// Tailwind classes used directly in JSX

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
    <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px] mx-auto" role="group" aria-label="Αριθμητικό πληκτρολόγιο">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map(key => (
        <button
          key={key}
          type="button"
          className={`w-full aspect-[1.3] rounded-2xl border border-slate-400/[0.12] bg-slate-700/30 text-slate-200 cursor-pointer flex items-center justify-center transition-all active:scale-[0.92] ${
            key === 'clear' || key === 'back' ? 'text-base font-medium' : 'text-2xl font-semibold'
          }`}
          onClick={() => handleNumPress(key)}
          aria-label={key === 'clear' ? 'Καθαρισμός' : key === 'back' ? 'Διαγραφή' : key}
        >
          {key === 'clear' ? 'C' : key === 'back' ? '⌫' : key}
        </button>
      ))}
    </div>
  );

  // ─── PIN dots ───
  const PinDots = ({ filled, isConfirm = false }: { filled: number; isConfirm?: boolean }) => (
    <div className="flex gap-3 mb-2" role="status" aria-label={`PIN: ${filled} από 4 ψηφία`}>
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          aria-hidden="true"
          className={`w-4 h-4 rounded-full border-2 transition-all ${
            i < filled
              ? isConfirm
                ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-blue-500 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
              : 'border-slate-400/30'
          }`}
        />
      ))}
    </div>
  );

  const isSignupValid = signupName.trim().length >= 2;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans text-slate-200 z-[9999]">
      <div className="text-5xl mb-2" aria-hidden="true">🚗</div>
      <h1 className="text-[28px] font-bold mb-1 tracking-[0.5px]">Station Manager</h1>
      <p className="text-sm text-slate-400 mb-8">Σταθμός Ηράκλειο • GoldCar & Europcar</p>

      <div className="bg-slate-800/80 rounded-3xl border border-slate-400/10 backdrop-blur-xl py-8 px-7 w-[380px] max-w-[92vw] shadow-[0_25px_50px_rgba(0,0,0,0.4)]">
        {/* ─── Tab Bar ─── */}
        <div className="flex mb-6 rounded-[14px] overflow-hidden border border-slate-400/15" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`flex-1 py-3 px-4 text-sm font-semibold cursor-pointer border-none transition-all text-center ${
              mode === 'login' ? 'text-slate-200 bg-blue-500/20' : 'text-slate-400 bg-slate-950/40'
            }`}
            onClick={() => switchMode('login')}
          >
            <span aria-hidden="true">🔑 </span>Σύνδεση
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`flex-1 py-3 px-4 text-sm font-semibold cursor-pointer border-none transition-all text-center ${
              mode === 'signup' ? 'text-slate-200 bg-blue-500/20' : 'text-slate-400 bg-slate-950/40'
            }`}
            onClick={() => switchMode('signup')}
          >
            <span aria-hidden="true">✨ </span>Εγγραφή
          </button>
        </div>

        {/* ─── LOGIN MODE ─── */}
        {mode === 'login' && loginStep === 'select' && (
          <>
            <label htmlFor="user-search" className="sr-only">Αναζήτηση χρήστη</label>
            <input
              id="user-search"
              className="w-full py-3 px-3.5 rounded-xl border border-slate-400/15 bg-slate-950/50 text-slate-200 text-[15px] outline-none mb-3 box-border"
              placeholder="🔍 Αναζήτηση ονόματος..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="flex flex-col gap-2 mb-5 max-h-60 overflow-y-auto pr-1" role="listbox" aria-label="Επιλογή χρήστη">
              {filteredProfiles.map(profile => (
                <button
                  key={profile.id}
                  type="button"
                  role="option"
                  aria-selected={selectedUserId === profile.id}
                  className={`flex items-center gap-3 py-3 px-4 rounded-[14px] border cursor-pointer transition-all text-slate-200 w-full text-sm text-left hover:bg-blue-500/[0.12] hover:border-blue-500/30 ${
                    selectedUserId === profile.id
                      ? 'border-blue-500 bg-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                      : 'border-slate-400/10 bg-slate-700/40'
                  }`}
                  onClick={() => handleSelectUser(profile.id)}
                >
                  <div className="text-2xl w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0" aria-hidden="true">
                    {profile.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{profile.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{ROLE_LABELS[profile.role] || profile.role}</div>
                  </div>
                </button>
              ))}
              {filteredProfiles.length === 0 && (
                <div className="text-center text-slate-500 p-5 text-sm">
                  Δεν βρέθηκε χρήστης. Δοκιμάστε την{' '}
                  <button
                    type="button"
                    className="text-blue-500 bg-transparent border-none cursor-pointer text-sm underline"
                    onClick={() => switchMode('signup')}
                  >
                    Εγγραφή
                  </button>.
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'login' && loginStep === 'pin' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="text-[28px] w-12 h-12 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0" aria-hidden="true">
                {selectedUser?.avatar}
              </div>
              <div>
                <div className="font-bold text-base">{selectedUser?.name}</div>
                <div className="text-xs text-slate-400">{ROLE_LABELS[selectedUser?.role || '']}</div>
              </div>
            </div>

            <p className="text-sm text-slate-400">Εισάγετε PIN</p>
            <PinDots filled={pin.length} />
            <Numpad />
            <div className="text-red-500 text-[13px] text-center mt-2 min-h-[20px]" role="alert">
              {isLoggingIn ? 'Επαλήθευση...' : error}
            </div>

            <button type="button" className="text-sm text-slate-400 cursor-pointer bg-transparent border-none mt-4 py-2 px-4" onClick={handleLoginBack}>
              ← Επιλογή χρήστη
            </button>
          </div>
        )}

        {/* ─── SIGNUP MODE ─── */}
        {mode === 'signup' && signupStep === 'form' && (
          <form className="flex flex-col gap-1" onSubmit={e => { e.preventDefault(); handleSignupFormNext(); }}>
            <label htmlFor="signup-name" className="text-xs text-slate-400 mb-1.5 block">Όνομα *</label>
            <input
              id="signup-name"
              className="w-full py-3 px-3.5 rounded-xl border border-slate-400/15 bg-slate-950/50 text-slate-200 text-[15px] outline-none mb-3 box-border"
              placeholder="π.χ. Γιάννης Παπαδόπουλος"
              value={signupName}
              onChange={e => { setSignupName(e.target.value); setError(''); }}
              autoFocus
              maxLength={40}
              autoComplete="name"
            />
            <label htmlFor="signup-role" className="text-xs text-slate-400 mb-1.5 block">Ρόλος</label>
            <select
              id="signup-role"
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-400/15 bg-slate-950/50 text-slate-200 text-sm outline-none mb-4 box-border appearance-none cursor-pointer"
              value={signupRole}
              onChange={e => setSignupRole(e.target.value as UserRole)}
            >
              {SIGNUP_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className={`w-full p-3.5 rounded-[14px] border-none text-white text-base font-bold transition-all mt-2 ${
                isSignupValid
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500 cursor-pointer'
                  : 'bg-slate-700/50 cursor-default'
              }`}
              disabled={!isSignupValid}
            >
              Συνέχεια →
            </button>
            {error && <div className="text-red-500 text-[13px] text-center mt-2 min-h-[20px]" role="alert">{error}</div>}
          </form>
        )}

        {mode === 'signup' && signupStep === 'pin' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center mb-2">
              <div className="font-bold text-base">{signupName}</div>
              <div className="text-xs text-slate-400">{ROLE_LABELS[signupRole]}</div>
            </div>
            <p className="text-sm text-slate-400">Δημιουργήστε PIN (4 ψηφία)</p>
            <PinDots filled={pin.length} />
            <Numpad />
            {error && <div className="text-red-500 text-[13px] text-center mt-2 min-h-[20px]" role="alert">{error}</div>}
            <button type="button" className="text-sm text-slate-400 cursor-pointer bg-transparent border-none mt-4 py-2 px-4" onClick={handleSignupBack}>
              ← Πίσω
            </button>
          </div>
        )}

        {mode === 'signup' && signupStep === 'confirm' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center mb-2">
              <div className="font-bold text-base">{signupName}</div>
              <div className="text-xs text-slate-400">{ROLE_LABELS[signupRole]}</div>
            </div>
            <p className="text-sm text-slate-400">Επιβεβαιώστε το PIN</p>
            <PinDots filled={pin.length} isConfirm />
            <Numpad />
            {error && <div className="text-red-500 text-[13px] text-center mt-2 min-h-[20px]" role="alert">{error}</div>}
            <button type="button" className="text-sm text-slate-400 cursor-pointer bg-transparent border-none mt-4 py-2 px-4" onClick={handleSignupBack}>
              ← Πίσω
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 text-[11px] text-slate-600">v2.0.0 • Station Manager</div>
    </div>
  );
}

export default PinLogin;
