import { useState, useMemo, useEffect } from 'react';
import { useWasherStore } from '../../store/washerStore';
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
// Kanban-style wash queue. Tailwind theme-aware.

const STATUS_CONFIG: Record<WashStatus, { label: string; color: string; icon: string }> = {
  waiting:     { label: 'Αναμονή',      color: 'text-amber-500', icon: '⏳' },
  in_progress: { label: 'Σε εξέλιξη',   color: 'text-blue-500', icon: '🔄' },
  done:        { label: 'Ολοκληρώθηκε', color: 'text-green-500', icon: '✅' },
  inspected:   { label: 'Επιθεωρήθηκε', color: 'text-violet-500', icon: '🔍' },
};

const STATUS_RAW_COLORS: Record<WashStatus, { headerBg: string; countBg: string }> = {
  waiting:     { headerBg: 'bg-amber-500/5',  countBg: 'bg-amber-500/15' },
  in_progress: { headerBg: 'bg-blue-500/5',   countBg: 'bg-blue-500/15' },
  done:        { headerBg: 'bg-green-500/5',   countBg: 'bg-green-500/15' },
  inspected:   { headerBg: 'bg-violet-500/5',  countBg: 'bg-violet-500/15' },
};

const WASH_TYPE_CONFIG: Record<WashType, { label: string; color: string; icon: string; minutes: number }> = {
  quick:    { label: 'Γρήγορο',  color: 'text-green-500', icon: '⚡', minutes: 15 },
  standard: { label: 'Κανονικό', color: 'text-blue-500', icon: '🚿', minutes: 30 },
  deep:     { label: 'Βαθύ',     color: 'text-amber-500', icon: '✨', minutes: 60 },
  vip:      { label: 'VIP',      color: 'text-violet-500', icon: '👑', minutes: 90 },
};

const WASH_TYPE_BG: Record<WashType, string> = {
  quick: 'bg-green-500/10', standard: 'bg-blue-500/10', deep: 'bg-amber-500/10', vip: 'bg-violet-500/10',
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: 'Κανονική', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  urgent: { label: 'Επείγον', color: 'text-red-500', bg: 'bg-red-500/10' },
  vip:    { label: 'VIP', color: 'text-violet-500', bg: 'bg-violet-500/10' },
};

// Tailwind classes used directly in JSX — no inline style objects needed

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
    <article
      className={`p-3.5 rounded-[14px] mb-2 border border-slate-500/8 bg-slate-900/40 cursor-pointer transition-all duration-200 hover:bg-slate-800/50 ${record.priority === 'urgent' ? 'border-l-3 border-l-red-500' : record.priority === 'vip' ? 'border-l-3 border-l-violet-500' : ''}`}
      onClick={onToggle}
      role="listitem"
      aria-expanded={expanded}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-extrabold tracking-wider">{record.plate}</div>
          <div className="text-xs text-slate-400 mt-1 flex gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 ${WASH_TYPE_BG[record.washType]} ${WASH_TYPE_CONFIG[record.washType].color}`}>
              {wtc.icon} {wtc.label}
            </span>
            {record.priority !== 'normal' && (
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 ${PRIORITY_CONFIG[record.priority].bg} ${PRIORITY_CONFIG[record.priority].color}`}>
                {PRIORITY_CONFIG[record.priority].label}
              </span>
            )}
            <span>{record.category}</span>
            {record.assignedTo && record.status === 'waiting' && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400">
                🙋 Ανατέθηκε
              </span>
            )}
          </div>
        </div>
        {record.status === 'in_progress' && (
          <div className={`text-xs font-semibold flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-amber-500'}`}>
            ⏱ {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
            <span className="text-[10px] ml-1 opacity-70">/ {estimatedMin}'</span>
            {overdue && <span className="ml-1 text-[10px]">⚠️</span>}
          </div>
        )}
      </div>

      {record.status === 'in_progress' && checkTotal > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Πρόοδος</span>
            <span>{checkDone}/{checkTotal}</span>
          </div>
          <div className="h-1 rounded-sm bg-slate-500/10">
            <div className={`h-full rounded-sm transition-all duration-300 ${checkDone === checkTotal ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${(checkDone / checkTotal) * 100}%` }} />
          </div>
        </div>
      )}

      {expanded && (
        <>
          {record.status === 'in_progress' && (
            <div className="mt-2.5 flex flex-col gap-1">
              {record.checklist.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-[13px] py-1 cursor-pointer"
                  onClick={e => { e.stopPropagation(); washer.toggleChecklistItem(record.id, item.id); }}
                  role="checkbox"
                  aria-checked={item.checked}
                >
                  <span className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center text-[11px] shrink-0 transition-all duration-150 ${item.checked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500/20'}`}>
                    {item.checked ? '✓' : ''}
                  </span>
                  <span className={item.checked ? 'line-through text-slate-500' : 'text-slate-200'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Before / After Photo Comparison */}
          {(record.beforePhotos.length > 0 || record.afterPhotos.length > 0) && (
            <div className="mt-2.5">
              <div className="text-xs font-semibold text-slate-400 mb-1.5">📸 Πριν / Μετά</div>
              <div className="flex gap-2 overflow-x-auto">
                {record.beforePhotos.map((p, i) => (
                  <div key={`b-${i}`} className="relative shrink-0">
                    <img src={p} alt={`Πριν ${i + 1}`} className="w-20 h-[60px] object-cover rounded-lg border-2 border-amber-500/40" />
                    <div className="absolute bottom-0.5 left-0.5 text-[9px] bg-amber-500/80 text-white px-1 rounded">Πριν</div>
                  </div>
                ))}
                {record.afterPhotos.map((p, i) => (
                  <div key={`a-${i}`} className="relative shrink-0">
                    <img src={p} alt={`Μετά ${i + 1}`} className="w-20 h-[60px] object-cover rounded-lg border-2 border-green-500/40" />
                    <div className="absolute bottom-0.5 left-0.5 text-[9px] bg-green-500/80 text-white px-1 rounded">Μετά</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {record.status === 'waiting' && currentProfile && (
              <>
                <button
                  className="px-3 py-1.5 rounded-lg border border-blue-500 bg-blue-500 text-white cursor-pointer text-xs font-medium transition-all hover:bg-blue-600"
                  onClick={e => { e.stopPropagation(); washer.startWash(record.id, currentProfile.id); }}
                >
                  ▶ Ξεκίνα
                </button>
                {!record.assignedTo && (
                  <button
                    className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/8 text-blue-400 cursor-pointer text-xs font-medium transition-all hover:bg-blue-500/15"
                    onClick={e => { e.stopPropagation(); washer.reassignWasher(record.id, currentProfile.id); }}
                  >
                    🙋 Ανάθεση σε εμένα
                  </button>
                )}
                {record.assignedTo === currentProfile.id && (
                  <span className="text-[11px] text-blue-400 self-center">✓ Ανατέθηκε σε εσένα</span>
                )}
              </>
            )}
            {record.status === 'in_progress' && (
              <button
                className="px-3 py-1.5 rounded-lg border border-green-500 bg-green-500 text-white cursor-pointer text-xs font-medium transition-all hover:bg-green-600"
                onClick={e => { e.stopPropagation(); washer.completeWash(record.id); }}
              >
                ✅ Ολοκλήρωση
              </button>
            )}
            {record.status === 'done' && currentProfile && !showInspection && (
              <button
                className="px-3 py-1.5 rounded-lg border border-violet-500 bg-violet-500 text-white cursor-pointer text-xs font-medium transition-all hover:bg-violet-600"
                onClick={e => { e.stopPropagation(); setShowInspection(true); }}
              >
                🔍 Επιθεώρηση
              </button>
            )}
            <button
              className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 cursor-pointer text-xs font-medium transition-all hover:bg-red-500/10"
              onClick={e => { e.stopPropagation(); washer.removeFromQueue(record.id); }}
              aria-label="Διαγραφή"
            >
              🗑
            </button>
          </div>

          {/* ── Inline Inspection Form ── */}
          {showInspection && record.status === 'done' && (
            <div
              onClick={e => e.stopPropagation()}
              className="mt-3 p-3.5 rounded-xl bg-slate-900/60 border border-violet-500/20"
              role="form"
              aria-label="Φόρμα Επιθεώρησης"
            >
              <div className="text-sm font-bold mb-2.5 text-violet-500 flex items-center gap-1.5">
                🔍 Φόρμα Επιθεώρησης
              </div>

              {/* Inspection checklist grouped by category */}
              {(['exterior', 'interior', 'final'] as const).map(cat => {
                const catItems = INSPECTION_ITEMS.filter(i => i.category === cat);
                const catLabel = cat === 'exterior' ? 'Εξωτερικά' : cat === 'interior' ? 'Εσωτερικά' : 'Τελικός Έλεγχος';
                return (
                  <div key={cat} className="mb-2.5">
                    <div className="text-[11px] text-slate-500 font-semibold mb-1 uppercase">{catLabel}</div>
                    {catItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-500/4">
                        <span className="text-[13px] text-slate-200 flex-1">{item.label}</span>
                        <div className="flex gap-1">
                          <button
                            className={`w-8 h-7 rounded-md border-none cursor-pointer text-sm transition-all ${inspItems[item.id] === 'pass' ? 'bg-green-500 text-white' : 'bg-green-500/8 text-green-500'}`}
                            onClick={() => setInspItems(prev => ({ ...prev, [item.id]: 'pass' }))}
                            title="OK"
                            aria-label={`${item.label} — OK`}
                          >✓</button>
                          <button
                            className={`w-8 h-7 rounded-md border-none cursor-pointer text-sm transition-all ${inspItems[item.id] === 'fail' ? 'bg-red-500 text-white' : 'bg-red-500/8 text-red-500'}`}
                            onClick={() => setInspItems(prev => ({ ...prev, [item.id]: 'fail' }))}
                            title="Αποτυχία"
                            aria-label={`${item.label} — Αποτυχία`}
                          >✗</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Damage toggle */}
              <div className="flex items-center gap-2 py-2 mb-2">
                <button
                  onClick={() => setInspDamage(!inspDamage)}
                  className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center text-[11px] shrink-0 cursor-pointer transition-all duration-150 ${inspDamage ? 'bg-red-500 border-red-500 text-white' : 'border-slate-500/20 bg-transparent'}`}
                  role="checkbox"
                  aria-checked={inspDamage}
                  aria-label="Εντοπίστηκε ζημιά"
                >{inspDamage ? '✓' : ''}</button>
                <span className={`text-[13px] ${inspDamage ? 'text-red-500' : 'text-slate-200'}`}>
                  ⚠️ Εντοπίστηκε ζημιά
                </span>
              </div>

              {/* Notes */}
              <textarea
                value={inspNotes}
                onChange={e => setInspNotes(e.target.value)}
                placeholder="Σημειώσεις επιθεώρησης..."
                rows={2}
                className="w-full resize-y font-inherit mb-2.5 px-3 py-2 rounded-lg border border-slate-500/15 bg-slate-800/60 text-slate-200 text-sm outline-none transition-colors focus:border-blue-500/40"
                aria-label="Σημειώσεις επιθεώρησης"
              />

              {/* Summary + action buttons */}
              {inspComplete && (
                <div className={`px-3 py-2 rounded-lg mb-2.5 text-[13px] ${inspPassed ? 'bg-green-500/8 border border-green-500/20 text-green-500' : 'bg-red-500/8 border border-red-500/20 text-red-500'}`}>
                  {inspPassed
                    ? '✅ Όλα τα σημεία ελέγχου OK'
                    : `❌ ${inspFailCount} σημείο(-α) απέτυχε(-αν) — θα ξαναμπεί στην ουρά`}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg border border-green-500 bg-green-500 text-white cursor-pointer text-xs font-medium transition-all hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!inspComplete || !inspPassed}
                  onClick={() => handleInspectionSubmit(true)}
                >
                  ✅ Πέρασε
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg border border-red-500 bg-red-500/12 text-red-500 cursor-pointer text-xs font-medium transition-all hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!inspComplete}
                  onClick={() => handleInspectionSubmit(false)}
                >
                  ↩ Αποτυχία / Ξαναπλύσιμο
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg border border-slate-500/15 bg-transparent text-slate-400 cursor-pointer text-xs font-medium transition-all hover:bg-slate-500/10"
                  onClick={() => setShowInspection(false)}
                >
                  Ακύρωση
                </button>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 mt-2">
            Ζητήθηκε: {new Date(record.requestedAt).toLocaleString('el')}
            {record.startedAt && ` • Ξεκίνησε: ${new Date(record.startedAt).toLocaleTimeString('el')}`}
            {record.completedAt && ` • Τέλος: ${new Date(record.completedAt).toLocaleTimeString('el')}`}
            {record.inspectedAt && ` • Επιθεώρηση: ${new Date(record.inspectedAt).toLocaleTimeString('el')}`}
          </div>
        </>
      )}
    </article>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-200 flex flex-col">
      {/* Top Bar */}
      <header className="flex justify-between items-center px-5 py-3 border-b border-slate-500/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">🚿 Πλυντήρια</h1>
        <div className="flex gap-2 items-center">
          <div className="flex bg-slate-800/50 rounded-lg p-0.5" role="tablist" aria-label="Εναλλαγή προβολής">
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${washer.viewMode === 'kanban' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => washer.setViewMode('kanban')}
              role="tab"
              aria-selected={washer.viewMode === 'kanban'}
            >
              Kanban
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${washer.viewMode === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => washer.setViewMode('list')}
              role="tab"
              aria-selected={washer.viewMode === 'list'}
            >
              Λίστα
            </button>
          </div>
          <button
            className="px-3 py-1.5 rounded-lg border-none bg-blue-500 text-white cursor-pointer text-xs font-semibold transition-all hover:bg-blue-600"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            ➕ Νέο
          </button>
          <button
            className="w-9 h-9 rounded-lg border border-slate-500/15 bg-transparent text-lg cursor-pointer transition-all hover:bg-slate-500/10"
            onClick={handleNavigateHome}
            aria-label="Αρχική σελίδα"
          >🏠</button>
        </div>
      </header>

      {/* Stats */}
      <div className="flex gap-3 px-5 py-3 overflow-x-auto" role="list" aria-label="Στατιστικά ουράς">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} className="flex-1 min-w-[100px] p-3 rounded-xl bg-slate-800/40 border border-slate-500/8 text-center" role="listitem">
            <div className={`text-2xl font-extrabold ${cfg.color}`}>
              {stats[status === 'in_progress' ? 'inProgress' : status as keyof typeof stats] || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{cfg.icon} {cfg.label}</div>
          </div>
        ))}
        <div className="flex-1 min-w-[100px] p-3 rounded-xl bg-slate-800/40 border border-slate-500/8 text-center" role="listitem">
          <div className="text-2xl font-extrabold text-slate-200">{washer.todayCompleted}</div>
          <div className="text-[11px] text-slate-400 mt-1">📊 Σήμερα</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mx-5 mb-3 p-4 rounded-xl bg-slate-800/50 border border-blue-500/15">
          <div className="text-base font-bold mb-3">➕ Προσθήκη στην Ουρά</div>
          <div className="flex gap-2.5 flex-wrap items-end">
            <div>
              <label className="text-xs text-slate-400 mb-1 block" htmlFor="new-plate">Πινακίδα</label>
              <input
                id="new-plate"
                className="w-40 uppercase px-3 py-2 rounded-lg border border-slate-500/15 bg-slate-800/60 text-slate-200 text-sm outline-none transition-colors focus:border-blue-500/40"
                placeholder="ΗΡΑ-0000"
                value={newPlate}
                onChange={e => setNewPlate(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block" htmlFor="new-wash-type">Τύπος</label>
              <select id="new-wash-type" className="px-3 py-2 rounded-lg border border-slate-500/15 bg-slate-800/60 text-slate-200 text-sm outline-none cursor-pointer transition-colors focus:border-blue-500/40" value={newWashType} onChange={e => setNewWashType(e.target.value as WashType)}>
                {Object.entries(WASH_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label} (~{v.minutes}\')</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block" htmlFor="new-priority">Προτεραιότητα</label>
              <select id="new-priority" className="px-3 py-2 rounded-lg border border-slate-500/15 bg-slate-800/60 text-slate-200 text-sm outline-none cursor-pointer transition-colors focus:border-blue-500/40" value={newPriority} onChange={e => setNewPriority(e.target.value as WashRecord['priority'])}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <button
              className="px-3 py-2 rounded-lg border-none bg-blue-500 text-white cursor-pointer text-sm font-semibold transition-all hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleAddToQueue}
              disabled={!newPlate.trim()}
            >
              Προσθήκη
            </button>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {washer.viewMode === 'kanban' && (
        <div className="flex gap-4 px-5 py-3 flex-1 overflow-x-auto min-h-0">
          {(['waiting', 'in_progress', 'done', 'inspected'] as WashStatus[]).map(status => {
            const cfg = STATUS_CONFIG[status];
            const records = byStatus[status] || [];
            return (
              <section key={status} className="flex-1 min-w-[260px] flex flex-col rounded-xl bg-slate-800/30 border border-slate-500/8 overflow-hidden">
                <div className={`flex justify-between items-center px-3.5 py-2.5 ${STATUS_RAW_COLORS[status].headerBg}`}>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <span>{cfg.icon}</span> {cfg.label}
                  </div>
                  <div className={`px-2 py-0.5 rounded-md text-xs font-bold ${STATUS_RAW_COLORS[status].countBg} ${cfg.color}`}>
                    {records.length}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2.5" role="list" aria-label={`${cfg.label} ουρά`}>
                  {records.map(record => (
                    <WashCardDetail
                      key={record.id}
                      record={record}
                      expanded={expandedId === record.id}
                      onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    />
                  ))}
                  {records.length === 0 && (
                    <div className="text-center py-6 text-slate-600 text-[13px]">
                      Κενό
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* List View */}
      {washer.viewMode === 'list' && (
        <div className="p-5 flex-1 overflow-y-auto">
          {washer.getFilteredQueue().length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <div className="text-5xl mb-4" aria-hidden="true">🚿</div>
              <div className="text-base font-semibold">Η ουρά είναι κενή</div>
              <div className="text-[13px] mt-1">Πατήστε «➕ Νέο» για να προσθέσετε όχημα</div>
            </div>
          ) : (
            washer.getFilteredQueue().map(record => {
              const cfg = STATUS_CONFIG[record.status];
              const wtc = WASH_TYPE_CONFIG[record.washType];
              return (
                <button
                  key={record.id}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-1.5 bg-slate-800/30 border border-slate-500/8 cursor-pointer transition-all hover:bg-slate-800/50 text-left"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <div className="text-xl">{cfg.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-[15px] tracking-wide">{record.plate}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {wtc.icon} {wtc.label} • {cfg.label}
                      {record.assignedTo && ` • Ανατέθηκε`}
                    </div>
                  </div>
                  {record.priority !== 'normal' && (
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${PRIORITY_CONFIG[record.priority].bg} ${PRIORITY_CONFIG[record.priority].color}`}>
                      {PRIORITY_CONFIG[record.priority].label}
                    </span>
                  )}
                  <div className="text-xs text-slate-500">
                    {new Date(record.requestedAt).toLocaleTimeString('el', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default WasherApp;
