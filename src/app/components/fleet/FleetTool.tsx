import React, { useState, useRef } from 'react';
import { useFleetStore } from '../../store/fleetStore';
import { useAuthStore } from '../../store/authStore';
import type { FleetVehicle, FleetNote } from '../../types/platform';

// ─── Fleet Tool - Full Fleet Management Interface ────────────
// Vehicle cards, notes, photos, damage reports. Glassmorphism style.

const STATUS_CONFIG: Record<FleetVehicle['status'], { label: string; color: string; bg: string }> = {
  available: { label: 'Διαθέσιμο', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  rented: { label: 'Ενοικιασμένο', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  in_wash: { label: 'Πλύσιμο', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  maintenance: { label: 'Συντήρηση', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  damaged: { label: 'Ζημιά', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  out_of_service: { label: 'Εκτός', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444',
};

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: 360, borderRight: '1px solid rgba(148,163,184,0.08)',
    display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.5)',
  },
  header: {
    padding: '20px 16px 12px', borderBottom: '1px solid rgba(148,163,184,0.08)',
  },
  headerTitle: {
    fontSize: 20, fontWeight: 700, marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  statsRow: {
    display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 12,
  },
  statBadge: {
    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 4,
  },
  searchBar: {
    display: 'flex', gap: 8, padding: '0 16px 12px',
  },
  search: {
    flex: 1, padding: '8px 12px', borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(30,41,59,0.6)',
    color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  },
  filterBtn: {
    padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(30,41,59,0.6)', color: '#94a3b8', cursor: 'pointer',
    fontSize: 13, whiteSpace: 'nowrap' as const,
  },
  filterBtnActive: {
    background: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6', color: '#60a5fa',
  },
  vehicleList: {
    flex: 1, overflowY: 'auto' as const, padding: '4px 8px',
  },
  vehicleCard: {
    padding: '14px 14px', margin: '4px 0', borderRadius: 14,
    border: '1px solid rgba(148,163,184,0.08)', cursor: 'pointer',
    background: 'rgba(30,41,59,0.4)', transition: 'all 0.2s',
  },
  vehicleCardActive: {
    border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.08)',
    boxShadow: '0 0 20px rgba(59,130,246,0.08)',
  },
  plate: {
    fontSize: 16, fontWeight: 700, letterSpacing: 1,
  },
  vehicleInfo: {
    fontSize: 12, color: '#94a3b8', marginTop: 2,
  },
  statusBadge: {
    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    display: 'inline-block',
  },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
  },
  mainHeader: {
    padding: '20px 24px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  tabs: {
    display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  tab: {
    padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    borderBottom: '2px solid transparent', color: '#94a3b8', transition: 'all 0.2s',
    background: 'none', border: 'none', borderRadius: 0,
  },
  tabActive: {
    color: '#60a5fa', borderBottom: '2px solid #3b82f6',
  },
  content: {
    flex: 1, overflowY: 'auto' as const, padding: 24,
  },
  noteCard: {
    padding: 14, borderRadius: 12, marginBottom: 10,
    border: '1px solid rgba(148,163,184,0.08)', background: 'rgba(30,41,59,0.3)',
  },
  noteHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  noteCategory: {
    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
  },
  noteContent: {
    fontSize: 14, lineHeight: 1.5, color: '#cbd5e1',
  },
  noteFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, fontSize: 11, color: '#64748b',
  },
  addForm: {
    padding: 16, borderRadius: 14, marginBottom: 16,
    border: '1px solid rgba(148,163,184,0.1)', background: 'rgba(30,41,59,0.5)',
  },
  textarea: {
    width: '100%', padding: 12, borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(15,23,42,0.5)',
    color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' as const,
    minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box' as const,
  },
  select: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.12)',
    background: 'rgba(15,23,42,0.5)', color: '#e2e8f0', fontSize: 13, outline: 'none',
  },
  btnPrimary: {
    padding: '8px 20px', borderRadius: 10, border: 'none',
    background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  btnSecondary: {
    padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.15)',
    background: 'rgba(51,65,85,0.4)', color: '#94a3b8', fontSize: 13,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  emptyState: {
    textAlign: 'center' as const, padding: 40, color: '#64748b',
  },
  photoGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10,
  },
  photoCard: {
    borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(30,41,59,0.4)', cursor: 'pointer', position: 'relative' as const,
  },
  photoImg: {
    width: '100%', height: 120, objectFit: 'cover' as const, display: 'block',
  },
  photoCaption: {
    padding: '6px 8px', fontSize: 11, color: '#94a3b8',
  },
  damageCard: {
    padding: 14, borderRadius: 12, marginBottom: 10,
    border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)',
  },
  backBtn: {
    display: 'none', padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(30,41,59,0.6)',
    color: '#94a3b8', cursor: 'pointer', fontSize: 13,
  },
  infoGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  infoItem: {
    padding: 14, borderRadius: 12, background: 'rgba(30,41,59,0.3)',
    border: '1px solid rgba(148,163,184,0.06)',
  },
  infoLabel: {
    fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16, fontWeight: 600,
  },
};

// Media query for mobile handled via state
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

const NOTE_CATEGORIES: { value: FleetNote['category']; label: string }[] = [
  { value: 'general', label: 'Γενικό' },
  { value: 'maintenance', label: 'Συντήρηση' },
  { value: 'issue', label: 'Πρόβλημα' },
  { value: 'handover', label: 'Παράδοση' },
  { value: 'inspection', label: 'Επιθεώρηση' },
];

const PRIORITY_OPTIONS: { value: FleetNote['priority']; label: string }[] = [
  { value: 'low', label: 'Χαμηλή' },
  { value: 'medium', label: 'Μεσαία' },
  { value: 'high', label: 'Υψηλή' },
  { value: 'urgent', label: 'Επείγον' },
];

type TabId = 'info' | 'notes' | 'photos' | 'damage' | 'timeline';

export function FleetTool() {
  const fleet = useFleetStore();
  const { currentProfile } = useAuthStore();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabId>('notes');
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FleetVehicle['status'] | 'all'>('all');

  // Note form
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<FleetNote['category']>('general');
  const [notePriority, setNotePriority] = useState<FleetNote['priority']>('medium');

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vehicles = fleet.getFilteredVehicles();
  const selectedVehicle = fleet.getSelectedVehicle();
  const stats = fleet.getVehicleStats();

  const handleSelectVehicle = (id: string) => {
    fleet.selectVehicle(id);
    if (isMobile) setShowMobileDetail(true);
  };

  const handleAddNote = () => {
    if (!selectedVehicle || !noteContent.trim() || !currentProfile) return;
    fleet.addNote(selectedVehicle.id, {
      authorId: currentProfile.id,
      content: noteContent.trim(),
      category: noteCategory,
      priority: notePriority,
      attachments: [],
    });
    setNoteContent('');
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVehicle || !currentProfile) return;
    const reader = new FileReader();
    reader.onload = () => {
      fleet.addPhoto(selectedVehicle.id, {
        authorId: currentProfile.id,
        dataUrl: reader.result as string,
        caption: file.name,
        category: 'general',
        tags: [],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddDamage = () => {
    if (!selectedVehicle || !currentProfile) return;
    const desc = prompt('Περιγραφή ζημιάς:');
    if (!desc) return;
    const location = prompt('Θέση (π.χ. front_left, rear_right):') || 'unknown';
    fleet.addDamageReport(selectedVehicle.id, {
      reportedBy: currentProfile.id,
      location,
      severity: 'moderate',
      description: desc,
      photos: [],
    });
  };

  // Render vehicle list (sidebar)
  const renderVehicleList = () => (
    <div style={s.sidebar}>
      <div style={s.header}>
        <div style={s.headerTitle}>🚗 Στόλος</div>
        <div style={s.statsRow}>
          {[
            { label: 'Διαθέσιμα', count: stats.available, color: '#22c55e' },
            { label: 'Ενοικ.', count: stats.rented, color: '#3b82f6' },
            { label: 'Πλύσ.', count: stats.inWash, color: '#06b6d4' },
            { label: 'Ζημιά', count: stats.damaged, color: '#ef4444' },
          ].map(st => (
            <div key={st.label} style={{ ...s.statBadge, background: `${st.color}15`, color: st.color }}>
              {st.count} {st.label}
            </div>
          ))}
        </div>
      </div>
      <div style={s.searchBar}>
        <input
          style={s.search}
          placeholder="🔍 Πινακίδα, μάρκα..."
          value={fleet.searchQuery}
          onChange={e => fleet.setSearch(e.target.value)}
        />
        <select
          style={s.select}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as any); fleet.setFilterStatus(e.target.value as any); }}
        >
          <option value="all">Όλα</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <div style={s.vehicleList}>
        {vehicles.map(v => {
          const sc = STATUS_CONFIG[v.status];
          return (
            <div
              key={v.id}
              style={{ ...s.vehicleCard, ...(selectedVehicle?.id === v.id ? s.vehicleCardActive : {}) }}
              onClick={() => handleSelectVehicle(v.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={s.plate}>{v.plate}</div>
                  <div style={s.vehicleInfo}>{v.brand} {v.model} • {v.color} • {v.year}</div>
                  <div style={{ ...s.vehicleInfo, marginTop: 4 }}>{v.company} • {v.currentLocation}</div>
                </div>
                <div style={{ ...s.statusBadge, background: sc.bg, color: sc.color }}>{sc.label}</div>
              </div>
              {v.notes.filter(n => !n.isResolved).length > 0 && (
                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>
                  📝 {v.notes.filter(n => !n.isResolved).length} ανοιχτές σημειώσεις
                </div>
              )}
            </div>
          );
        })}
        {vehicles.length === 0 && (
          <div style={s.emptyState}>Δεν βρέθηκαν οχήματα</div>
        )}
      </div>
    </div>
  );

  // Render detail panel
  const renderDetail = () => {
    if (!selectedVehicle) {
      return (
        <div style={{ ...s.main, alignItems: 'center', justifyContent: 'center' }}>
          <div style={s.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Επιλέξτε όχημα</div>
            <div style={{ fontSize: 13 }}>Επιλέξτε ένα όχημα από τη λίστα για λεπτομέρειες</div>
          </div>
        </div>
      );
    }

    const sc = STATUS_CONFIG[selectedVehicle.status];

    return (
      <div style={s.main}>
        <div style={s.mainHeader}>
          <div>
            {isMobile && (
              <button style={{ ...s.backBtn, display: 'block', marginBottom: 8 }} onClick={() => setShowMobileDetail(false)}>
                ← Πίσω
              </button>
            )}
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>{selectedVehicle.plate}</div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 2 }}>
              {selectedVehicle.brand} {selectedVehicle.model} • {selectedVehicle.color} • {selectedVehicle.year} • {selectedVehicle.company}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ ...s.statusBadge, background: sc.bg, color: sc.color, fontSize: 13, padding: '5px 12px' }}>
              {sc.label}
            </div>
            <select
              style={s.select}
              value={selectedVehicle.status}
              onChange={e => fleet.updateVehicleStatus(selectedVehicle.id, e.target.value as FleetVehicle['status'])}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={s.tabs}>
          {([
            { id: 'info' as TabId, label: 'ℹ️ Πληροφορίες' },
            { id: 'notes' as TabId, label: `📝 Σημειώσεις (${selectedVehicle.notes.length})` },
            { id: 'photos' as TabId, label: `📸 Φωτο (${selectedVehicle.photos.length})` },
            { id: 'damage' as TabId, label: `🔴 Ζημιές (${selectedVehicle.damageReports.length})` },
            { id: 'timeline' as TabId, label: '📅 Ιστορικό' },
          ]).map(t => (
            <button
              key={t.id}
              style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={s.content}>
          {activeTab === 'info' && (
            <div style={s.infoGrid}>
              <div style={s.infoItem}><div style={s.infoLabel}>Πινακίδα</div><div style={s.infoValue}>{selectedVehicle.plate}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Μάρκα</div><div style={s.infoValue}>{selectedVehicle.brand} {selectedVehicle.model}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Κατηγορία</div><div style={s.infoValue}>{selectedVehicle.category}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Εταιρεία</div><div style={s.infoValue}>{selectedVehicle.company}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Καύσιμα</div><div style={s.infoValue}>{selectedVehicle.fuelLevel}%</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Χιλιόμετρα</div><div style={s.infoValue}>{selectedVehicle.mileage.toLocaleString('el')} km</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Τοποθεσία</div><div style={s.infoValue}>{selectedVehicle.currentLocation}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Τελευταίο Service</div><div style={s.infoValue}>{selectedVehicle.lastService}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Επόμενο Service</div><div style={s.infoValue}>{selectedVehicle.nextService}</div></div>
            </div>
          )}

          {activeTab === 'notes' && (
            <>
              <div style={s.addForm}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>➕ Νέα Σημείωση</div>
                <textarea
                  style={s.textarea}
                  placeholder="Γράψτε σημείωση..."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <select style={s.select} value={noteCategory} onChange={e => setNoteCategory(e.target.value as any)}>
                    {NOTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <select style={s.select} value={notePriority} onChange={e => setNotePriority(e.target.value as any)}>
                    {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <button style={s.btnPrimary} onClick={handleAddNote} disabled={!noteContent.trim()}>
                    Προσθήκη
                  </button>
                </div>
              </div>
              {selectedVehicle.notes.length === 0 ? (
                <div style={s.emptyState}>Δεν υπάρχουν σημειώσεις</div>
              ) : (
                selectedVehicle.notes.map(note => (
                  <div key={note.id} style={{ ...s.noteCard, opacity: note.isResolved ? 0.5 : 1 }}>
                    <div style={s.noteHeader}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ ...s.noteCategory, background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
                          {NOTE_CATEGORIES.find(c => c.value === note.category)?.label}
                        </div>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: PRIORITY_COLORS[note.priority],
                        }} title={`Προτεραιότητα: ${note.priority}`} />
                      </div>
                      {!note.isResolved && currentProfile && (
                        <button
                          style={{ ...s.btnSecondary, fontSize: 11, padding: '4px 10px' }}
                          onClick={() => fleet.resolveNote(selectedVehicle.id, note.id, currentProfile.id)}
                        >
                          ✓ Επίλυση
                        </button>
                      )}
                    </div>
                    <div style={s.noteContent}>{note.content}</div>
                    <div style={s.noteFooter}>
                      <span>{new Date(note.timestamp).toLocaleString('el')}</span>
                      {note.isResolved && <span style={{ color: '#22c55e' }}>✓ Επιλύθηκε</span>}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'photos' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button style={s.btnPrimary} onClick={() => fileInputRef.current?.click()}>
                  📸 Προσθήκη Φωτογραφίας
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handlePhotoCapture}
                />
              </div>
              {selectedVehicle.photos.length === 0 ? (
                <div style={s.emptyState}>Δεν υπάρχουν φωτογραφίες</div>
              ) : (
                <div style={s.photoGrid}>
                  {selectedVehicle.photos.map(photo => (
                    <div key={photo.id} style={s.photoCard}>
                      <img src={photo.dataUrl} alt={photo.caption} style={s.photoImg} />
                      <div style={s.photoCaption}>
                        <div>{photo.caption}</div>
                        <div style={{ fontSize: 10, color: '#475569' }}>{new Date(photo.timestamp).toLocaleString('el')}</div>
                      </div>
                      <button
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(0,0,0,0.6)', border: 'none',
                          borderRadius: 6, color: '#ef4444', cursor: 'pointer',
                          width: 24, height: 24, fontSize: 12, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                        onClick={e => { e.stopPropagation(); fleet.removePhoto(selectedVehicle.id, photo.id); }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'damage' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button style={{ ...s.btnPrimary, background: '#ef4444' }} onClick={handleAddDamage}>
                  🔴 Αναφορά Ζημιάς
                </button>
              </div>
              {selectedVehicle.damageReports.length === 0 ? (
                <div style={s.emptyState}>Δεν υπάρχουν αναφορές ζημιών</div>
              ) : (
                selectedVehicle.damageReports.map(damage => (
                  <div key={damage.id} style={s.damageCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                          ...s.noteCategory,
                          background: damage.severity === 'major' ? 'rgba(239,68,68,0.15)' : damage.severity === 'moderate' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                          color: damage.severity === 'major' ? '#ef4444' : damage.severity === 'moderate' ? '#f59e0b' : '#22c55e',
                        }}>
                          {damage.severity === 'major' ? 'Μεγάλη' : damage.severity === 'moderate' ? 'Μέτρια' : 'Μικρή'}
                        </div>
                        <div style={{ ...s.noteCategory, background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>
                          {damage.location}
                        </div>
                      </div>
                      <div style={{
                        ...s.noteCategory,
                        background: damage.status === 'repaired' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                        color: damage.status === 'repaired' ? '#22c55e' : '#f59e0b',
                      }}>
                        {damage.status === 'reported' ? 'Αναφέρθηκε' : damage.status === 'inspected' ? 'Ελέγχθηκε' : damage.status === 'repair_scheduled' ? 'Προγρ. επισκευή' : 'Επισκευάστηκε'}
                      </div>
                    </div>
                    <div style={s.noteContent}>{damage.description}</div>
                    <div style={s.noteFooter}>
                      <span>{new Date(damage.timestamp).toLocaleString('el')}</span>
                      {damage.repairCost && <span>Κόστος: €{damage.repairCost}</span>}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'timeline' && (() => {
            // Merge all vehicle events into a timeline
            type TimelineEvent = {
              id: string;
              type: 'note' | 'photo' | 'damage' | 'wash';
              icon: string;
              title: string;
              description: string;
              timestamp: string;
              color: string;
            };

            const events: TimelineEvent[] = [
              ...selectedVehicle.notes.map(n => ({
                id: n.id,
                type: 'note' as const,
                icon: '📝',
                title: `Σημείωση: ${NOTE_CATEGORIES.find(c => c.value === n.category)?.label || n.category}`,
                description: n.content.slice(0, 120),
                timestamp: n.timestamp,
                color: '#3b82f6',
              })),
              ...selectedVehicle.photos.map(p => ({
                id: p.id,
                type: 'photo' as const,
                icon: '📸',
                title: `Φωτογραφία: ${p.category}`,
                description: p.caption,
                timestamp: p.timestamp,
                color: '#8b5cf6',
              })),
              ...selectedVehicle.damageReports.map(d => ({
                id: d.id,
                type: 'damage' as const,
                icon: '🔴',
                title: `Ζημιά: ${d.severity === 'major' ? 'Μεγάλη' : d.severity === 'moderate' ? 'Μέτρια' : 'Μικρή'}`,
                description: d.description.slice(0, 120),
                timestamp: d.timestamp,
                color: '#ef4444',
              })),
              ...selectedVehicle.washHistory.map(w => ({
                id: w.id,
                type: 'wash' as const,
                icon: '🚿',
                title: `Πλύσιμο: ${w.washType}`,
                description: w.notes || `Διάρκεια: ${w.duration || '?'} λεπτά`,
                timestamp: w.requestedAt,
                color: '#06b6d4',
              })),
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            if (events.length === 0) {
              return <div style={s.emptyState}>Δεν υπάρχει ιστορικό</div>;
            }

            return (
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                {/* Timeline line */}
                <div style={{
                  position: 'absolute', left: 9, top: 0, bottom: 0,
                  width: 2, background: 'rgba(148,163,184,0.1)',
                }} />
                {events.map((event, i) => (
                  <div key={event.id} style={{ position: 'relative', marginBottom: 16, paddingLeft: 20 }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute', left: -15, top: 6,
                      width: 12, height: 12, borderRadius: '50%',
                      background: event.color, border: '2px solid #0f172a',
                      zIndex: 1,
                    }} />
                    <div style={{
                      padding: 12, borderRadius: 10,
                      background: 'rgba(30,41,59,0.3)',
                      border: '1px solid rgba(148,163,184,0.06)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                          <span>{event.icon}</span>
                          <span>{event.title}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(event.timestamp).toLocaleString('el', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>
                        {event.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div style={{ ...s.page, flexDirection: 'column' }}>
        {showMobileDetail ? renderDetail() : renderVehicleList()}
      </div>
    );
  }

  return (
    <div style={s.page}>
      {renderVehicleList()}
      {renderDetail()}
    </div>
  );
}

export default FleetTool;
