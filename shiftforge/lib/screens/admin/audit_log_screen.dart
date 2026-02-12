import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class AuditLogScreen extends ConsumerStatefulWidget {
  const AuditLogScreen({super.key});

  @override
  ConsumerState<AuditLogScreen> createState() => _AuditLogScreenState();
}

class _AuditLogScreenState extends ConsumerState<AuditLogScreen> {
  String _filterAction = 'all';

  // Mock audit log entries
  final List<_AuditEntry> _entries = [
    _AuditEntry('admin@company.gr', 'schedule.publish',
        'Δημοσίευση προγράμματος εβδ. 16/02', '2026-02-15 18:30'),
    _AuditEntry('admin@company.gr', 'shift.assign',
        'ΤΖΑΝΙΔΑΚΗ → 301 (Δευ 16/02)', '2026-02-15 17:45'),
    _AuditEntry('admin@company.gr', 'shift.assign',
        'ΠΑΠΑΔΟΠΟΥΛΟΣ → 206 (Τρι 17/02)', '2026-02-15 17:40'),
    _AuditEntry('admin@company.gr', 'employee.update',
        'Ενημέρωση ρόλου ΝΕΓΚΑ → manager', '2026-02-14 10:20'),
    _AuditEntry('manager@company.gr', 'leave.approve',
        'Έγκριση αδείας ΚΟΛΙΟΠΟΥΛΟΥ 28/02', '2026-02-14 09:15'),
    _AuditEntry('admin@company.gr', 'shift_code.create',
        'Νέος κωδικός 407: 16:00–00:00', '2026-02-13 14:00'),
    _AuditEntry('system', 'schedule.copy',
        'Αντιγραφή εβδ. 09/02 → 16/02', '2026-02-12 08:00'),
    _AuditEntry('admin@company.gr', 'auth.login',
        'Σύνδεση', '2026-02-12 07:55'),
  ];

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    if (!authState.role.canViewAuditLog) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ιστορικό')),
        body: const Center(child: Text('Δεν έχετε πρόσβαση στο ιστορικό.')),
      );
    }

    final filtered = _filterAction == 'all'
        ? _entries
        : _entries.where((e) => e.action.startsWith(_filterAction)).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ιστορικό Ενεργειών'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            initialValue: _filterAction,
            onSelected: (v) => setState(() => _filterAction = v),
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'all', child: Text('Όλα')),
              const PopupMenuItem(value: 'shift', child: Text('Βάρδιες')),
              const PopupMenuItem(
                  value: 'schedule', child: Text('Πρόγραμμα')),
              const PopupMenuItem(
                  value: 'employee', child: Text('Προσωπικό')),
              const PopupMenuItem(value: 'leave', child: Text('Άδειες')),
              const PopupMenuItem(value: 'auth', child: Text('Συνδέσεις')),
            ],
          ),
        ],
      ),
      body: filtered.isEmpty
          ? const Center(child: Text('Κανένα αποτέλεσμα'))
          : ListView.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final entry = filtered[i];
                return ListTile(
                  leading: _actionIcon(entry.action),
                  title: Text(entry.description,
                      style: const TextStyle(fontSize: 14)),
                  subtitle: Text('${entry.performedBy} · ${entry.timestamp}',
                      style: const TextStyle(fontSize: 12)),
                  dense: true,
                );
              },
            ),
    );
  }

  Widget _actionIcon(String action) {
    final (IconData icon, Color color) = switch (action) {
      String a when a.startsWith('shift') => (Icons.calendar_today, Colors.blue),
      String a when a.startsWith('schedule') => (Icons.publish, Colors.green),
      String a when a.startsWith('employee') => (Icons.person, Colors.orange),
      String a when a.startsWith('leave') => (Icons.event_busy, Colors.purple),
      String a when a.startsWith('auth') => (Icons.login, Colors.grey),
      _ => (Icons.history, Colors.grey),
    };
    return CircleAvatar(
      radius: 18,
      backgroundColor: color.withValues(alpha: 0.15),
      child: Icon(icon, size: 18, color: color),
    );
  }
}

class _AuditEntry {
  final String performedBy;
  final String action;
  final String description;
  final String timestamp;

  _AuditEntry(this.performedBy, this.action, this.description, this.timestamp);
}
