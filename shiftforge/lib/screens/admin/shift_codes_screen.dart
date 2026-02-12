import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/schedule_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../utils/theme.dart';

class ShiftCodesScreen extends ConsumerWidget {
  const ShiftCodesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schedState = ref.watch(scheduleProvider);
    final authState = ref.watch(authProvider);
    final canManage = authState.role.canManageShiftCodes;
    final codes = schedState.shiftCodes;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Κωδικοί Βαρδιών'),
        actions: [
          if (canManage)
            IconButton(
              icon: const Icon(Icons.add),
              tooltip: 'Νέος Κωδικός',
              onPressed: () => _showCodeForm(context),
            ),
        ],
      ),
      body: codes.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: codes.length,
              itemBuilder: (_, i) {
                final sc = codes[i];
                return Card(
                  child: ListTile(
                    leading: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: ShiftForgeTheme.shiftColor(sc.colorHex),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        sc.code,
                        style: TextStyle(
                          color: ShiftForgeTheme.shiftTextColor(sc.colorHex),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    title: Text(sc.label,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Row(
                      children: [
                        const Icon(Icons.access_time, size: 14),
                        const SizedBox(width: 4),
                        Text(sc.timeRange),
                        const SizedBox(width: 12),
                        const Icon(Icons.timer, size: 14),
                        const SizedBox(width: 4),
                        Text('${sc.paidHours.toStringAsFixed(0)}h'),
                        if (sc.isNightShift) ...[
                          const SizedBox(width: 12),
                          const Icon(Icons.nightlight_round,
                              size: 14, color: Colors.indigo),
                          const SizedBox(width: 2),
                          const Text('Νύχτα',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.indigo)),
                        ],
                      ],
                    ),
                    trailing: canManage
                        ? IconButton(
                            icon: const Icon(Icons.edit, size: 20),
                            onPressed: () =>
                                _showCodeForm(context, existing: sc),
                          )
                        : null,
                  ),
                );
              },
            ),
    );
  }

  void _showCodeForm(BuildContext context, {ShiftCode? existing}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(existing == null
            ? 'Δημιουργία κωδικού — υπό ανάπτυξη'
            : 'Επεξεργασία ${existing.code} — υπό ανάπτυξη'),
      ),
    );
  }
}
