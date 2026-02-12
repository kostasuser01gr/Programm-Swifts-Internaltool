import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pocketbase/pocketbase.dart';
import '../models/models.dart';
import '../services/schedule_service.dart';
import '../services/pocketbase_client.dart';

/// Full schedule state for a selected week
class ScheduleState {
  final DateTime selectedWeekStart;
  final ScheduleWeek? scheduleWeek;
  final List<Employee> employees;
  final List<ShiftCode> shiftCodes;
  final List<ShiftAssignment> assignments;
  final List<Team> teams;
  final List<ConstraintViolation> violations;
  final bool isLoading;
  final String? error;

  const ScheduleState({
    required this.selectedWeekStart,
    this.scheduleWeek,
    this.employees = const [],
    this.shiftCodes = const [],
    this.assignments = const [],
    this.teams = const [],
    this.violations = const [],
    this.isLoading = false,
    this.error,
  });

  ScheduleState copyWith({
    DateTime? selectedWeekStart,
    ScheduleWeek? scheduleWeek,
    List<Employee>? employees,
    List<ShiftCode>? shiftCodes,
    List<ShiftAssignment>? assignments,
    List<Team>? teams,
    List<ConstraintViolation>? violations,
    bool? isLoading,
    String? error,
  }) {
    return ScheduleState(
      selectedWeekStart: selectedWeekStart ?? this.selectedWeekStart,
      scheduleWeek: scheduleWeek ?? this.scheduleWeek,
      employees: employees ?? this.employees,
      shiftCodes: shiftCodes ?? this.shiftCodes,
      assignments: assignments ?? this.assignments,
      teams: teams ?? this.teams,
      violations: violations ?? this.violations,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Get assignment for a specific employee on a specific date
  ShiftAssignment? assignmentFor(String employeeId, DateTime date) {
    return assignments.cast<ShiftAssignment?>().firstWhere(
      (a) =>
          a!.employeeId == employeeId &&
          a.date.year == date.year &&
          a.date.month == date.month &&
          a.date.day == date.day,
      orElse: () => null,
    );
  }

  /// Get shift code by ID
  ShiftCode? shiftCodeById(String id) {
    return shiftCodes.cast<ShiftCode?>().firstWhere(
      (s) => s!.id == id,
      orElse: () => null,
    );
  }

  /// Get 7 days of the selected week (Mon–Sun)
  List<DateTime> get weekDays {
    return List.generate(7, (i) => selectedWeekStart.add(Duration(days: i)));
  }

  /// Total hours for an employee this week
  double totalHoursFor(String employeeId) {
    return assignments
        .where((a) => a.employeeId == employeeId)
        .map((a) => shiftCodeById(a.shiftCodeId)?.paidHours ?? 0.0)
        .fold(0.0, (sum, h) => sum + h);
  }

  /// Number of rest days for an employee
  int restDaysFor(String employeeId) {
    return assignments
        .where((a) => a.employeeId == employeeId)
        .where((a) => shiftCodeById(a.shiftCodeId)?.isRestDay == true)
        .length;
  }

  /// Check if schedule is published
  bool get isPublished => scheduleWeek?.status == ScheduleStatus.published;
}

/// Schedule state notifier
class ScheduleNotifier extends StateNotifier<ScheduleState> {
  final ScheduleService _service;
  final PocketBase _pb;
  UnsubscribeFunc? _realtimeUnsub;

  ScheduleNotifier(this._service, this._pb)
      : super(ScheduleState(selectedWeekStart: _currentMonday()));

  static DateTime _currentMonday() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day - (now.weekday - 1));
  }

  /// Load everything for the selected week
  Future<void> loadWeek([DateTime? weekStart]) async {
    final targetWeek = weekStart ?? state.selectedWeekStart;
    state = state.copyWith(isLoading: true, error: null, selectedWeekStart: targetWeek);

    try {
      // Parallel fetch
      final results = await Future.wait([
        _service.fetchEmployees(),
        _service.fetchShiftCodes(),
        _service.fetchTeams(),
        _service.fetchScheduleWeek(targetWeek),
      ]);

      final employees = results[0] as List<Employee>;
      final shiftCodes = results[1] as List<ShiftCode>;
      final teams = results[2] as List<Team>;
      final scheduleWeek = results[3] as ScheduleWeek?;

      List<ShiftAssignment> assignments = [];
      if (scheduleWeek != null) {
        assignments = await _service.fetchAssignments(scheduleWeek.id);
      }

      final violations = _validateConstraints(employees, assignments, shiftCodes, targetWeek);

      state = state.copyWith(
        employees: employees,
        shiftCodes: shiftCodes,
        teams: teams,
        scheduleWeek: scheduleWeek,
        assignments: assignments,
        violations: violations,
        isLoading: false,
      );

      // Subscribe to real-time updates
      _subscribeToChanges();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Σφάλμα φόρτωσης: ${e.toString()}',
      );
    }
  }

  /// Navigate to previous week
  void previousWeek() {
    final prev = state.selectedWeekStart.subtract(const Duration(days: 7));
    loadWeek(prev);
  }

  /// Navigate to next week
  void nextWeek() {
    final next = state.selectedWeekStart.add(const Duration(days: 7));
    loadWeek(next);
  }

  /// Assign a shift to an employee on a date
  Future<void> assignShift({
    required String employeeId,
    required DateTime date,
    required String shiftCodeId,
  }) async {
    try {
      // Ensure schedule week exists
      var week = state.scheduleWeek;
      if (week == null) {
        week = await _service.createScheduleWeek(
          state.selectedWeekStart,
          '', // TODO: pass current user ID
        );
        state = state.copyWith(scheduleWeek: week);
      }

      await _service.assignShift(
        scheduleWeekId: week.id,
        employeeId: employeeId,
        shiftCodeId: shiftCodeId,
        date: date,
      );

      // Reload assignments
      final assignments = await _service.fetchAssignments(week.id);
      final violations = _validateConstraints(
        state.employees,
        assignments,
        state.shiftCodes,
        state.selectedWeekStart,
      );
      state = state.copyWith(assignments: assignments, violations: violations);
    } catch (e) {
      state = state.copyWith(error: 'Σφάλμα ανάθεσης: ${e.toString()}');
    }
  }

  /// Publish the schedule
  Future<void> publishSchedule() async {
    if (state.scheduleWeek == null) return;
    try {
      await _service.publishScheduleWeek(state.scheduleWeek!.id);
      await loadWeek();
    } catch (e) {
      state = state.copyWith(error: 'Σφάλμα δημοσίευσης: ${e.toString()}');
    }
  }

  /// Copy assignments from previous week
  Future<void> copyFromPreviousWeek() async {
    try {
      final previousWeekStart = state.selectedWeekStart.subtract(const Duration(days: 7));
      final previousWeek = await _service.fetchScheduleWeek(previousWeekStart);
      if (previousWeek == null) {
        state = state.copyWith(error: 'Δεν βρέθηκε πρόγραμμα προηγούμενης εβδομάδας');
        return;
      }

      // Ensure current week exists
      var currentWeek = state.scheduleWeek;
      currentWeek ??= await _service.createScheduleWeek(state.selectedWeekStart, '');

      await _service.copyWeekAssignments(
        sourceWeekId: previousWeek.id,
        targetWeekId: currentWeek.id,
        sourceWeekStart: previousWeekStart,
        targetWeekStart: state.selectedWeekStart,
      );

      await loadWeek();
    } catch (e) {
      state = state.copyWith(error: 'Σφάλμα αντιγραφής: ${e.toString()}');
    }
  }

  /// Subscribe to real-time changes on shift_assignments
  void _subscribeToChanges() async {
    _realtimeUnsub?.call();
    try {
      _realtimeUnsub = await _pb.collection('shift_assignments').subscribe('*', (e) {
        // Reload when any assignment changes
        loadWeek();
      });
    } catch (_) {
      // Real-time not available (offline) — fine, will sync when back
    }
  }

  /// Constraint validation engine
  List<ConstraintViolation> _validateConstraints(
    List<Employee> employees,
    List<ShiftAssignment> assignments,
    List<ShiftCode> shiftCodes,
    DateTime weekStart,
  ) {
    final violations = <ConstraintViolation>[];

    ShiftCode? getCode(String id) {
      return shiftCodes.cast<ShiftCode?>().firstWhere(
        (s) => s!.id == id,
        orElse: () => null,
      );
    }

    for (final employee in employees) {
      final empAssignments =
          assignments.where((a) => a.employeeId == employee.id).toList();
      final empCodes = empAssignments
          .map((a) => getCode(a.shiftCodeId))
          .where((c) => c != null)
          .cast<ShiftCode>()
          .toList();

      // Rule 1: Max hours per week (48h default)
      final totalHours = empCodes.fold(0.0, (sum, c) => sum + c.paidHours);
      if (totalHours > 48) {
        violations.add(ConstraintViolation(
          employeeId: employee.id,
          date: weekStart,
          ruleType: ConstraintType.maxHoursPerWeek,
          message: '${employee.displayName}: ${totalHours}h > 48h (υπερωρία)',
          severity: totalHours > 56 ? 'error' : 'warning',
        ));
      }

      // Rule 2: Minimum 1 rest day per week
      final restDays = empCodes.where((c) => c.isRestDay).length;
      if (restDays < 1 && empAssignments.length >= 7) {
        violations.add(ConstraintViolation(
          employeeId: employee.id,
          date: weekStart,
          ruleType: ConstraintType.minDaysOffPerWeek,
          message: '${employee.displayName}: Κανένα ρεπό αυτή την εβδομάδα!',
          severity: 'error',
        ));
      }

      // Rule 3: Max 6 consecutive working days
      final workDates = empAssignments
          .where((a) {
            final code = getCode(a.shiftCodeId);
            return code != null && !code.isRestDay;
          })
          .map((a) => a.date)
          .toList()
        ..sort();

      int consecutive = 1;
      for (int i = 1; i < workDates.length; i++) {
        final diff = workDates[i].difference(workDates[i - 1]).inDays;
        if (diff == 1) {
          consecutive++;
          if (consecutive > 6) {
            violations.add(ConstraintViolation(
              employeeId: employee.id,
              date: workDates[i],
              ruleType: ConstraintType.maxConsecutiveDays,
              message:
                  '${employee.displayName}: $consecutive συνεχόμενες ημέρες εργασίας',
              severity: 'warning',
            ));
          }
        } else {
          consecutive = 1;
        }
      }

      // Rule 4: Min 11h rest between shifts (check consecutive days)
      for (int i = 1; i < empAssignments.length; i++) {
        final prevAssignment = empAssignments[i - 1];
        final currAssignment = empAssignments[i];
        final prevCode = getCode(prevAssignment.shiftCodeId);
        final currCode = getCode(currAssignment.shiftCodeId);

        if (prevCode == null ||
            currCode == null ||
            prevCode.isRestDay ||
            currCode.isRestDay) continue;
        if (prevCode.endTime == null || currCode.startTime == null) continue;

        final prevEnd = _parseTime(prevCode.endTime!);
        final currStart = _parseTime(currCode.startTime!);

        // If next day, add 24h to calculate gap
        double gap;
        if (currAssignment.date.difference(prevAssignment.date).inDays == 1) {
          gap = (24 - prevEnd) + currStart;
        } else {
          continue; // Not consecutive days
        }

        if (gap < 11) {
          violations.add(ConstraintViolation(
            employeeId: employee.id,
            date: currAssignment.date,
            ruleType: ConstraintType.minRestBetweenShifts,
            message:
                '${employee.displayName}: Μόνο ${gap.toStringAsFixed(1)}h ξεκούραση (ελάχ. 11h)',
            severity: 'error',
          ));
        }
      }
    }

    return violations;
  }

  /// Parse time string "HH:MM" to decimal hours
  double _parseTime(String time) {
    final parts = time.split(':');
    return int.parse(parts[0]) + int.parse(parts[1]) / 60.0;
  }

  @override
  void dispose() {
    _realtimeUnsub?.call();
    super.dispose();
  }
}

/// Riverpod provider
final scheduleProvider =
    StateNotifierProvider<ScheduleNotifier, ScheduleState>((ref) {
  final service = ref.read(scheduleServiceProvider);
  final pb = ref.read(pbProvider);
  return ScheduleNotifier(service, pb);
});
