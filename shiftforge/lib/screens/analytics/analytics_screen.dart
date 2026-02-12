import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/schedule_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../utils/constants.dart';
import '../../utils/theme.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schedState = ref.watch(scheduleProvider);
    final authState = ref.watch(authProvider);

    if (!authState.role.canViewAnalytics) {
      return Scaffold(
        appBar: AppBar(title: const Text('Αναλυτικά')),
        body: const Center(child: Text('Δεν έχετε πρόσβαση.')),
      );
    }

    final employees = schedState.employees;
    final assignments = schedState.assignments;

    // Compute analytics
    final totalWork = assignments.where((a) {
      final sc = schedState.shiftCodeById(a.shiftCodeId);
      return !(sc?.isRestDay ?? true);
    }).length;
    final totalRest = assignments.length - totalWork;

    // Hours per employee
    final hoursData = employees.map((e) {
      return _EmpHours(
        name: e.displayName,
        hours: schedState.totalHoursFor(e.id),
        restDays: schedState.restDaysFor(e.id),
      );
    }).toList()
      ..sort((a, b) => b.hours.compareTo(a.hours));

    // Shift code distribution
    final Map<String, int> codeDistribution = {};
    for (final a in assignments) {
      final sc = schedState.shiftCodeById(a.shiftCodeId);
      final code = sc?.code ?? '?';
      codeDistribution[code] = (codeDistribution[code] ?? 0) + 1;
    }
    final sortedCodes = codeDistribution.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Αναλυτικά'),
        actions: [
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.download, size: 18),
            label: const Text('Εξαγωγή'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Week info
          Text(
            'Εβδομάδα: ${DateHelpers.formatWeekRange(schedState.selectedWeekStart)}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),

          // Summary cards
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MiniStat('Σύνολο Βαρδιών', '$totalWork', Icons.work, Colors.blue),
              _MiniStat('Ρεπό', '$totalRest', Icons.weekend, Colors.orange),
              _MiniStat('Υπάλληλοι', '${employees.length}', Icons.people, Colors.green),
              _MiniStat('Παραβάσεις', '${schedState.violations.length}',
                  Icons.warning, schedState.violations.isEmpty ? Colors.green : Colors.red),
            ],
          ),
          const SizedBox(height: 24),

          // Hours per employee (bar chart placeholder)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Ώρες ανά Υπάλληλο',
                      style: Theme.of(context).textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ...hoursData.map((d) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 110,
                              child: Text(d.name,
                                  style: const TextStyle(fontSize: 12),
                                  overflow: TextOverflow.ellipsis),
                            ),
                            Expanded(
                              child: LinearProgressIndicator(
                                value: d.hours / AppConstants.maxHoursPerWeek,
                                backgroundColor: Colors.grey.shade200,
                                color: d.hours > AppConstants.maxHoursPerWeek
                                    ? Colors.red
                                    : Colors.blue,
                                minHeight: 14,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 40,
                              child: Text('${d.hours.toStringAsFixed(0)}h',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: d.hours > AppConstants.maxHoursPerWeek
                                        ? Colors.red
                                        : null,
                                  )),
                            ),
                            SizedBox(
                              width: 30,
                              child: Text('${d.restDays}R',
                                  style: const TextStyle(
                                      fontSize: 11, color: Colors.orange),
                                  textAlign: TextAlign.center),
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Shift code distribution
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Κατανομή Κωδικών',
                      style: Theme.of(context).textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: sortedCodes.map((e) {
                      final sc = schedState.shiftCodes.cast<ShiftCode?>().firstWhere(
                            (s) => s!.code == e.key,
                            orElse: () => null,
                          );
                      return Chip(
                        avatar: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: sc != null
                                ? ShiftForgeTheme.shiftColor(sc.colorHex)
                                : Colors.grey,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Text('${e.value}',
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 10)),
                        ),
                        label: Text('${e.key}',
                            style: const TextStyle(fontSize: 12)),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Fairness index
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Δείκτης Δικαιοσύνης',
                      style: Theme.of(context).textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  _buildFairnessGauge(hoursData),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildFairnessGauge(List<_EmpHours> data) {
    if (data.isEmpty) return const Text('Δεν υπάρχουν δεδομένα.');
    final hours = data.map((d) => d.hours).where((h) => h > 0).toList();
    if (hours.isEmpty) return const Text('Δεν υπάρχουν βάρδιες.');

    final avg = hours.reduce((a, b) => a + b) / hours.length;
    final maxDev =
        hours.map((h) => (h - avg).abs()).reduce((a, b) => a > b ? a : b);
    final fairness = maxDev < 1 ? 1.0 : (1.0 - (maxDev / avg)).clamp(0.0, 1.0);
    final pct = (fairness * 100).toStringAsFixed(0);

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: LinearProgressIndicator(
                value: fairness,
                minHeight: 20,
                borderRadius: BorderRadius.circular(6),
                backgroundColor: Colors.grey.shade200,
                color: fairness > 0.8
                    ? Colors.green
                    : fairness > 0.6
                        ? Colors.orange
                        : Colors.red,
              ),
            ),
            const SizedBox(width: 12),
            Text('$pct%',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Μέσος: ${avg.toStringAsFixed(1)}h | '
          'Max απόκλιση: ${maxDev.toStringAsFixed(1)}h',
          style: const TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _MiniStat(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 140,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 6),
              Text(value,
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.bold)),
              Text(label,
                  style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmpHours {
  final String name;
  final double hours;
  final int restDays;
  _EmpHours({required this.name, required this.hours, required this.restDays});
}
