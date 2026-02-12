import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/schedule_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../utils/constants.dart';
import '../../utils/theme.dart';

class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> {
  String? _selectedCellKey; // "employeeId:dayIndex"

  @override
  void initState() {
    super.initState();
    // Load current week on first build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final sched = ref.read(scheduleProvider);
      if (sched.employees.isEmpty && !sched.isLoading) {
        ref.read(scheduleProvider.notifier).loadWeek(sched.selectedWeekStart);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final schedState = ref.watch(scheduleProvider);
    final authState = ref.watch(authProvider);
    final canEdit =
        authState.role.canEditSchedule && schedState.scheduleWeek?.status != ScheduleStatus.published;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Πρόγραμμα Βαρδιών'),
        actions: [
          // Week navigation
          IconButton(
            icon: const Icon(Icons.chevron_left),
            tooltip: 'Προηγούμενη εβδομάδα',
            onPressed: () =>
                ref.read(scheduleProvider.notifier).previousWeek(),
          ),
          TextButton(
            onPressed: () => _pickWeek(context),
            child: Text(
              DateHelpers.formatWeekRange(schedState.selectedWeekStart),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            tooltip: 'Επόμενη εβδομάδα',
            onPressed: () => ref.read(scheduleProvider.notifier).nextWeek(),
          ),
          const SizedBox(width: 8),
          // Status chip
          _StatusChip(status: schedState.scheduleWeek?.status),
          const SizedBox(width: 8),
          // Actions menu
          if (canEdit) ...[
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (v) => _handleAction(v, schedState),
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'publish',
                  child: ListTile(
                    leading: Icon(Icons.publish),
                    title: Text('Δημοσίευση'),
                    dense: true,
                  ),
                ),
                const PopupMenuItem(
                  value: 'copy_prev',
                  child: ListTile(
                    leading: Icon(Icons.copy),
                    title: Text('Αντιγραφή προηγούμενης'),
                    dense: true,
                  ),
                ),
                const PopupMenuItem(
                  value: 'export',
                  child: ListTile(
                    leading: Icon(Icons.download),
                    title: Text('Εξαγωγή PDF'),
                    dense: true,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
      body: schedState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : schedState.error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.error_outline,
                          size: 48,
                          color: Theme.of(context).colorScheme.error),
                      const SizedBox(height: 8),
                      Text(schedState.error!),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () => ref
                            .read(scheduleProvider.notifier)
                            .loadWeek(schedState.selectedWeekStart),
                        child: const Text('Επανάληψη'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // Violations bar
                    if (schedState.violations.isNotEmpty)
                      _ViolationBar(violations: schedState.violations),

                    // Shift code legend
                    _ShiftCodeLegend(shiftCodes: schedState.shiftCodes),

                    // Main grid
                    Expanded(
                      child: _WeeklyGrid(
                        schedState: schedState,
                        canEdit: canEdit,
                        selectedCellKey: _selectedCellKey,
                        onCellTap: (empId, dayIdx) {
                          setState(() {
                            _selectedCellKey = '$empId:$dayIdx';
                          });
                          if (canEdit) {
                            _showShiftPicker(
                              context,
                              empId,
                              schedState.weekDays[dayIdx],
                              dayIdx,
                              schedState,
                            );
                          }
                        },
                      ),
                    ),
                  ],
                ),
    );
  }

  void _pickWeek(BuildContext context) async {
    final current = ref.read(scheduleProvider).selectedWeekStart;
    final picked = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
      locale: const Locale('el', 'GR'),
    );
    if (picked != null) {
      final monday = DateHelpers.weekStart(picked);
      ref.read(scheduleProvider.notifier).loadWeek(monday);
    }
  }

  void _handleAction(String action, ScheduleState state) {
    switch (action) {
      case 'publish':
        _confirmPublish();
        break;
      case 'copy_prev':
        ref.read(scheduleProvider.notifier).copyFromPreviousWeek();
        break;
      case 'export':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Εξαγωγή PDF σε εξέλιξη...')),
        );
        break;
    }
  }

  void _confirmPublish() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Δημοσίευση Προγράμματος'),
        content: const Text(
            'Μετά τη δημοσίευση, οι αλλαγές θα είναι ορατές σε όλο το προσωπικό. Συνέχεια;'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Ακύρωση'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(scheduleProvider.notifier).publishSchedule();
            },
            child: const Text('Δημοσίευση'),
          ),
        ],
      ),
    );
  }

  void _showShiftPicker(
    BuildContext context,
    String employeeId,
    DateTime date,
    int dayIndex,
    ScheduleState state,
  ) {
    final currentAssignment = state.assignmentFor(employeeId, date);
    final currentShiftId = currentAssignment?.shiftCodeId;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final emp = state.employees.firstWhere((e) => e.id == employeeId);
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.5,
          maxChildSize: 0.8,
          builder: (_, scrollCtrl) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(emp.displayName,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(fontWeight: FontWeight.bold)),
                            Text(
                              '${AppConstants.dayNamesFull[dayIndex]} — ${DateHelpers.formatDateGreek(date)}',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Expanded(
                  child: ListView.builder(
                    controller: scrollCtrl,
                    itemCount: state.shiftCodes.length,
                    itemBuilder: (_, i) {
                      final sc = state.shiftCodes[i];
                      final isSelected = sc.id == currentShiftId;
                      return ListTile(
                        selected: isSelected,
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: ShiftForgeTheme.shiftColor(sc.colorHex),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            sc.code,
                            style: TextStyle(
                              color:
                                  ShiftForgeTheme.shiftTextColor(sc.colorHex),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        title: Text(sc.label),
                        subtitle: Text(sc.timeRange),
                        trailing: isSelected
                            ? const Icon(Icons.check_circle,
                                color: Colors.green)
                            : null,
                        onTap: () {
                          ref
                              .read(scheduleProvider.notifier)
                              .assignShift(employeeId: employeeId, date: date, shiftCodeId: sc.id);
                          Navigator.pop(ctx);
                        },
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

// ── Status Chip ─────────────────────────────────────────
class _StatusChip extends StatelessWidget {
  final ScheduleStatus? status;
  const _StatusChip({this.status});

  @override
  Widget build(BuildContext context) {
    final s = status ?? ScheduleStatus.draft;
    final color = switch (s) {
      ScheduleStatus.draft => Colors.orange,
      ScheduleStatus.published => Colors.green,
      ScheduleStatus.archived => Colors.grey,
    };
    return Chip(
      label: Text(s.displayName, style: const TextStyle(fontSize: 12)),
      backgroundColor: color.withValues(alpha: 0.15),
      side: BorderSide(color: color.withValues(alpha: 0.4)),
      visualDensity: VisualDensity.compact,
    );
  }
}

// ── Violation Bar ───────────────────────────────────────
class _ViolationBar extends StatelessWidget {
  final List<ConstraintViolation> violations;
  const _ViolationBar({required this.violations});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Theme.of(context).colorScheme.errorContainer,
      child: Row(
        children: [
          Icon(Icons.warning_amber,
              size: 18, color: Theme.of(context).colorScheme.error),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${violations.length} παράβαση(εις) κανόνων ανιχνεύτηκαν',
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onErrorContainer),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shift Code Legend ───────────────────────────────────
class _ShiftCodeLegend extends StatelessWidget {
  final List<ShiftCode> shiftCodes;
  const _ShiftCodeLegend({required this.shiftCodes});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: shiftCodes.length,
        separatorBuilder: (_, __) => const SizedBox(width: 4),
        itemBuilder: (_, i) {
          final sc = shiftCodes[i];
          return Tooltip(
            message: '${sc.code}: ${sc.timeRange}',
            child: Chip(
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
              backgroundColor:
                  ShiftForgeTheme.shiftColor(sc.colorHex).withValues(alpha: 0.2),
              label: Text(sc.code, style: const TextStyle(fontSize: 11)),
              padding: EdgeInsets.zero,
            ),
          );
        },
      ),
    );
  }
}

// ── Weekly Grid (the core of the schedule) ──────────────
class _WeeklyGrid extends StatelessWidget {
  final ScheduleState schedState;
  final bool canEdit;
  final String? selectedCellKey;
  final void Function(String employeeId, int dayIndex) onCellTap;

  const _WeeklyGrid({
    required this.schedState,
    required this.canEdit,
    this.selectedCellKey,
    required this.onCellTap,
  });

  @override
  Widget build(BuildContext context) {
    final employees = schedState.employees;
    final weekDays = schedState.weekDays;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          columnSpacing: 4,
          headingRowHeight: 48,
          dataRowMinHeight: 44,
          dataRowMaxHeight: 52,
          horizontalMargin: 8,
          border: TableBorder.all(
            color: Theme.of(context).dividerColor.withValues(alpha: 0.3),
            width: 0.5,
          ),
          columns: [
            const DataColumn(
              label: SizedBox(
                width: 120,
                child: Text('ΟΝΟΜΑ',
                    style:
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ),
            ...List.generate(7, (i) {
              final d = weekDays[i];
              final isToday = _isToday(d);
              return DataColumn(
                label: Container(
                  width: 56,
                  alignment: Alignment.center,
                  decoration: isToday
                      ? BoxDecoration(
                          color: Theme.of(context)
                              .colorScheme
                              .primary
                              .withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        )
                      : null,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(AppConstants.dayNamesShort[i],
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            color: i >= 5
                                ? Theme.of(context).colorScheme.error
                                : null,
                          )),
                      Text('${d.day}/${d.month}',
                          style: const TextStyle(fontSize: 10)),
                    ],
                  ),
                ),
              );
            }),
            // Hours column
            const DataColumn(
              label: SizedBox(
                width: 44,
                child: Text('ΩΡΕΣ',
                    style:
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                    textAlign: TextAlign.center),
              ),
            ),
          ],
          rows: employees.map((emp) {
            final totalHours = schedState.totalHoursFor(emp.id);
            final isOverHours = totalHours > AppConstants.maxHoursPerWeek;
            return DataRow(
              cells: [
                DataCell(
                  SizedBox(
                    width: 120,
                    child: Text(
                      emp.displayName,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                ...List.generate(7, (dayIdx) {
                  final date = weekDays[dayIdx];
                  final assignment = schedState.assignmentFor(emp.id, date);
                  final sc = assignment != null
                      ? schedState.shiftCodeById(assignment.shiftCodeId)
                      : null;
                  final cellKey = '${emp.id}:$dayIdx';
                  final isSelected = cellKey == selectedCellKey;

                  return DataCell(
                    _ShiftCell(
                      shiftCode: sc,
                      isSelected: isSelected,
                      isEditable: canEdit,
                    ),
                    onTap: () => onCellTap(emp.id, dayIdx),
                  );
                }),
                // Weekly hours
                DataCell(
                  SizedBox(
                    width: 44,
                    child: Text(
                      totalHours.toStringAsFixed(0),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: isOverHours ? Colors.red : null,
                      ),
                    ),
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }
}

// ── Individual Shift Cell ───────────────────────────────
class _ShiftCell extends StatelessWidget {
  final ShiftCode? shiftCode;
  final bool isSelected;
  final bool isEditable;

  const _ShiftCell({
    this.shiftCode,
    this.isSelected = false,
    this.isEditable = false,
  });

  @override
  Widget build(BuildContext context) {
    if (shiftCode == null) {
      return Container(
        width: 56,
        height: 36,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: isSelected
              ? Border.all(color: Theme.of(context).colorScheme.primary, width: 2)
              : null,
          borderRadius: BorderRadius.circular(6),
          color: Colors.grey.withValues(alpha: 0.05),
        ),
        child: Text(
          isEditable ? '+' : '—',
          style: TextStyle(
            color: Colors.grey.shade400,
            fontSize: 14,
          ),
        ),
      );
    }

    final bgColor = ShiftForgeTheme.shiftColor(shiftCode!.colorHex);
    final textColor = ShiftForgeTheme.shiftTextColor(shiftCode!.colorHex);

    return Container(
      width: 56,
      height: 36,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bgColor.withValues(alpha: shiftCode!.isRestDay ? 0.3 : 0.85),
        borderRadius: BorderRadius.circular(6),
        border: isSelected
            ? Border.all(color: Theme.of(context).colorScheme.primary, width: 2)
            : Border.all(color: bgColor.withValues(alpha: 0.3), width: 0.5),
      ),
      child: Text(
        shiftCode!.code,
        style: TextStyle(
          color: shiftCode!.isRestDay ? Colors.grey.shade600 : textColor,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }
}
