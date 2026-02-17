import React, { useState, useRef } from 'react';
import { useFleetStore } from '../../store/fleetStore';
import { useAuthStore } from '../../store/authStore';
import type { FleetVehicle, FleetNote } from '../../types/platform';

// ─── Fleet Tool - Full Fleet Management Interface ────────────
// Vehicle cards, notes, photos, damage reports. Tailwind theme-aware.

const STATUS_CONFIG: Record<FleetVehicle['status'], { label: string; color: string; bg: string }> = {
  available: { label: 'Διαθέσιμο', color: 'text-green-500', bg: 'bg-green-500/10' },
  rented: { label: 'Ενοικιασμένο', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  in_wash: { label: 'Πλύσιμο', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  maintenance: { label: 'Συντήρηση', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  damaged: { label: 'Ζημιά', color: 'text-red-500', bg: 'bg-red-500/10' },
  out_of_service: { label: 'Εκτός', color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-500', medium: 'bg-amber-500', high: 'bg-orange-500', urgent: 'bg-red-500',
};

// Tailwind classes used directly in JSX — no inline style objects needed

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
    <aside className="w-full md:w-[360px] md:border-r border-slate-500/8 flex flex-col bg-slate-900/50" role="navigation" aria-label="Λίστα οχημάτων">
      <div className="px-4 pt-5 pb-3 border-b border-slate-500/8">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">🚗 Στόλος</h2>
        <div className="flex gap-2 flex-wrap mb-3" role="status" aria-label="Στατιστικά στόλου">
          {[
            { label: 'Διαθέσιμα', count: stats.available, cls: 'bg-green-500/10 text-green-500' },
            { label: 'Ενοικ.', count: stats.rented, cls: 'bg-blue-500/10 text-blue-500' },
            { label: 'Πλύσ.', count: stats.inWash, cls: 'bg-cyan-500/10 text-cyan-500' },
            { label: 'Ζημιά', count: stats.damaged, cls: 'bg-red-500/10 text-red-500' },
          ].map(st => (
            <span key={st.label} className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${st.cls}`}>
              {st.count} {st.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-3 pt-2">
        <input
          className="flex-1 px-3 py-2 rounded-[10px] border border-slate-500/12 bg-slate-800/60 text-slate-200 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          placeholder="🔍 Πινακίδα, μάρκα..."
          value={fleet.searchQuery}
          onChange={e => fleet.setSearch(e.target.value)}
          aria-label="Αναζήτηση οχήματος"
        />
        <select
          className="px-3 py-2 rounded-lg border border-slate-500/12 bg-slate-900/50 text-slate-200 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as any); fleet.setFilterStatus(e.target.value as any); }}
          aria-label="Φιλτράρισμα κατάστασης"
        >
          <option value="all">Όλα</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1" role="listbox" aria-label="Οχήματα">
        {vehicles.map(v => {
          const sc = STATUS_CONFIG[v.status];
          const isActive = selectedVehicle?.id === v.id;
          return (
            <div
              key={v.id}
              className={`p-3.5 my-1 rounded-[14px] border cursor-pointer transition-all duration-200 hover:bg-slate-700/40 ${isActive ? 'border-blue-500/40 bg-blue-500/8 shadow-[0_0_20px_rgba(59,130,246,0.08)]' : 'border-slate-500/8 bg-slate-800/40'}`}
              onClick={() => handleSelectVehicle(v.id)}
              role="option"
              aria-selected={isActive}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleSelectVehicle(v.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-base font-bold tracking-wide">{v.plate}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{v.brand} {v.model} • {v.color} • {v.year}</div>
                  <div className="text-xs text-slate-400 mt-1">{v.company} • {v.currentLocation}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${sc.bg} ${sc.color}`}>{sc.label}</span>
              </div>
              {v.notes.filter(n => !n.isResolved).length > 0 && (
                <div className="text-[11px] text-amber-500 mt-1.5">
                  📝 {v.notes.filter(n => !n.isResolved).length} ανοιχτές σημειώσεις
                </div>
              )}
            </div>
          );
        })}
        {vehicles.length === 0 && (
          <div className="text-center py-10 text-slate-500">Δεν βρέθηκαν οχήματα</div>
        )}
      </div>
    </aside>
  );

  // Render detail panel
  const renderDetail = () => {
    if (!selectedVehicle) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center py-10 text-slate-500">
            <div className="text-5xl mb-4" aria-hidden="true">🚗</div>
            <div className="text-base font-semibold mb-1">Επιλέξτε όχημα</div>
            <div className="text-[13px]">Επιλέξτε ένα όχημα από τη λίστα για λεπτομέρειες</div>
          </div>
        </div>
      );
    }

    const sc = STATUS_CONFIG[selectedVehicle.status];

    return (
      <main className="flex-1 flex flex-col overflow-hidden" aria-label="Λεπτομέρειες οχήματος">
        <div className="px-6 pt-5 pb-4 border-b border-slate-500/8 flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            {isMobile && (
              <button className="mb-2 px-3 py-2 rounded-lg border border-slate-500/12 bg-slate-800/60 text-slate-400 cursor-pointer text-[13px] hover:bg-slate-700/60" onClick={() => setShowMobileDetail(false)}>
                ← Πίσω
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-wide">{selectedVehicle.plate}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {selectedVehicle.brand} {selectedVehicle.model} • {selectedVehicle.color} • {selectedVehicle.year} • {selectedVehicle.company}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1.5 rounded-md text-[13px] font-semibold ${sc.bg} ${sc.color}`}>
              {sc.label}
            </span>
            <select
              className="px-3 py-2 rounded-lg border border-slate-500/12 bg-slate-900/50 text-slate-200 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              value={selectedVehicle.status}
              onChange={e => fleet.updateVehicleStatus(selectedVehicle.id, e.target.value as FleetVehicle['status'])}
              aria-label="Αλλαγή κατάστασης"
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-1 px-6 border-b border-slate-500/6" role="tablist" aria-label="Καρτέλες οχήματος">
          {([
            { id: 'info' as TabId, label: 'ℹ️ Πληροφορίες' },
            { id: 'notes' as TabId, label: `📝 Σημειώσεις (${selectedVehicle.notes.length})` },
            { id: 'photos' as TabId, label: `📸 Φωτο (${selectedVehicle.photos.length})` },
            { id: 'damage' as TabId, label: `🔴 Ζημιές (${selectedVehicle.damageReports.length})` },
            { id: 'timeline' as TabId, label: '📅 Ιστορικό' },
          ]).map(t => (
            <button
              key={t.id}
              className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-all duration-200 bg-transparent border-b-2 ${activeTab === t.id ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
              onClick={() => setActiveTab(t.id)}
              role="tab"
              aria-selected={activeTab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6" role="tabpanel">
          {activeTab === 'info' && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {[
                { label: 'Πινακίδα', value: selectedVehicle.plate },
                { label: 'Μάρκα', value: `${selectedVehicle.brand} ${selectedVehicle.model}` },
                { label: 'Κατηγορία', value: selectedVehicle.category },
                { label: 'Εταιρεία', value: selectedVehicle.company },
                { label: 'Καύσιμα', value: `${selectedVehicle.fuelLevel}%` },
                { label: 'Χιλιόμετρα', value: `${selectedVehicle.mileage.toLocaleString('el')} km` },
                { label: 'Τοποθεσία', value: selectedVehicle.currentLocation },
                { label: 'Τελευταίο Service', value: selectedVehicle.lastService },
                { label: 'Επόμενο Service', value: selectedVehicle.nextService },
              ].map(item => (
                <div key={item.label} className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-500/6">
                  <div className="text-[11px] text-slate-500 mb-1 uppercase tracking-wide">{item.label}</div>
                  <div className="text-base font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <>
              <div className="p-4 rounded-[14px] mb-4 border border-slate-500/10 bg-slate-800/50">
                <div className="text-sm font-semibold mb-2.5">➕ Νέα Σημείωση</div>
                <textarea
                  className="w-full p-3 rounded-[10px] border border-slate-500/12 bg-slate-900/50 text-slate-200 text-sm outline-none resize-y min-h-[80px] font-[inherit] focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Γράψτε σημείωση..."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  aria-label="Κείμενο σημείωσης"
                />
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  <select className="px-3 py-2 rounded-lg border border-slate-500/12 bg-slate-900/50 text-slate-200 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500" value={noteCategory} onChange={e => setNoteCategory(e.target.value as any)} aria-label="Κατηγορία σημείωσης">
                    {NOTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <select className="px-3 py-2 rounded-lg border border-slate-500/12 bg-slate-900/50 text-slate-200 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500" value={notePriority} onChange={e => setNotePriority(e.target.value as any)} aria-label="Προτεραιότητα">
                    {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <button className="px-5 py-2 rounded-[10px] border-none bg-blue-500 text-white text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleAddNote} disabled={!noteContent.trim()}>
                    Προσθήκη
                  </button>
                </div>
              </div>
              {selectedVehicle.notes.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Δεν υπάρχουν σημειώσεις</div>
              ) : (
                selectedVehicle.notes.map(note => (
                  <article key={note.id} className={`p-3.5 rounded-xl mb-2.5 border border-slate-500/8 bg-slate-800/30 ${note.isResolved ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex gap-1.5 items-center">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/12 text-blue-400">
                          {NOTE_CATEGORIES.find(c => c.value === note.category)?.label}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[note.priority]}`} title={`Προτεραιότητα: ${note.priority}`} />
                      </div>
                      {!note.isResolved && currentProfile && (
                        <button
                          className="px-2.5 py-1 rounded-[10px] border border-slate-500/15 bg-slate-700/40 text-slate-400 text-[11px] cursor-pointer hover:bg-slate-600/40"
                          onClick={() => fleet.resolveNote(selectedVehicle.id, note.id, currentProfile.id)}
                        >
                          ✓ Επίλυση
                        </button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{note.content}</p>
                    <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                      <span>{new Date(note.timestamp).toLocaleString('el')}</span>
                      {note.isResolved && <span className="text-green-500">✓ Επιλύθηκε</span>}
                    </div>
                  </article>
                ))
              )}
            </>
          )}

          {activeTab === 'photos' && (
            <>
              <div className="flex gap-2 mb-4">
                <button className="px-5 py-2 rounded-[10px] border-none bg-blue-500 text-white text-[13px] font-semibold cursor-pointer hover:bg-blue-600" onClick={() => fileInputRef.current?.click()}>
                  📸 Προσθήκη Φωτογραφίας
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </div>
              {selectedVehicle.photos.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Δεν υπάρχουν φωτογραφίες</div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
                  {selectedVehicle.photos.map(photo => (
                    <div key={photo.id} className="rounded-[10px] overflow-hidden border border-slate-500/8 bg-slate-800/40 cursor-pointer relative group">
                      <img src={photo.dataUrl} alt={photo.caption} className="w-full h-[120px] object-cover block" />
                      <div className="px-2 py-1.5 text-[11px] text-slate-400">
                        <div>{photo.caption}</div>
                        <div className="text-[10px] text-slate-600">{new Date(photo.timestamp).toLocaleString('el')}</div>
                      </div>
                      <button
                        className="absolute top-1 right-1 bg-black/60 border-none rounded-md text-red-500 cursor-pointer w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); fleet.removePhoto(selectedVehicle.id, photo.id); }}
                        aria-label="Διαγραφή φωτογραφίας"
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
              <div className="flex gap-2 mb-4">
                <button className="px-5 py-2 rounded-[10px] border-none bg-red-500 text-white text-[13px] font-semibold cursor-pointer hover:bg-red-600" onClick={handleAddDamage}>
                  🔴 Αναφορά Ζημιάς
                </button>
              </div>
              {selectedVehicle.damageReports.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Δεν υπάρχουν αναφορές ζημιών</div>
              ) : (
                selectedVehicle.damageReports.map(damage => (
                  <article key={damage.id} className="p-3.5 rounded-xl mb-2.5 border border-red-500/15 bg-red-500/4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-2 items-center">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${damage.severity === 'major' ? 'bg-red-500/15 text-red-500' : damage.severity === 'moderate' ? 'bg-amber-500/15 text-amber-500' : 'bg-green-500/15 text-green-500'}`}>
                          {damage.severity === 'major' ? 'Μεγάλη' : damage.severity === 'moderate' ? 'Μέτρια' : 'Μικρή'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-500/10 text-slate-400">
                          {damage.location}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${damage.status === 'repaired' ? 'bg-green-500/12 text-green-500' : 'bg-amber-500/12 text-amber-500'}`}>
                        {damage.status === 'reported' ? 'Αναφέρθηκε' : damage.status === 'inspected' ? 'Ελέγχθηκε' : damage.status === 'repair_scheduled' ? 'Προγρ. επισκευή' : 'Επισκευάστηκε'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{damage.description}</p>
                    <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                      <span>{new Date(damage.timestamp).toLocaleString('el')}</span>
                      {damage.repairCost && <span>Κόστος: €{damage.repairCost}</span>}
                    </div>
                  </article>
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
                id: n.id, type: 'note' as const, icon: '📝',
                title: `Σημείωση: ${NOTE_CATEGORIES.find(c => c.value === n.category)?.label || n.category}`,
                description: n.content.slice(0, 120), timestamp: n.timestamp, color: 'bg-blue-500',
              })),
              ...selectedVehicle.photos.map(p => ({
                id: p.id, type: 'photo' as const, icon: '📸',
                title: `Φωτογραφία: ${p.category}`,
                description: p.caption, timestamp: p.timestamp, color: 'bg-violet-500',
              })),
              ...selectedVehicle.damageReports.map(d => ({
                id: d.id, type: 'damage' as const, icon: '🔴',
                title: `Ζημιά: ${d.severity === 'major' ? 'Μεγάλη' : d.severity === 'moderate' ? 'Μέτρια' : 'Μικρή'}`,
                description: d.description.slice(0, 120), timestamp: d.timestamp, color: 'bg-red-500',
              })),
              ...selectedVehicle.washHistory.map(w => ({
                id: w.id, type: 'wash' as const, icon: '🚿',
                title: `Πλύσιμο: ${w.washType}`,
                description: w.notes || `Διάρκεια: ${w.duration || '?'} λεπτά`,
                timestamp: w.requestedAt, color: 'bg-cyan-500',
              })),
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            if (events.length === 0) {
              return <div className="text-center py-10 text-slate-500">Δεν υπάρχει ιστορικό</div>;
            }

            return (
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-slate-500/10" />
                {events.map((event) => (
                  <div key={event.id} className="relative mb-4 pl-5">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[15px] top-1.5 w-3 h-3 rounded-full ${event.color} border-2 border-slate-900 z-[1]`} />
                    <div className="p-3 rounded-[10px] bg-slate-800/30 border border-slate-500/6">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                          <span aria-hidden="true">{event.icon}</span>
                          <span>{event.title}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(event.timestamp).toLocaleString('el', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[13px] text-slate-400 leading-snug">
                        {event.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </main>
    );
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-200">
        {showMobileDetail ? renderDetail() : renderVehicleList()}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-200">
      {renderVehicleList()}
      {renderDetail()}
    </div>
  );
}

export default FleetTool;
