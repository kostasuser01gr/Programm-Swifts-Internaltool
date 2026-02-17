import React, { useState, useMemo, useEffect } from 'react';
import { useWasherStore } from '../../store/washerStore';
import { useFleetStore } from '../../store/fleetStore';
import { useAuthStore } from '../../store/authStore';
import type { WashStatus, WashType, WashRecord } from '../../types/platform';

// ─── Inspection Checklist Items ──────────────────────────────
const INSPECTION_ITEMS = [
  { id: 'ins-1', label: 'Εξωτερικό καθαρό (αμάξωμα)', category: 'exterior' },
  { id: 'ins-2', label: 'Παράθυρα / καθρέφτες', category: 'exterior' },
  { id: 'ins-3', label: 'Ζάντες / ελαστικά', category: 'exterior' },
  { id: 'ins-4', label: 'Εσωτερικό (καθίσματα / πατάκια)', category: 'interior' },
  { id: 'ins-5', label: 'Ταμπλό / κονσόλα / χώροι', category: 'interior' },
  { id: 'ins-6', label: 'Πορτ μπαγκάζ', category: 'interior' },
  { id: 'ins-7', label: 'Αρωματικό / φρεσκάδα', category: 'final' },
  { id: 'ins-8', label: 'Χωρίς ζημιά / γρατζουνιά', category: 'final' },
] as const;

// ─── Washer App (stand-alone route at /washer) ───────────────
// Kanban-style wash queue with drag-like interactions.
// Pure inline styles for mobile-first glass UI.

const STATUS_CONFIG: Record<WashStatus, { label: string; color: string; icon: string }> = {
  waiting:     { label: 'Αναμονή',      color: '#f59e0b', icon: '⏳' },
  in_progress: { label: 'Σε εξέλιξη',   color: '#3b82f6', icon: '🔄' },
  done:        { label: 'Ολοκληρώθηκε', color: '#22c55e', icon: '✅' },
  inspected:   { label: 'Επιθεωρήθηκε', color: '#a855f7', icon: '🔍' },
};

const WASH_TYPE_CONFIG: Record<WashType, { label: string; color: string; icon: string; minutes: number }> = {
  quick:    { label: 'Γρήγορο',  color: '#22c55e', icon: '⚡', minutes: 15 },
  standard: { label: 'Κανονικό', color: '#3b82f6', icon: '🚿', minutes: 30 },
  deep:     { label: 'Βαθύ',     color: '#f59e0b', icon: '✨', minutes: 60 },
  vip:      { label: 'VIP',      color: '#a855f7', icon: '👑', minutes: 90 },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  normal: { label: 'Κανονική', color: '#94a3b8' },
  urgent: { label: 'Επείγον', color: '#ef4444' },
  vip:    { label: 'VIP', color: '#a855f7' },
};

const st: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', flexDirection: 'column',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid rgba(148,163,184,0.08)',
    backdropFilter: 'blur(10px)', background: 'rgba(15,23,42,0.7)',
    position: 'sticky' as const, top: 0, zIndex: 100,
  },
  topTitle: {
    fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
  },
  statsBar: {
    display: 'flex', gap: 10, padding: '12px 20px', overflowX: 'auto' as const,
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  statCard: {
    padding: '10px 16px', borderRadius: 14,
    border: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(30,41,59,0.4)', minWidth: 100,
    textAlign: 'center' as const, flexShrink: 0,
  },
  statNumber: {
    fontSize: 28, fontWeight: 700,
  },
  statLabel: {
    fontSize: 11, color: '#94a3b8', marginTop: 2,
  },
  viewToggle: {
    display: 'flex', gap: 4, background: 'rgba(30,41,59,0.5)',
    padding: 3, borderRadius: 10, marginRight: 0,
  },
  viewBtn: {
    padding: '6px 14px', borderRadius: 8, border: 'none',
    background: 'transparent', color: '#94a3b8', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
  },
  viewBtnActive: {
    background: '#3b82f6', color: '#fff',
  },
  kanbanContainer: {
    display: 'flex', gap: 16, padding: 20, flex: 1,
    overflowX: 'auto' as const,
  },
  kanbanColumn: {
    flex: 1, minWidth: 280, borderRadius: 16,
    background: 'rgba(30,41,59,0.3)',
    border: '1px solid rgba(148,163,184,0.06)',
    display: 'flex', flexDirection: 'column' as const,
    maxHeight: 'calc(100vh - 200px)',
  },
  columnHeader: {
    padding: '14px 16px', borderBottom: '1px solid rgba(148,163,184,0.06)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: '16px 16px 0 0',
  },
  columnTitle: {
    fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
  },
  columnCount: {
    padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
  },
  columnBody: {
    flex: 1, overflowY: 'auto' as const, padding: 8,
  },
  washCard: {
    padding: 14, borderRadius: 14, marginBottom: 8,
    border: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(15,23,42,0.4)', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  washCardUrgent: {
    borderLeft: '3px solid #ef4444',
  },
  washCardVip: {
    borderLeft: '3px solid #a855f7',
  },
  plateBig: {
    fontSize: 18, fontWeight: 800, letterSpacing: 1.5,
  },
  washMeta: {
    fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' as const,
  },
  badge: {
    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 3,
  },
  checklist: {
    marginTop: 10, display: 'flex', flexDirection: 'column' as const, gap: 4,
  },
  checkItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, padding: '4px 0', cursor: 'pointer',
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    border: '2px solid rgba(148,163,184,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, flexShrink: 0, cursor: 'pointer',
    transition: 'all 0.15s',
  },
  checkboxChecked: {
    background: '#22c55e', borderColor: '#22c55e', color: '#fff',
  },
  actions: {
    display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' as const,
  },
  actionBtn: {
    padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(51,65,85,0.4)', color: '#e2e8f0', cursor: 'pointer',
    fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
  },
  actionBtnPrimary: {
    background: '#3b82f6', borderColor: '#3b82f6', color: '#fff',
  },
  addForm: {
    padding: 20, borderRadius: 16,
    border: '1px solid rgba(148,163,184,0.1)',
    background: 'rgba(30,41,59,0.5)', margin: '0 20px 20px',
  },
  input: {
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(15,23,42,0.5)', color: '#e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  },
  select: {
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(15,23,42,0.5)', color: '#e2e8f0',
    fontSize: 13, outline: 'none',
  },
  btnPrimary: {
    padding: '10px 24px', borderRadius: 12, border: 'none',
    background: '#3b82f6', color: '#fff', fontSize: 14,
    fontWeight: 600, cursor: 'pointer',
  },
  listRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.06)',
    background: 'rgba(30,41,59,0.3)', marginBottom: 6,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  timer: {
    fontSize: 12, color: '#f59e0b', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 4,
  },
  homeBtn: {
    padding: '8px 14px', borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(30,41,59,0.6)', color: '#94a3b8',
    cursor: 'pointer', fontSize: 13,
  },
};

function WashCardDetail({ record, expanded, onToggle }: { record: WashRecord; expanded: boolean; onToggle: () => void }) {
  const washer = useWasherStore();
  const { currentProfile } = useAuthStore();
  const wtc = WASH_TYPE_CONFIG[record.washType];
  const prc = PRIORITY_CONFIG[record.priority];

  // ── Live elapsed timer (updates every second when in_progress) ──
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (record.status !== 'in_progress' || !record.startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [record.status, record.startedAt]);

  const elapsedMs = record.startedAt ? now - new Date(record.startedAt).getTime() : 0;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
  const estimatedMin = wtc.minutes;
  const overdue = elapsedMin >= estimatedMin;

  const checkDone = record.checklist.filter(c => c.checked).length;
  const checkTotal = record.checklist.length;

  // Inspection form state
  const [showInspection, setShowInspection] = useState(false);
  const [inspItems, setInspItems] = useState<Record<string, 'pass' | 'fail' | null>>(
    () => Object.fromEntries(INSPECTION_ITEMS.map(i => [i.id, null]))
  );
  const [inspNotes, setInspNotes] = useState('');
  const [inspDamage, setInspDamage] = useState(false);

  const inspPassed = useMemo(() => INSPECTION_ITEMS.every(i => inspItems[i.id] === 'pass'), [inspItems]);
  const inspComplete = useMemo(() => INSPECTION_ITEMS.every(i => inspItems[i.id] !== null), [inspItems]);
  const inspFailCount = useMemo(() => INSPECTION_ITEMS.filter(i => inspItems[i.id] === 'fail').length, [inspItems]);

  const handleInspectionSubmit = (pass: boolean) => {
    if (!currentProfile) return;
    const failedLabels = INSPECTION_ITEMS.filter(i => inspItems[i.id] === 'fail').map(i => i.label);
    const fullNotes = [
      ...failedLabels.map(l => `❌ ${l}`),
      inspNotes.trim() ? inspNotes.trim() : null,
      inspDamage ? '⚠️ Ζημιά εντοπίστηκε' : null,
    ].filter(Boolean).join('\n');
    if (inspDamage) washer.setDamageFound(record.id, true, fullNotes);
    washer.inspectWash(record.id, currentProfile.id, pass, fullNotes || undefined);
    setShowInspection(false);
    setInspNotes('');
    setInspItems(Object.fromEntries(INSPECTION_ITEMS.map(i => [i.id, null])));
  };

  return (
    <div
      style={{
        ...st.washCard,
        ...(record.priority === 'urgent' ? st.washCardUrgent : {}),
        ...(record.priority === 'vip' ? st.washCardVip : {}),
      }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={st.plateBig}>{record.plate}</div>
          <div style={st.washMeta}>
            <span style={{ ...st.badge, background: `${wtc.color}15`, color: wtc.color }}>
              {wtc.icon} {wtc.label}
            </span>
            {record.priority !== 'normal' && (
              <span style={{ ...st.badge, background: `${prc.color}15`, color: prc.color }}>
                {prc.label}
              </span>
            )}
            <span>{record.category}</span>
            {record.assignedTo && record.status === 'waiting' && (
              <span style={{ ...st.badge, background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                🙋 Ανατέθηκε
              </span>
            )}
          </div>
        </div>
        {record.status === 'in_progress' && (
          <div style={{ ...st.timer, color: overdue ? '#ef4444' : '#f59e0b' }}>
            ⏱ {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
            <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>/ {estimatedMin}'</span>
            {overdue && <span style={{ marginLeft: 4, fontSize: 10 }}>⚠️</span>}
          </div>
        )}
      </div>

      {record.status === 'in_progress' && checkTotal > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
            <span>Πρόοδος</span>
            <span>{checkDone}/{checkTotal}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.1)' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: checkDone === checkTotal ? '#22c55e' : '#3b82f6',
              width: `${(checkDone / checkTotal) * 100}%`,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {expanded && (
        <>
          {record.status === 'in_progress' && (
            <div style={st.checklist}>
              {record.checklist.map(item => (
                <div
                  key={item.id}
                  style={st.checkItem}
                  onClick={e => { e.stopPropagation(); washer.toggleChecklistItem(record.id, item.id); }}
                >
                  <div style={{ ...st.checkbox, ...(item.checked ? st.checkboxChecked : {}) }}>
                    {item.checked ? '✓' : ''}
                  </div>
                  <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#64748b' : '#e2e8f0' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Before / After Photo Comparison */}
          {(record.beforePhotos.length > 0 || record.afterPhotos.length > 0) && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>📸 Πριν / Μετά</div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {record.beforePhotos.map((p, i) => (
                  <div key={`b-${i}`} style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={p} alt={`Πριν ${i + 1}`} style={{
                      width: 80, height: 60, objectFit: 'cover', borderRadius: 8,
                      border: '2px solid rgba(245,158,11,0.4)',
                    }} />
                    <div style={{
                      position: 'absolute', bottom: 2, left: 2, fontSize: 9,
                      background: 'rgba(245,158,11,0.8)', color: '#fff',
                      padding: '1px 4px', borderRadius: 4,
                    }}>Πριν</div>
                  </div>
                ))}
                {record.afterPhotos.map((p, i) => (
                  <div key={`a-${i}`} style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={p} alt={`Μετά ${i + 1}`} style={{
                      width: 80, height: 60, objectFit: 'cover', borderRadius: 8,
                      border: '2px solid rgba(34,197,94,0.4)',
                    }} />
                    <div style={{
                      position: 'absolute', bottom: 2, left: 2, fontSize: 9,
                      background: 'rgba(34,197,94,0.8)', color: '#fff',
                      padding: '1px 4px', borderRadius: 4,
                    }}>Μετά</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={st.actions}>
            {record.status === 'waiting' && currentProfile && (
              <>
                <button
                  style={{ ...st.actionBtn, ...st.actionBtnPrimary }}
                  onClick={e => { e.stopPropagation(); washer.startWash(record.id, currentProfile.id); }}
                >
                  ▶ Ξεκίνα
                </button>
                {!record.assignedTo && (
                  <button
                    style={{ ...st.actionBtn, background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.3)', color: '#60a5fa' }}
                    onClick={e => { e.stopPropagation(); washer.reassignWasher(record.id, currentProfile.id); }}
                  >
                    🙋 Ανάθεση σε εμένα
                  </button>
                )}
                {record.assignedTo === currentProfile.id && (
                  <span style={{ fontSize: 11, color: '#60a5fa', alignSelf: 'center' }}>✓ Ανατέθηκε σε εσένα</span>
                )}
              </>
            )}
            {record.status === 'in_progress' && (
              <button
                style={{ ...st.actionBtn, ...st.actionBtnPrimary, background: '#22c55e', borderColor: '#22c55e' }}
                onClick={e => { e.stopPropagation(); washer.completeWash(record.id); }}
              >
                ✅ Ολοκλήρωση
              </button>
            )}
            {record.status === 'done' && currentProfile && !showInspection && (
              <button
                style={{ ...st.actionBtn, ...st.actionBtnPrimary, background: '#a855f7', borderColor: '#a855f7' }}
                onClick={e => { e.stopPropagation(); setShowInspection(true); }}
              >
                🔍 Επιθεώρηση
              </button>
            )}
            <button
              style={{ ...st.actionBtn, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
              onClick={e => { e.stopPropagation(); washer.removeFromQueue(record.id); }}
            >
              🗑
            </button>
          </div>

          {/* ── Inline Inspection Form ── */}
          {showInspection && record.status === 'done' && (
            <div onClick={e => e.stopPropagation()} style={{
              marginTop: 12, padding: 14, borderRadius: 12,
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(168,85,247,0.2)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 6 }}>
                🔍 Φόρμα Επιθεώρησης
              </div>

              {/* Inspection checklist grouped by category */}
              {(['exterior', 'interior', 'final'] as const).map(cat => {
                const catItems = INSPECTION_ITEMS.filter(i => i.category === cat);
                const catLabel = cat === 'exterior' ? 'Εξωτερικά' : cat === 'interior' ? 'Εσωτερικά' : 'Τελικός Έλεγχος';
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>{catLabel}</div>
                    {catItems.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.04)',
                      }}>
                        <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1 }}>{item.label}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            style={{
                              width: 32, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                              background: inspItems[item.id] === 'pass' ? '#22c55e' : 'rgba(34,197,94,0.08)',
                              color: inspItems[item.id] === 'pass' ? '#fff' : '#22c55e',
                              fontSize: 14, transition: 'all 0.15s',
                            }}
                            onClick={() => setInspItems(prev => ({ ...prev, [item.id]: 'pass' }))}
                            title="OK"
                          >✓</button>
                          <button
                            style={{
                              width: 32, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                              background: inspItems[item.id] === 'fail' ? '#ef4444' : 'rgba(239,68,68,0.08)',
                              color: inspItems[item.id] === 'fail' ? '#fff' : '#ef4444',
                              fontSize: 14, transition: 'all 0.15s',
                            }}
                            onClick={() => setInspItems(prev => ({ ...prev, [item.id]: 'fail' }))}
                            title="Αποτυχία"
                          >✗</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Damage toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 0', marginBottom: 8,
              }}>
                <div
                  onClick={() => setInspDamage(!inspDamage)}
                  style={{
                    ...st.checkbox,
                    ...(inspDamage ? { background: '#ef4444', borderColor: '#ef4444', color: '#fff' } : {}),
                    cursor: 'pointer',
                  }}
                >{inspDamage ? '✓' : ''}</div>
                <span style={{ fontSize: 13, color: inspDamage ? '#ef4444' : '#e2e8f0' }}>
                  ⚠️ Εντοπίστηκε ζημιά
                </span>
              </div>

              {/* Notes */}
              <textarea
                value={inspNotes}
                onChange={e => setInspNotes(e.target.value)}
                placeholder="Σημειώσεις επιθεώρησης..."
                rows={2}
                style={{
                  ...st.input, width: '100%', resize: 'vertical',
                  fontFamily: 'inherit', marginBottom: 10,
                }}
              />

              {/* Summary + action buttons */}
              {inspComplete && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                  background: inspPassed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${inspPassed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  fontSize: 13,
                  color: inspPassed ? '#22c55e' : '#ef4444',
                }}>
                  {inspPassed
                    ? '✅ Όλα τα σημεία ελέγχου OK'
                    : `❌ ${inspFailCount} σημείο(-α) απέτυχε(-αν) — θα ξαναμπεί στην ουρά`}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{
                    ...st.actionBtn, ...st.actionBtnPrimary,
                    background: '#22c55e', borderColor: '#22c55e',
                    opacity: (!inspComplete || !inspPassed) ? 0.4 : 1,
                    cursor: (!inspComplete || !inspPassed) ? 'not-allowed' : 'pointer',
                  }}
                  disabled={!inspComplete || !inspPassed}
                  onClick={() => handleInspectionSubmit(true)}
                >
                  ✅ Πέρασε
                </button>
                <button
                  style={{
                    ...st.actionBtn,
                    background: 'rgba(239,68,68,0.12)',
                    borderColor: '#ef4444', color: '#ef4444',
                    opacity: !inspComplete ? 0.4 : 1,
                    cursor: !inspComplete ? 'not-allowed' : 'pointer',
                  }}
                  disabled={!inspComplete}
                  onClick={() => handleInspectionSubmit(false)}
                >
                  ↩ Αποτυχία / Ξαναπλύσιμο
                </button>
                <button
                  style={{ ...st.actionBtn }}
                  onClick={() => setShowInspection(false)}
                >
                  Ακύρωση
                </button>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
            Ζητήθηκε: {new Date(record.requestedAt).toLocaleString('el')}
            {record.startedAt && ` • Ξεκίνησε: ${new Date(record.startedAt).toLocaleTimeString('el')}`}
            {record.completedAt && ` • Τέλος: ${new Date(record.completedAt).toLocaleTimeString('el')}`}
            {record.inspectedAt && ` • Επιθεώρηση: ${new Date(record.inspectedAt).toLocaleTimeString('el')}`}
          </div>
        </>
      )}
    </div>
  );
}

export function WasherApp() {
  const washer = useWasherStore();
  const { currentProfile } = useAuthStore();
  const stats = washer.getQueueStats();
  const byStatus = washer.getQueueByStatus();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newWashType, setNewWashType] = useState<WashType>('standard');
  const [newPriority, setNewPriority] = useState<WashRecord['priority']>('normal');

  const handleAddToQueue = () => {
    if (!newPlate.trim() || !currentProfile) return;
    washer.addToQueue(newPlate.trim().toUpperCase(), 'economy', newWashType, newPriority, currentProfile.id);
    setNewPlate('');
    setShowAddForm(false);
  };

  const handleNavigateHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={st.page}>
      {/* Top Bar */}
      <div style={st.topBar}>
        <div style={st.topTitle}>🚿 Πλυντήρια</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={st.viewToggle}>
            <button
              style={{ ...st.viewBtn, ...(washer.viewMode === 'kanban' ? st.viewBtnActive : {}) }}
              onClick={() => washer.setViewMode('kanban')}
            >
              Kanban
            </button>
            <button
              style={{ ...st.viewBtn, ...(washer.viewMode === 'list' ? st.viewBtnActive : {}) }}
              onClick={() => washer.setViewMode('list')}
            >
              Λίστα
            </button>
          </div>
          <button style={st.btnPrimary} onClick={() => setShowAddForm(!showAddForm)}>
            ➕ Νέο
          </button>
          <button style={st.homeBtn} onClick={handleNavigateHome}>🏠</button>
        </div>
      </div>

      {/* Stats */}
      <div style={st.statsBar}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} style={st.statCard}>
            <div style={{ ...st.statNumber, color: cfg.color }}>
              {stats[status === 'in_progress' ? 'inProgress' : status as keyof typeof stats] || 0}
            </div>
            <div style={st.statLabel}>{cfg.icon} {cfg.label}</div>
          </div>
        ))}
        <div style={st.statCard}>
          <div style={{ ...st.statNumber, color: '#e2e8f0' }}>{washer.todayCompleted}</div>
          <div style={st.statLabel}>📊 Σήμερα</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={st.addForm}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>➕ Προσθήκη στην Ουρά</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Πινακίδα</div>
              <input
                style={{ ...st.input, width: 160, textTransform: 'uppercase' }}
                placeholder="ΗΡΑ-0000"
                value={newPlate}
                onChange={e => setNewPlate(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Τύπος</div>
              <select style={st.select} value={newWashType} onChange={e => setNewWashType(e.target.value as WashType)}>
                {Object.entries(WASH_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label} (~{v.minutes}\')</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Προτεραιότητα</div>
              <select style={st.select} value={newPriority} onChange={e => setNewPriority(e.target.value as WashRecord['priority'])}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <button style={st.btnPrimary} onClick={handleAddToQueue} disabled={!newPlate.trim()}>
              Προσθήκη
            </button>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {washer.viewMode === 'kanban' && (
        <div style={st.kanbanContainer}>
          {(['waiting', 'in_progress', 'done', 'inspected'] as WashStatus[]).map(status => {
            const cfg = STATUS_CONFIG[status];
            const records = byStatus[status] || [];
            return (
              <div key={status} style={st.kanbanColumn}>
                <div style={{ ...st.columnHeader, background: `${cfg.color}08` }}>
                  <div style={st.columnTitle}>
                    <span>{cfg.icon}</span> {cfg.label}
                  </div>
                  <div style={{ ...st.columnCount, background: `${cfg.color}15`, color: cfg.color }}>
                    {records.length}
                  </div>
                </div>
                <div style={st.columnBody}>
                  {records.map(record => (
                    <WashCardDetail
                      key={record.id}
                      record={record}
                      expanded={expandedId === record.id}
                      onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    />
                  ))}
                  {records.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 24, color: '#475569', fontSize: 13 }}>
                      Κενό
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {washer.viewMode === 'list' && (
        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {washer.getFilteredQueue().length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚿</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Η ουρά είναι κενή</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Πατήστε «➕ Νέο» για να προσθέσετε όχημα</div>
            </div>
          ) : (
            washer.getFilteredQueue().map(record => {
              const cfg = STATUS_CONFIG[record.status];
              const wtc = WASH_TYPE_CONFIG[record.washType];
              return (
                <div key={record.id} style={st.listRow} onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                  <div style={{ fontSize: 20 }}>{cfg.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>{record.plate}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {wtc.icon} {wtc.label} • {cfg.label}
                      {record.assignedTo && ` • Ανατέθηκε`}
                    </div>
                  </div>
                  {record.priority !== 'normal' && (
                    <div style={{ ...st.badge, background: `${PRIORITY_CONFIG[record.priority].color}15`, color: PRIORITY_CONFIG[record.priority].color }}>
                      {PRIORITY_CONFIG[record.priority].label}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(record.requestedAt).toLocaleTimeString('el', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default WasherApp;
