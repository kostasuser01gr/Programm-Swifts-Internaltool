import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/schedule_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../utils/constants.dart';
import '../../utils/theme.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schedState = ref.watch(scheduleProvider);
    final authState = ref.watch(authProvider);
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Πίνακας Ελέγχου'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            tooltip: 'Ειδοποιήσεις',
            onPressed: () {},
          ),
        ],
      ),
      body: schedState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                ref.read(scheduleProvider.notifier).loadWeek(
                      schedState.selectedWeekStart,
                    );
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Greeting
                  Text(
                    'Καλησπέρα, ${authState.currentUser?.firstName ?? 'Χρήστη'} 👋',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateHelpers.formatWeekRange(schedState.selectedWeekStart),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 24),

                  // Quick Stats Row
                  _StatsRow(schedState: schedState),
                  const SizedBox(height: 24),

                  // Violations Card
                  if (schedState.violations.isNotEmpty)
                    _ViolationsCard(violations: schedState.violations),
                  if (schedState.violations.isNotEmpty)
                    const SizedBox(height: 16),

                  // Today's Coverage
                  _TodayCoverageCard(schedState: schedState),
                  const SizedBox(height: 16),

                  // Quick Actions
                  _QuickActionsCard(role: authState.role),
                ],
              ),
            ),
    );
  }
}

// ── Stats Row ───────────────────────────────────────────
class _StatsRow extends StatelessWidget {
  final ScheduleState schedState;
  const _StatsRow({required this.schedState});

  @override
  Widget build(BuildContext context) {
    final activeEmployees =
        schedState.employees.where((e) => e.isActive).length;
    final totalAssignments = schedState.assignments.length;
    final restDays = schedState.assignments.where((a) {
      final sc = schedState.shiftCodeById(a.shiftCodeId);
      return sc?.isRestDay ?? false;
    }).length;
    final workAssignments = totalAssignments - restDays;

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _StatCard(
          icon: Icons.people,
          label: 'Ενεργοί',
          value: '$activeEmployees',
          color: Colors.blue,
        ),
        _StatCard(
          icon: Icons.assignment,
          label: 'Βάρδιες',
          value: '$workAssignments',
          color: Colors.green,
        ),
        _StatCard(
          icon: Icons.weekend,
          label: 'Ρεπό',
          value: '$restDays',
          color: Colors.orange,
        ),
        _StatCard(
          icon: Icons.warning_amber,
          label: 'Παραβάσεις',
          value: '${schedState.violations.length}',
          color: schedState.violations.isEmpty ? Colors.green : Colors.red,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 150,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 8),
              Text(value,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      )),
              Text(label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      )),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Violations Alert ────────────────────────────────────
class _ViolationsCard extends StatelessWidget {
  final List<ConstraintViolation> violations;
  const _ViolationsCard({required this.violations});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      color: colors.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning_rounded, color: colors.error),
                const SizedBox(width: 8),
                Text(
                  'Παραβάσεις Κανόνων (${violations.length})',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: colors.onErrorContainer,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...violations.take(5).map((v) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    '• ${v.message}',
                    style: TextStyle(color: colors.onErrorContainer),
                  ),
                )),
            if (violations.length > 5)
              Text(
                '...και ${violations.length - 5} ακόμη',
                style: TextStyle(
                  color: colors.onErrorContainer,
                  fontStyle: FontStyle.italic,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Today's Coverage ────────────────────────────────────
class _TodayCoverageCard extends StatelessWidget {
  final ScheduleState schedState;
  const _TodayCoverageCard({required this.schedState});

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final todayAssignments = schedState.assignments.where((a) =>
        a.date.year == today.year &&
        a.date.month == today.month &&
        a.date.day == today.day);

    // Group by shift code
    final Map<String, int> codeCounts = {};
    for (final a in todayAssignments) {
      final sc = schedState.shiftCodeById(a.shiftCodeId);
      final code = sc?.code ?? '?';
      if (sc?.isRestDay == true) continue;
      codeCounts[code] = (codeCounts[code] ?? 0) + 1;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.today, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Σημερινή Κάλυψη — ${DateHelpers.formatDateGreek(today)}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (codeCounts.isEmpty)
              const Text('Δεν υπάρχουν βάρδιες σήμερα.')
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: codeCounts.entries.map((e) {
                  final sc = schedState.shiftCodes.cast<ShiftCode?>().firstWhere(
                        (s) => s!.code == e.key,
                        orElse: () => null,
                      );
                  return Chip(
                    avatar: CircleAvatar(
                      backgroundColor: sc != null
                          ? ShiftForgeTheme.shiftColor(sc.colorHex)
                          : Colors.grey,
                      child: Text('${e.value}',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12)),
                    ),
                    label: Text('${e.key} (${sc?.timeRange ?? '?'})'),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Quick Actions ───────────────────────────────────────
class _QuickActionsCard extends StatelessWidget {
  final UserRole role;
  const _QuickActionsCard({required this.role});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Γρήγορες Ενέργειες',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    )),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (role.canEditSchedule)
                  ActionChip(
                    avatar: const Icon(Icons.calendar_month, size: 18),
                    label: const Text('Πρόγραμμα'),
                    onPressed: () => _navigate(context, '/schedule'),
                  ),
                ActionChip(
                  avatar: const Icon(Icons.swap_horiz, size: 18),
                  label: const Text('Αιτήσεις'),
                  onPressed: () => _navigate(context, '/requests'),
                ),
                if (role.canUseAICopilot)
                  ActionChip(
                    avatar: const Icon(Icons.auto_awesome, size: 18),
                    label: const Text('AI Copilot'),
                    onPressed: () => _navigate(context, '/copilot'),
                  ),
                ActionChip(
                  avatar: const Icon(Icons.chat_bubble_outline, size: 18),
                  label: const Text('Συνομιλίες'),
                  onPressed: () => _navigate(context, '/chat'),
                ),
                if (role.canViewAnalytics)
                  ActionChip(
                    avatar: const Icon(Icons.bar_chart, size: 18),
                    label: const Text('Αναλυτικά'),
                    onPressed: () => _navigate(context, '/analytics'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _navigate(BuildContext context, String path) {
    // GoRouter navigation (context.go imports)
    // Using Navigator for simplicity within shell
    Navigator.of(context).pushNamed(path);
  }
}
