import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useWasherStore } from '../../store/washerStore';
import type { WashType, WashStatus, WashRecord } from '../../types/platform';

// ─── Public Wash Portal ──────────────────────────────────────
// NO LOGIN required. External wash crew registers vehicles fast.
// Features: plate entry, duplicate protection, voice input,
// live queue, embedded chat, mobile-first glass UI.

// ─── Config ──────────────────────────────────────────────────

const WASH_TYPES: { type: WashType; label: string; icon: string; color: string; minutes: number; desc: string }[] = [
  { type: 'quick',    label: 'Γρήγορο',  icon: '⚡', color: '#22c55e', minutes: 15, desc: 'Εξωτερικό + βασικό εσωτερικό' },
  { type: 'standard', label: 'Κανονικό', icon: '🚿', color: '#3b82f6', minutes: 30, desc: 'Πλήρες πλύσιμο' },
  { type: 'deep',     label: 'Βαθύ',     icon: '✨', color: '#f59e0b', minutes: 60, desc: 'Βαθύς καθαρισμός + κέρωμα' },
  { type: 'vip',      label: 'VIP',      icon: '👑', color: '#a855f7', minutes: 90, desc: 'Premium πλήρες + απολύμανση' },
];

const STATUS_LABELS: Record<WashStatus, { label: string; icon: string; color: string }> = {
  waiting:     { label: 'Αναμονή',      icon: '⏳', color: '#f59e0b' },
  in_progress: { label: 'Σε εξέλιξη',   icon: '🔄', color: '#3b82f6' },
  done:        { label: 'Ολοκληρώθηκε', icon: '✅', color: '#22c55e' },
  inspected:   { label: 'Ελέγχθηκε',    icon: '🔍', color: '#a855f7' },
};

// Greek plate format: 3 Greek uppercase letters + 4 digits (or older 2-letter + 4-digit)
const GREEK_PLATE_REGEX = /^[ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]{2,3}[\s-]?\d{4}$/;

// ─── Voice Recognition Hook ─────────────────────────────────

function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Η φωνητική εντολή δεν υποστηρίζεται σε αυτή τη συσκευή');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'el-GR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => { setIsListening(true); setError(null); };
    recognition.onend = () => { setIsListening(false); setInterim(''); };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      setInterim('');
      if (e.error === 'not-allowed') setError('Χρειάζεται άδεια μικροφώνου');
      else if (e.error !== 'aborted') setError('Σφάλμα φωνητικής εντολής');
    };
    recognition.onresult = (e: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText);
      if (finalText) {
        // Clean up voice: remove spaces, convert to plate format
        const cleaned = finalText.replace(/\s+/g, '').toUpperCase();
        onResult(cleaned);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterim('');
  }, []);

  return { isListening, interim, error, startListening, stopListening };
}

// ─── Live Timer Component ───────────────────────────────────

function LiveTimer({ startedAt, estimatedMin }: { startedAt: string; estimatedMin: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - new Date(startedAt).getTime();
  const min = Math.floor(elapsed / 60000);
  const sec = Math.floor((elapsed % 60000) / 1000);
  const overdue = min >= estimatedMin;

  return (
    <span style={{ color: overdue ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
      ⏱ {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>/ {estimatedMin}′</span>
      {overdue && <span style={{ marginLeft: 4 }}>⚠️</span>}
    </span>
  );
}

// ─── Embedded Mini Chat ─────────────────────────────────────

interface ChatMsg {
  id: string;
  text: string;
  from: 'washer' | 'station';
  time: string;
}

function MiniChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => {
    try {
      const saved = localStorage.getItem('wash-portal-chat');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const unread = useMemo(() => msgs.filter(m => m.from === 'station').length, [msgs]);

  useEffect(() => {
    try { localStorage.setItem('wash-portal-chat', JSON.stringify(msgs.slice(-100))); } catch { /* ignore storage errors */ }
  }, [msgs]);

  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, open]);

  const send = () => {
    if (!input.trim()) return;
    const msg: ChatMsg = {
      id: `wc-${Date.now()}`,
      text: input.trim(),
      from: 'washer',
      time: new Date().toLocaleTimeString('el', { hour: '2-digit', minute: '2-digit' }),
    };
    setMsgs(prev => [...prev, msg]);
    setInput('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Άνοιγμα chat"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: '#3b82f6', color: '#fff', fontSize: 24,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        💬
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: '#ef4444', color: '#fff', fontSize: 11,
            fontWeight: 700, display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>{unread}</span>
        )}
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      width: 320, maxWidth: 'calc(100vw - 32px)',
      height: 400, maxHeight: 'calc(100vh - 120px)',
      borderRadius: 20, overflow: 'hidden',
      background: 'rgba(15,23,42,0.97)',
      border: '1px solid rgba(59,130,246,0.2)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid rgba(148,163,184,0.1)',
        background: 'rgba(59,130,246,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Chat Σταθμού</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Επικοινωνία με το γραφείο</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'rgba(148,163,184,0.1)', color: '#94a3b8',
            cursor: 'pointer', fontSize: 16,
          }}
        >✕</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {msgs.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 32, color: '#64748b', fontSize: 13,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            Γράψτε μήνυμα στο σταθμό
          </div>
        )}
        {msgs.map(m => (
          <div key={m.id} style={{
            alignSelf: m.from === 'washer' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}>
            <div style={{
              padding: '8px 12px', borderRadius: 12,
              background: m.from === 'washer' ? '#3b82f6' : 'rgba(51,65,85,0.6)',
              color: '#fff', fontSize: 13, lineHeight: 1.4,
              borderBottomRightRadius: m.from === 'washer' ? 4 : 12,
              borderBottomLeftRadius: m.from === 'station' ? 4 : 12,
            }}>
              {m.text}
            </div>
            <div style={{
              fontSize: 10, color: '#64748b', marginTop: 2,
              textAlign: m.from === 'washer' ? 'right' : 'left',
            }}>{m.time}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: 8, borderTop: '1px solid rgba(148,163,184,0.1)',
        display: 'flex', gap: 6,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="Μήνυμα..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.12)',
            background: 'rgba(30,41,59,0.6)', color: '#e2e8f0',
            fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: input.trim() ? '#3b82f6' : 'rgba(59,130,246,0.2)',
            color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >➤</button>
      </div>
    </div>
  );
}

// ─── Main Portal Component ──────────────────────────────────

export function WashPortal() {
  const washer = useWasherStore();
  const stats = washer.getQueueStats();

  // ── Entry State ──
  const [plate, setPlate] = useState('');
  const [selectedType, setSelectedType] = useState<WashType>('standard');
  const [priority, setPriority] = useState<WashRecord['priority']>('normal');
  const [activeTab, setActiveTab] = useState<'add' | 'queue' | 'my'>('add');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [successPlate, setSuccessPlate] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const plateInputRef = useRef<HTMLInputElement>(null);

  // ── Washer Identity (stored in localStorage, no login required) ──
  const [washerName, setWasherName] = useState(() => localStorage.getItem('wash-portal-name') || '');
  const [showNamePrompt, setShowNamePrompt] = useState(!washerName);
  const washerId = useMemo(() => {
    let id = localStorage.getItem('wash-portal-id');
    if (!id) {
      id = `washer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      localStorage.setItem('wash-portal-id', id);
    }
    return id;
  }, []);

  // ── Voice Input ──
  const handleVoiceResult = useCallback((text: string) => {
    setPlate(text);
    checkDuplicate(text);
  }, []);
  const voice = useVoiceInput(handleVoiceResult);

  // ── My active jobs (by washerId) ──
  const myJobs = useMemo(
    () => washer.queue.filter(r => r.assignedTo === washerId && (r.status === 'in_progress' || r.status === 'waiting')),
    [washer.queue, washerId]
  );

  // ── Duplicate Check ──
  const checkDuplicate = useCallback((p: string) => {
    const normalized = p.replace(/[\s-]/g, '').toUpperCase();
    if (!normalized) { setDuplicateWarning(null); return; }
    const exists = washer.queue.find(
      r => r.plate.replace(/[\s-]/g, '').toUpperCase() === normalized
        && r.status !== 'inspected'
        && r.status !== 'done'
    );
    setDuplicateWarning(exists
      ? `⚠️ Η πινακίδα ${exists.plate} υπάρχει ήδη στην ουρά (${STATUS_LABELS[exists.status].label})`
      : null
    );
  }, [washer.queue]);

  const handlePlateChange = (val: string) => {
    const upper = val.toUpperCase();
    setPlate(upper);
    checkDuplicate(upper);
    setSuccessPlate(null);
  };

  // ── Add to Queue ──
  const handleAdd = () => {
    const normalized = plate.replace(/[\s-]/g, '').toUpperCase();
    if (!normalized) return;

    // Hard duplicate block
    const dup = washer.queue.find(
      r => r.plate.replace(/[\s-]/g, '').toUpperCase() === normalized
        && r.status !== 'inspected'
        && r.status !== 'done'
    );
    if (dup) {
      setDuplicateWarning(`🚫 Η πινακίδα ${dup.plate} ΗΔΗ υπάρχει! (${STATUS_LABELS[dup.status].label})`);
      return;
    }

    const id = washer.addToQueue(normalized, 'economy', selectedType, priority, washerName || 'Πλυντήριο');
    // Auto-assign to this washer
    washer.reassignWasher(id, washerId);

    setSuccessPlate(normalized);
    setPlate('');
    setDuplicateWarning(null);
    setPriority('normal');

    // Auto-clear success after 3s
    setTimeout(() => setSuccessPlate(null), 3000);
    // Re-focus plate input
    plateInputRef.current?.focus();
  };

  // ── Name prompt (first time only) ──
  const handleNameSave = () => {
    if (!washerName.trim()) return;
    localStorage.setItem('wash-portal-name', washerName.trim());
    setShowNamePrompt(false);
  };

  // ── Styles ──
  const bg = 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)';

  if (showNamePrompt) {
    return (
      <div style={{
        minHeight: '100vh', background: bg, color: '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 20,
      }}>
        <div style={{
          width: '100%', maxWidth: 400, padding: 32, borderRadius: 24,
          background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.1)',
          backdropFilter: 'blur(20px)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚿</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Πλυντήρια</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
            Γράψε το όνομά σου για να ξεκινήσεις
          </p>
          <input
            value={washerName}
            onChange={e => setWasherName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); }}
            placeholder="π.χ. Γιάννης"
            autoFocus
            style={{
              width: '100%', padding: '14px 18px', borderRadius: 14,
              border: '2px solid rgba(59,130,246,0.3)',
              background: 'rgba(15,23,42,0.6)', color: '#e2e8f0',
              fontSize: 18, textAlign: 'center', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleNameSave}
            disabled={!washerName.trim()}
            style={{
              width: '100%', marginTop: 16, padding: '14px 0',
              borderRadius: 14, border: 'none',
              background: washerName.trim() ? '#3b82f6' : 'rgba(59,130,246,0.2)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: washerName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Ξεκίνα →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', background: bg, color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid rgba(148,163,184,0.08)',
        background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🚿</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Πλυντήρια</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>👤 {washerName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            padding: '6px 12px', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)', color: '#f59e0b',
            fontSize: 13, fontWeight: 700,
          }}>
            ⏳ {stats.waiting}
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 10,
            background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
            fontSize: 13, fontWeight: 700,
          }}>
            🔄 {stats.inProgress}
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 10,
            background: 'rgba(34,197,94,0.08)', color: '#22c55e',
            fontSize: 13, fontWeight: 700,
          }}>
            ✅ {stats.done + stats.inspected}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 20px',
        borderBottom: '1px solid rgba(148,163,184,0.06)',
        background: 'rgba(15,23,42,0.4)',
      }}>
        {([
          { id: 'add' as const, label: '➕ Νέο Πλύσιμο', badge: 0 },
          { id: 'queue' as const, label: '📋 Ουρά', badge: stats.waiting + stats.inProgress },
          { id: 'my' as const, label: '🙋 Τα δικά μου', badge: myJobs.length },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '12px 8px', border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#94a3b8',
              fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.2s', position: 'relative',
            }}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span style={{
                marginLeft: 6, padding: '1px 7px', borderRadius: 8,
                background: activeTab === tab.id ? '#3b82f6' : 'rgba(148,163,184,0.15)',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                fontSize: 11, fontWeight: 700,
              }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {/* ═══ ADD TAB ═══ */}
        {activeTab === 'add' && (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            {/* Success toast */}
            {successPlate && (
              <div style={{
                padding: '14px 18px', borderRadius: 14, marginBottom: 16,
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#22c55e', fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'fadeIn 0.3s ease-out',
              }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <div>
                  <div>Προστέθηκε!</div>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{successPlate}</div>
                </div>
              </div>
            )}

            {/* Plate Input */}
            <div style={{
              padding: 24, borderRadius: 20,
              background: 'rgba(30,41,59,0.5)',
              border: duplicateWarning
                ? '2px solid rgba(239,68,68,0.5)'
                : '1px solid rgba(148,163,184,0.1)',
              backdropFilter: 'blur(10px)',
              marginBottom: 16,
            }}>
              <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 8, display: 'block' }}>
                ΠΙΝΑΚΙΔΑ ΟΧΗΜΑΤΟΣ
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={plateInputRef}
                  value={plate}
                  onChange={e => handlePlateChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && plate.trim()) handleAdd(); }}
                  placeholder="ΗΡΑ 0000"
                  autoFocus
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    flex: 1, padding: '16px 20px', borderRadius: 14,
                    border: '2px solid rgba(148,163,184,0.15)',
                    background: 'rgba(15,23,42,0.6)', color: '#fff',
                    fontSize: 28, fontWeight: 800, letterSpacing: 3,
                    textAlign: 'center', outline: 'none',
                    textTransform: 'uppercase',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                {/* Voice Button */}
                <button
                  onClick={voice.isListening ? voice.stopListening : voice.startListening}
                  aria-label={voice.isListening ? 'Σταμάτα την ακρόαση' : 'Φωνητική εισαγωγή πινακίδας'}
                  style={{
                    width: 56, height: 56, borderRadius: 14, border: 'none',
                    background: voice.isListening
                      ? 'rgba(239,68,68,0.9)'
                      : 'rgba(59,130,246,0.15)',
                    color: voice.isListening ? '#fff' : '#3b82f6',
                    fontSize: 24, cursor: 'pointer',
                    animation: voice.isListening ? 'pulse 1s ease-in-out infinite' : 'none',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  🎤
                </button>
              </div>
              {voice.isListening && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444', fontSize: 13, textAlign: 'center',
                }}>
                  🎙 Μιλήστε τώρα... {voice.interim && <strong>{voice.interim}</strong>}
                </div>
              )}
              {voice.error && (
                <div style={{ marginTop: 8, color: '#ef4444', fontSize: 12 }}>{voice.error}</div>
              )}
              {duplicateWarning && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', fontSize: 13, fontWeight: 600,
                }}>
                  {duplicateWarning}
                </div>
              )}
            </div>

            {/* Wash Type Selection */}
            <div style={{
              padding: 20, borderRadius: 20,
              background: 'rgba(30,41,59,0.5)',
              border: '1px solid rgba(148,163,184,0.1)',
              marginBottom: 16,
            }}>
              <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 12, display: 'block' }}>
                ΤΥΠΟΣ ΠΛΥΣΙΜΑΤΟΣ
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {WASH_TYPES.map(wt => (
                  <button
                    key={wt.type}
                    onClick={() => setSelectedType(wt.type)}
                    style={{
                      padding: '16px 14px', borderRadius: 14,
                      border: selectedType === wt.type
                        ? `2px solid ${wt.color}`
                        : '2px solid rgba(148,163,184,0.08)',
                      background: selectedType === wt.type
                        ? `${wt.color}12`
                        : 'rgba(15,23,42,0.4)',
                      color: selectedType === wt.type ? wt.color : '#94a3b8',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{wt.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{wt.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>~{wt.minutes}′ • {wt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Selection */}
            <div style={{
              padding: 16, borderRadius: 20,
              background: 'rgba(30,41,59,0.5)',
              border: '1px solid rgba(148,163,184,0.1)',
              marginBottom: 20,
            }}>
              <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 10, display: 'block' }}>
                ΠΡΟΤΕΡΑΙΟΤΗΤΑ
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { p: 'normal' as const, label: 'Κανονική', icon: '🟢', color: '#94a3b8' },
                  { p: 'urgent' as const, label: 'Επείγον', icon: '🔴', color: '#ef4444' },
                  { p: 'vip' as const, label: 'VIP', icon: '👑', color: '#a855f7' },
                ]).map(pr => (
                  <button
                    key={pr.p}
                    onClick={() => setPriority(pr.p)}
                    style={{
                      flex: 1, padding: '12px 10px', borderRadius: 12,
                      border: priority === pr.p
                        ? `2px solid ${pr.color}`
                        : '2px solid rgba(148,163,184,0.08)',
                      background: priority === pr.p ? `${pr.color}12` : 'rgba(15,23,42,0.4)',
                      color: priority === pr.p ? pr.color : '#94a3b8',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {pr.icon} {pr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAdd}
              disabled={!plate.trim() || !!duplicateWarning}
              style={{
                width: '100%', padding: '18px 0', borderRadius: 16,
                border: 'none', fontSize: 18, fontWeight: 800,
                cursor: plate.trim() && !duplicateWarning ? 'pointer' : 'not-allowed',
                background: plate.trim() && !duplicateWarning
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'rgba(59,130,246,0.15)',
                color: '#fff',
                boxShadow: plate.trim() && !duplicateWarning
                  ? '0 4px 20px rgba(59,130,246,0.3)'
                  : 'none',
                transition: 'all 0.3s',
              }}
            >
              {duplicateWarning ? '🚫 Υπάρχει ήδη' : '➕ Προσθήκη στην Ουρά'}
            </button>
          </div>
        )}

        {/* ═══ QUEUE TAB ═══ */}
        {activeTab === 'queue' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {/* Quick stats */}
            <div style={{
              display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto',
              padding: '0 0 8px 0',
            }}>
              {Object.entries(STATUS_LABELS).map(([status, cfg]) => {
                const count = washer.queue.filter(r => r.status === status).length;
                return (
                  <div key={status} style={{
                    flex: 1, minWidth: 80, padding: '10px 12px', borderRadius: 12,
                    background: `${cfg.color}08`, border: `1px solid ${cfg.color}20`,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{count}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{cfg.icon} {cfg.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Queue items */}
            {washer.queue
              .filter(r => r.status !== 'inspected')
              .sort((a, b) => {
                const order: Record<WashStatus, number> = { in_progress: 0, waiting: 1, done: 2, inspected: 3 };
                const priOrder = { urgent: 0, vip: 1, normal: 2 };
                const statusCmp = order[a.status] - order[b.status];
                if (statusCmp !== 0) return statusCmp;
                return priOrder[a.priority] - priOrder[b.priority];
              })
              .map(record => {
                const scfg = STATUS_LABELS[record.status];
                const wt = WASH_TYPES.find(w => w.type === record.washType)!;
                const isExpanded = expandedId === record.id;
                const isMine = record.assignedTo === washerId;
                const checkDone = record.checklist.filter(c => c.checked).length;
                const checkTotal = record.checklist.length;

                return (
                  <div
                    key={record.id}
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    style={{
                      padding: 14, borderRadius: 16, marginBottom: 8,
                      background: isMine ? 'rgba(59,130,246,0.06)' : 'rgba(30,41,59,0.4)',
                      border: isMine
                        ? '1px solid rgba(59,130,246,0.2)'
                        : record.priority === 'urgent'
                          ? '1px solid rgba(239,68,68,0.3)'
                          : '1px solid rgba(148,163,184,0.06)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{scfg.icon}</span>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1.5 }}>
                            {record.plate}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: `${wt.color}15`, color: wt.color,
                            }}>{wt.icon} {wt.label}</span>
                            {record.priority !== 'normal' && (
                              <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                background: record.priority === 'urgent' ? 'rgba(239,68,68,0.12)' : 'rgba(168,85,247,0.12)',
                                color: record.priority === 'urgent' ? '#ef4444' : '#a855f7',
                              }}>{record.priority === 'urgent' ? '🔴 Επείγον' : '👑 VIP'}</span>
                            )}
                            {isMine && (
                              <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                              }}>🙋 Δικό μου</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {record.status === 'in_progress' && record.startedAt && (
                          <LiveTimer startedAt={record.startedAt} estimatedMin={wt.minutes} />
                        )}
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(record.requestedAt).toLocaleTimeString('el', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar for in_progress */}
                    {record.status === 'in_progress' && checkTotal > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{
                          height: 4, borderRadius: 2,
                          background: 'rgba(148,163,184,0.1)',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            background: checkDone === checkTotal ? '#22c55e' : '#3b82f6',
                            width: `${(checkDone / checkTotal) * 100}%`,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'right' }}>
                          {checkDone}/{checkTotal}
                        </div>
                      </div>
                    )}

                    {/* Expanded: checklist + actions */}
                    {isExpanded && (
                      <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
                        {/* Checklist (only when in_progress) */}
                        {record.status === 'in_progress' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                            {record.checklist.map(item => (
                              <div
                                key={item.id}
                                onClick={() => washer.toggleChecklistItem(record.id, item.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '8px 12px', borderRadius: 10,
                                  background: item.checked ? 'rgba(34,197,94,0.06)' : 'rgba(15,23,42,0.3)',
                                  border: '1px solid rgba(148,163,184,0.04)',
                                  cursor: 'pointer', fontSize: 14,
                                  minHeight: 44, // touch target
                                }}
                              >
                                <div style={{
                                  width: 22, height: 22, borderRadius: 6,
                                  border: item.checked ? 'none' : '2px solid rgba(148,163,184,0.2)',
                                  background: item.checked ? '#22c55e' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontSize: 13, flexShrink: 0,
                                }}>
                                  {item.checked && '✓'}
                                </div>
                                <span style={{
                                  textDecoration: item.checked ? 'line-through' : 'none',
                                  color: item.checked ? '#64748b' : '#e2e8f0',
                                }}>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {record.status === 'waiting' && (
                            <>
                              <button
                                onClick={() => washer.startWash(record.id, washerId)}
                                style={{
                                  flex: 1, padding: '12px 16px', borderRadius: 12,
                                  border: 'none', background: '#3b82f6', color: '#fff',
                                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                  minHeight: 48,
                                }}
                              >
                                ▶ Ξεκίνα Πλύσιμο
                              </button>
                              {!isMine && (
                                <button
                                  onClick={() => washer.reassignWasher(record.id, washerId)}
                                  style={{
                                    padding: '12px 16px', borderRadius: 12,
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    background: 'rgba(59,130,246,0.08)', color: '#60a5fa',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    minHeight: 48,
                                  }}
                                >
                                  🙋 Ανάθεση
                                </button>
                              )}
                            </>
                          )}
                          {record.status === 'in_progress' && (
                            <button
                              onClick={() => washer.completeWash(record.id)}
                              style={{
                                flex: 1, padding: '12px 16px', borderRadius: 12,
                                border: 'none',
                                background: checkDone === checkTotal
                                  ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(34,197,94,0.15)',
                                color: '#fff', fontSize: 15, fontWeight: 700,
                                cursor: 'pointer', minHeight: 48,
                              }}
                            >
                              ✅ Ολοκλήρωση {checkDone < checkTotal && `(${checkDone}/${checkTotal})`}
                            </button>
                          )}
                          {record.status === 'done' && (
                            <div style={{
                              flex: 1, padding: '12px 16px', borderRadius: 12,
                              background: 'rgba(34,197,94,0.08)',
                              border: '1px solid rgba(34,197,94,0.2)',
                              color: '#22c55e', fontSize: 14, fontWeight: 600,
                              textAlign: 'center',
                            }}>
                              ✅ Ολοκληρώθηκε — αναμονή ελέγχου
                            </div>
                          )}
                        </div>

                        {/* Timestamps */}
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 8, lineHeight: 1.6 }}>
                          Ζητήθηκε: {new Date(record.requestedAt).toLocaleString('el')}
                          {record.startedAt && <><br />Ξεκίνησε: {new Date(record.startedAt).toLocaleTimeString('el')}</>}
                          {record.completedAt && <><br />Τέλος: {new Date(record.completedAt).toLocaleTimeString('el')}</>}
                          {record.duration && <> ({record.duration}′)</>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            {washer.queue.filter(r => r.status !== 'inspected').length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚿</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Η ουρά είναι κενή</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Πατήστε «➕ Νέο Πλύσιμο» για να ξεκινήσετε</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ MY JOBS TAB ═══ */}
        {activeTab === 'my' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {/* Today summary */}
            <div style={{
              display: 'flex', gap: 12, marginBottom: 16,
            }}>
              <div style={{
                flex: 1, padding: '16px 14px', borderRadius: 14,
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.15)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>
                  {washer.queue.filter(r => r.assignedTo === washerId && (r.status === 'done' || r.status === 'inspected')).length}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Ολοκληρώθηκαν</div>
              </div>
              <div style={{
                flex: 1, padding: '16px 14px', borderRadius: 14,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.15)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>
                  {myJobs.filter(r => r.status === 'in_progress').length}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Σε εξέλιξη</div>
              </div>
              <div style={{
                flex: 1, padding: '16px 14px', borderRadius: 14,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
                  {myJobs.filter(r => r.status === 'waiting').length}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Αναμονή</div>
              </div>
            </div>

            {/* My job cards */}
            {washer.queue
              .filter(r => r.assignedTo === washerId)
              .sort((a, b) => {
                const order: Record<WashStatus, number> = { in_progress: 0, waiting: 1, done: 2, inspected: 3 };
                return order[a.status] - order[b.status];
              })
              .map(record => {
                const scfg = STATUS_LABELS[record.status];
                const wt = WASH_TYPES.find(w => w.type === record.washType)!;
                const checkDone = record.checklist.filter(c => c.checked).length;
                const checkTotal = record.checklist.length;
                const isExpanded = expandedId === record.id;

                return (
                  <div
                    key={record.id}
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    style={{
                      padding: 16, borderRadius: 16, marginBottom: 10,
                      background: record.status === 'in_progress'
                        ? 'rgba(59,130,246,0.08)' : 'rgba(30,41,59,0.4)',
                      border: `1px solid ${scfg.color}30`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{scfg.icon}</span>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1.5 }}>{record.plate}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            {wt.icon} {wt.label} • {scfg.label}
                          </div>
                        </div>
                      </div>
                      {record.status === 'in_progress' && record.startedAt && (
                        <LiveTimer startedAt={record.startedAt} estimatedMin={wt.minutes} />
                      )}
                    </div>

                    {/* Progress */}
                    {record.status === 'in_progress' && checkTotal > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{
                          height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.1)',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            background: checkDone === checkTotal ? '#22c55e' : '#3b82f6',
                            width: `${(checkDone / checkTotal) * 100}%`,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>Πρόοδος</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{checkDone}/{checkTotal}</span>
                        </div>
                      </div>
                    )}

                    {/* Expanded checklist + actions */}
                    {isExpanded && (
                      <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
                        {record.status === 'in_progress' && record.checklist.map(item => (
                          <div
                            key={item.id}
                            onClick={() => washer.toggleChecklistItem(record.id, item.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 12px', borderRadius: 10,
                              background: item.checked ? 'rgba(34,197,94,0.06)' : 'transparent',
                              cursor: 'pointer', fontSize: 14, marginBottom: 4,
                              minHeight: 44,
                            }}
                          >
                            <div style={{
                              width: 24, height: 24, borderRadius: 7,
                              border: item.checked ? 'none' : '2px solid rgba(148,163,184,0.2)',
                              background: item.checked ? '#22c55e' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 14, flexShrink: 0,
                            }}>
                              {item.checked && '✓'}
                            </div>
                            <span style={{
                              textDecoration: item.checked ? 'line-through' : 'none',
                              color: item.checked ? '#64748b' : '#e2e8f0',
                            }}>{item.label}</span>
                          </div>
                        ))}

                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          {record.status === 'waiting' && (
                            <button
                              onClick={() => washer.startWash(record.id, washerId)}
                              style={{
                                flex: 1, padding: '14px 16px', borderRadius: 12,
                                border: 'none', background: '#3b82f6', color: '#fff',
                                fontSize: 16, fontWeight: 700, cursor: 'pointer', minHeight: 48,
                              }}
                            >▶ Ξεκίνα</button>
                          )}
                          {record.status === 'in_progress' && (
                            <button
                              onClick={() => washer.completeWash(record.id)}
                              style={{
                                flex: 1, padding: '14px 16px', borderRadius: 12,
                                border: 'none',
                                background: checkDone === checkTotal
                                  ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(34,197,94,0.2)',
                                color: '#fff', fontSize: 16, fontWeight: 700,
                                cursor: 'pointer', minHeight: 48,
                              }}
                            >✅ Ολοκλήρωση</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            {washer.queue.filter(r => r.assignedTo === washerId).length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🙋</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Δεν έχεις εργασίες</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Πήγαινε στη «➕ Νέο Πλύσιμο» ή ανάλαβε κάτι από την ουρά</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Embedded Mini Chat ── */}
      <MiniChat />

      {/* ── Animations ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default WashPortal;
