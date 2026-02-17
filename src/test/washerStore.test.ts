// ─── Tests: Washer Store ─────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import { useWasherStore } from '../app/store/washerStore';

describe('washerStore', () => {
  beforeEach(() => {
    const store = useWasherStore.getState();
    // Clear queue
    store.queue.forEach(r => store.removeFromQueue(r.id));
  });

  it('addToQueue adds a record', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-1234', 'economy', 'standard', 'normal', 'user-1');
    expect(id).toBeTruthy();
    const record = store.getRecord(id);
    expect(record).toBeDefined();
    expect(record?.plate).toBe('ΗΡΑ-1234');
    expect(record?.status).toBe('waiting');
    expect(record?.washType).toBe('standard');
    expect(record?.checklist.length).toBeGreaterThan(0);
  });

  it('startWash transitions to in_progress', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-5678', 'economy', 'quick', 'normal', 'user-1');
    store.startWash(id, 'washer-1');
    const record = useWasherStore.getState().getRecord(id);
    expect(record?.status).toBe('in_progress');
    expect(record?.assignedTo).toBe('washer-1');
    expect(record?.startedAt).toBeTruthy();
  });

  it('completeWash transitions to done', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-0001', 'economy', 'quick', 'normal', 'user-1');
    store.startWash(id, 'washer-1');
    store.completeWash(id);
    const record = useWasherStore.getState().getRecord(id);
    expect(record?.status).toBe('done');
    expect(record?.completedAt).toBeTruthy();
  });

  it('inspectWash (pass) transitions to inspected', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-0002', 'economy', 'quick', 'normal', 'user-1');
    store.startWash(id, 'washer-1');
    store.completeWash(id);
    store.inspectWash(id, 'inspector-1', true, 'All good');
    const record = useWasherStore.getState().getRecord(id);
    expect(record?.status).toBe('inspected');
    expect(record?.inspectedBy).toBe('inspector-1');
    expect(record?.notes).toContain('✅ Επιθεώρηση OK');
  });

  it('inspectWash (fail) re-queues to waiting with reset checklist', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-0003', 'economy', 'standard', 'normal', 'user-1');
    store.startWash(id, 'washer-1');

    // Check some items
    const record = useWasherStore.getState().getRecord(id)!;
    store.toggleChecklistItem(id, record.checklist[0].id);
    store.toggleChecklistItem(id, record.checklist[1].id);

    store.completeWash(id);
    store.inspectWash(id, 'inspector-1', false, 'Dirty exterior');

    const updated = useWasherStore.getState().getRecord(id);
    expect(updated?.status).toBe('waiting');
    expect(updated?.assignedTo).toBeUndefined();
    expect(updated?.startedAt).toBeUndefined();
    expect(updated?.completedAt).toBeUndefined();
    // Checklist should be reset
    expect(updated?.checklist.every(c => !c.checked)).toBe(true);
    expect(updated?.notes).toContain('❌ Επιθεώρηση ΑΠΟΤΥΧΙΑ');
  });

  it('toggleChecklistItem toggles a specific item', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-0004', 'economy', 'quick', 'normal', 'user-1');
    store.startWash(id, 'washer-1');

    const itemId = useWasherStore.getState().getRecord(id)!.checklist[0].id;
    expect(useWasherStore.getState().getRecord(id)!.checklist[0].checked).toBe(false);

    store.toggleChecklistItem(id, itemId);
    expect(useWasherStore.getState().getRecord(id)!.checklist[0].checked).toBe(true);

    store.toggleChecklistItem(id, itemId);
    expect(useWasherStore.getState().getRecord(id)!.checklist[0].checked).toBe(false);
  });

  it('changePriority updates record priority', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-0005', 'economy', 'quick', 'normal', 'user-1');
    store.changePriority(id, 'urgent');
    expect(useWasherStore.getState().getRecord(id)?.priority).toBe('urgent');
  });

  it('removeFromQueue deletes the record', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-0006', 'economy', 'quick', 'normal', 'user-1');
    store.removeFromQueue(id);
    expect(useWasherStore.getState().getRecord(id)).toBeUndefined();
  });

  it('getQueueStats returns correct counts', () => {
    const store = useWasherStore.getState();
    const id1 = store.addToQueue('ΗΡΑ-A', 'economy', 'quick', 'normal', 'user-1');
    const id2 = store.addToQueue('ΗΡΑ-B', 'economy', 'quick', 'normal', 'user-1');
    store.startWash(id1, 'washer-1');

    const stats = useWasherStore.getState().getQueueStats();
    expect(stats.waiting).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.total).toBe(2);
  });

  it('getQueueByStatus groups records correctly', () => {
    const store = useWasherStore.getState();
    store.addToQueue('ΗΡΑ-X', 'economy', 'quick', 'normal', 'user-1');
    const id2 = store.addToQueue('ΗΡΑ-Y', 'economy', 'quick', 'urgent', 'user-1');
    store.startWash(id2, 'washer-1');

    const byStatus = useWasherStore.getState().getQueueByStatus();
    expect(byStatus.waiting.length).toBe(1);
    expect(byStatus.in_progress.length).toBe(1);
  });

  it('setDamageFound marks damage on record', () => {
    const store = useWasherStore.getState();
    const id = store.addToQueue('ΗΡΑ-DMG', 'economy', 'quick', 'normal', 'user-1');
    store.setDamageFound(id, true, 'Scratch on bumper');
    const record = useWasherStore.getState().getRecord(id);
    expect(record?.damageFound).toBe(true);
    expect(record?.damageNotes).toBe('Scratch on bumper');
  });
});
