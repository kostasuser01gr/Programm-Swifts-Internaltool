import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';

class RequestsScreen extends ConsumerStatefulWidget {
  const RequestsScreen({super.key});

  @override
  ConsumerState<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends ConsumerState<RequestsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  // Mock data until services are wired
  final List<_LeaveItem> _leaveRequests = [
    _LeaveItem('ΤΖΑΝΙΔΑΚΗ', '25/02/2026', 'Προσωπικοί λόγοι',
        RequestStatus.pending),
    _LeaveItem(
        'ΠΑΠΑΔΟΠΟΥΛΟΣ', '27/02/2026', 'Ιατρικό ραντεβού', RequestStatus.approved),
    _LeaveItem('ΚΟΛΙΟΠΟΥΛΟΥ', '28/02/2026', 'Οικογενειακοί λόγοι',
        RequestStatus.denied),
  ];

  final List<_SwapItem> _swapRequests = [
    _SwapItem('ΤΖΑΝΙΔΑΚΗ', 'ΝΕΓΚΑ', 'Δευ 16/02 (301)', 'Τρι 17/02 (206)',
        RequestStatus.pending),
    _SwapItem('ΜΑΡΚΟΠΟΥΛΟΣ', 'ΣΜΑΪΛΗ', 'Τετ 18/02 (208)',
        'Πεμ 19/02 (213)', RequestStatus.approved),
  ];

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final canApprove = authState.role.canApproveRequests;
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Αιτήσεις'),
        bottom: TabBar(
          controller: _tabCtrl,
          tabs: const [
            Tab(icon: Icon(Icons.event_busy), text: 'Άδειες'),
            Tab(icon: Icon(Icons.swap_horiz), text: 'Ανταλλαγές'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _newRequest(context),
        icon: const Icon(Icons.add),
        label: const Text('Νέα Αίτηση'),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          // Leave requests tab
          _leaveRequests.isEmpty
              ? const Center(child: Text('Δεν υπάρχουν αιτήσεις αδείας'))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _leaveRequests.length,
                  itemBuilder: (_, i) {
                    final lr = _leaveRequests[i];
                    return Card(
                      child: ListTile(
                        leading: _statusIcon(lr.status),
                        title: Text(lr.employeeName,
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${lr.date} — ${lr.reason}'),
                        trailing: canApprove && lr.status == RequestStatus.pending
                            ? Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.check_circle,
                                        color: Colors.green),
                                    tooltip: 'Έγκριση',
                                    onPressed: () => setState(
                                        () => lr.status = RequestStatus.approved),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.cancel,
                                        color: Colors.red),
                                    tooltip: 'Απόρριψη',
                                    onPressed: () => setState(
                                        () => lr.status = RequestStatus.denied),
                                  ),
                                ],
                              )
                            : Chip(
                                label: Text(lr.status.displayName,
                                    style: const TextStyle(fontSize: 11)),
                                visualDensity: VisualDensity.compact,
                              ),
                      ),
                    );
                  },
                ),

          // Swap requests tab
          _swapRequests.isEmpty
              ? const Center(child: Text('Δεν υπάρχουν αιτήσεις ανταλλαγής'))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _swapRequests.length,
                  itemBuilder: (_, i) {
                    final sr = _swapRequests[i];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                _statusIcon(sr.status),
                                const SizedBox(width: 8),
                                Text('${sr.requester} ↔ ${sr.target}',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold)),
                                const Spacer(),
                                Chip(
                                  label: Text(sr.status.displayName,
                                      style: const TextStyle(fontSize: 11)),
                                  visualDensity: VisualDensity.compact,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: colors.surfaceContainerLow,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(sr.requesterShift,
                                        textAlign: TextAlign.center),
                                  ),
                                ),
                                const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 8),
                                  child: Icon(Icons.swap_horiz),
                                ),
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: colors.surfaceContainerLow,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(sr.targetShift,
                                        textAlign: TextAlign.center),
                                  ),
                                ),
                              ],
                            ),
                            if (canApprove &&
                                sr.status == RequestStatus.pending) ...[
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  OutlinedButton(
                                    onPressed: () => setState(
                                        () => sr.status = RequestStatus.denied),
                                    child: const Text('Απόρριψη'),
                                  ),
                                  const SizedBox(width: 8),
                                  FilledButton(
                                    onPressed: () => setState(() =>
                                        sr.status = RequestStatus.approved),
                                    child: const Text('Έγκριση'),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  Widget _statusIcon(RequestStatus status) {
    return switch (status) {
      RequestStatus.pending =>
        const Icon(Icons.hourglass_empty, color: Colors.orange),
      RequestStatus.approved =>
        const Icon(Icons.check_circle, color: Colors.green),
      RequestStatus.denied => const Icon(Icons.cancel, color: Colors.red),
      RequestStatus.cancelled =>
        const Icon(Icons.block, color: Colors.grey),
    };
  }

  void _newRequest(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Νέα Αίτηση',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.event_busy),
                title: const Text('Αίτηση Αδείας'),
                subtitle: const Text('Ζήτα ρεπό ή άδεια για μια ημέρα'),
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content:
                            Text('Φόρμα αδείας — υπό ανάπτυξη')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.swap_horiz),
                title: const Text('Αίτηση Ανταλλαγής'),
                subtitle: const Text('Ανταλλαγή βάρδιας με συνάδελφο'),
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content:
                            Text('Φόρμα ανταλλαγής — υπό ανάπτυξη')),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

// Mock data classes
class _LeaveItem {
  final String employeeName;
  final String date;
  final String reason;
  RequestStatus status;

  _LeaveItem(this.employeeName, this.date, this.reason, this.status);
}

class _SwapItem {
  final String requester;
  final String target;
  final String requesterShift;
  final String targetShift;
  RequestStatus status;

  _SwapItem(this.requester, this.target, this.requesterShift,
      this.targetShift, this.status);
}
