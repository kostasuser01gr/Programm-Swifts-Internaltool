import 'package:pocketbase/pocketbase.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import 'pocketbase_client.dart';

/// Service for all schedule-related CRUD operations against PocketBase.
class ScheduleService {
  final PocketBase pb;

  ScheduleService(this.pb);

  // ===========================================================
  // SHIFT CODES
  // ===========================================================

  Future<List<ShiftCode>> fetchShiftCodes() async {
    final records = await pb.collection('shift_codes').getFullList(
      sort: 'sortOrder',
      filter: 'isActive = true',
    );
    return records.map((r) => ShiftCode.fromJson({...r.toJson(), 'id': r.id})).toList();
  }

  Future<ShiftCode> createShiftCode(ShiftCode code) async {
    final record = await pb.collection('shift_codes').create(body: code.toJson());
    return ShiftCode.fromJson({...record.toJson(), 'id': record.id});
  }

  Future<void> updateShiftCode(String id, Map<String, dynamic> data) async {
    await pb.collection('shift_codes').update(id, body: data);
  }

  Future<void> deleteShiftCode(String id) async {
    await pb.collection('shift_codes').update(id, body: {'isActive': false});
  }

  // ===========================================================
  // EMPLOYEES
  // ===========================================================

  Future<List<Employee>> fetchEmployees({bool activeOnly = true}) async {
    final filter = activeOnly ? 'isActive = true' : '';
    final records = await pb.collection('employees').getFullList(
      sort: 'displayName',
      filter: filter,
    );
    return records.map((r) => Employee.fromJson({...r.toJson(), 'id': r.id})).toList();
  }

  Future<Employee> fetchEmployee(String id) async {
    final record = await pb.collection('employees').getOne(id);
    return Employee.fromJson({...record.toJson(), 'id': record.id});
  }

  Future<Employee> createEmployee(Employee employee) async {
    final body = employee.toJson();
    body['password'] = 'changeme123'; // Default password
    body['passwordConfirm'] = 'changeme123';
    body['emailVisibility'] = true;
    final record = await pb.collection('employees').create(body: body);
    return Employee.fromJson({...record.toJson(), 'id': record.id});
  }

  Future<void> updateEmployee(String id, Map<String, dynamic> data) async {
    await pb.collection('employees').update(id, body: data);
  }

  Future<void> archiveEmployee(String id) async {
    await pb.collection('employees').update(id, body: {'isActive': false});
  }

  // ===========================================================
  // TEAMS
  // ===========================================================

  Future<List<Team>> fetchTeams() async {
    final records = await pb.collection('teams').getFullList(sort: 'sortOrder');
    return records.map((r) => Team.fromJson({...r.toJson(), 'id': r.id})).toList();
  }

  // ===========================================================
  // SCHEDULE WEEKS
  // ===========================================================

  Future<ScheduleWeek?> fetchScheduleWeek(DateTime weekStart) async {
    final dateStr = _dateToString(weekStart);
    try {
      final records = await pb.collection('schedule_weeks').getFullList(
        filter: 'weekStartDate = "$dateStr"',
      );
      if (records.isEmpty) return null;
      return ScheduleWeek.fromJson({...records.first.toJson(), 'id': records.first.id});
    } catch (_) {
      return null;
    }
  }

  Future<ScheduleWeek> createScheduleWeek(DateTime weekStart, String createdBy) async {
    final record = await pb.collection('schedule_weeks').create(body: {
      'weekStartDate': _dateToString(weekStart),
      'status': 'draft',
      'createdBy': createdBy,
    });
    return ScheduleWeek.fromJson({...record.toJson(), 'id': record.id});
  }

  Future<void> publishScheduleWeek(String id) async {
    await pb.collection('schedule_weeks').update(id, body: {
      'status': 'published',
      'publishedAt': DateTime.now().toIso8601String(),
    });
  }

  // ===========================================================
  // SHIFT ASSIGNMENTS
  // ===========================================================

  Future<List<ShiftAssignment>> fetchAssignments(String scheduleWeekId) async {
    final records = await pb.collection('shift_assignments').getFullList(
      filter: 'scheduleWeekId = "$scheduleWeekId"',
      sort: 'date,employeeId',
    );
    return records
        .map((r) => ShiftAssignment.fromJson({...r.toJson(), 'id': r.id}))
        .toList();
  }

  Future<ShiftAssignment> createAssignment(ShiftAssignment assignment) async {
    final record = await pb.collection('shift_assignments').create(
      body: assignment.toJson(),
    );
    return ShiftAssignment.fromJson({...record.toJson(), 'id': record.id});
  }

  Future<void> updateAssignment(String id, Map<String, dynamic> data) async {
    await pb.collection('shift_assignments').update(id, body: data);
  }

  Future<void> deleteAssignment(String id) async {
    await pb.collection('shift_assignments').delete(id);
  }

  /// Upsert: create or update assignment for employee on date
  Future<void> assignShift({
    required String scheduleWeekId,
    required String employeeId,
    required String shiftCodeId,
    required DateTime date,
  }) async {
    final dateStr = _dateToString(date);
    final dayOfWeek = date.weekday; // 1=Mon, 7=Sun

    // Check if assignment already exists
    final existing = await pb.collection('shift_assignments').getFullList(
      filter: 'scheduleWeekId = "$scheduleWeekId" && employeeId = "$employeeId" && date = "$dateStr"',
    );

    if (existing.isNotEmpty) {
      await pb.collection('shift_assignments').update(existing.first.id, body: {
        'shiftCodeId': shiftCodeId,
      });
    } else {
      await pb.collection('shift_assignments').create(body: {
        'scheduleWeekId': scheduleWeekId,
        'employeeId': employeeId,
        'shiftCodeId': shiftCodeId,
        'date': dateStr,
        'dayOfWeek': dayOfWeek,
        'isOverride': false,
      });
    }
  }

  /// Bulk copy assignments from one week to another
  Future<void> copyWeekAssignments({
    required String sourceWeekId,
    required String targetWeekId,
    required DateTime sourceWeekStart,
    required DateTime targetWeekStart,
  }) async {
    final sourceAssignments = await fetchAssignments(sourceWeekId);

    for (final assignment in sourceAssignments) {
      final dayOffset = assignment.date.difference(sourceWeekStart).inDays;
      final newDate = targetWeekStart.add(Duration(days: dayOffset));

      await pb.collection('shift_assignments').create(body: {
        'scheduleWeekId': targetWeekId,
        'employeeId': assignment.employeeId,
        'shiftCodeId': assignment.shiftCodeId,
        'date': _dateToString(newDate),
        'dayOfWeek': newDate.weekday,
        'isOverride': false,
      });
    }
  }

  // ===========================================================
  // LEAVE REQUESTS
  // ===========================================================

  Future<List<LeaveRequest>> fetchLeaveRequests({String? employeeId, String? status}) async {
    final filters = <String>[];
    if (employeeId != null) filters.add('employeeId = "$employeeId"');
    if (status != null) filters.add('status = "$status"');

    final records = await pb.collection('leave_requests').getFullList(
      filter: filters.join(' && '),
      sort: '-created',
    );
    return records.map((r) => LeaveRequest.fromJson({...r.toJson(), 'id': r.id})).toList();
  }

  Future<void> createLeaveRequest({
    required String employeeId,
    required DateTime date,
    required String reason,
  }) async {
    await pb.collection('leave_requests').create(body: {
      'employeeId': employeeId,
      'requestedDate': _dateToString(date),
      'reason': reason,
      'status': 'pending',
    });
  }

  Future<void> reviewLeaveRequest(String id, bool approved, String reviewerId, String? note) async {
    await pb.collection('leave_requests').update(id, body: {
      'status': approved ? 'approved' : 'denied',
      'reviewedBy': reviewerId,
      'reviewNote': note ?? '',
    });
  }

  // ===========================================================
  // SWAP REQUESTS
  // ===========================================================

  Future<List<SwapRequest>> fetchSwapRequests({String? status}) async {
    final filter = status != null ? 'status = "$status"' : '';
    final records = await pb.collection('swap_requests').getFullList(
      filter: filter,
      sort: '-created',
    );
    return records.map((r) => SwapRequest.fromJson({...r.toJson(), 'id': r.id})).toList();
  }

  Future<void> createSwapRequest({
    required String requesterId,
    required String targetEmployeeId,
    required String requesterAssignmentId,
    required String targetAssignmentId,
    String? reason,
  }) async {
    await pb.collection('swap_requests').create(body: {
      'requesterId': requesterId,
      'targetEmployeeId': targetEmployeeId,
      'requesterAssignmentId': requesterAssignmentId,
      'targetAssignmentId': targetAssignmentId,
      'reason': reason ?? '',
      'status': 'pending',
      'requesterConfirmed': true,
      'targetConfirmed': false,
    });
  }

  Future<void> confirmSwap(String id, String targetId) async {
    await pb.collection('swap_requests').update(id, body: {
      'targetConfirmed': true,
    });
  }

  Future<void> reviewSwapRequest(String id, bool approved, String reviewerId) async {
    await pb.collection('swap_requests').update(id, body: {
      'status': approved ? 'approved' : 'denied',
      'reviewedBy': reviewerId,
    });
  }

  // ===========================================================
  // AUDIT LOG
  // ===========================================================

  Future<void> logAction({
    required String actorId,
    required String actorName,
    required String action,
    required String entityType,
    required String entityId,
    Map<String, dynamic>? before,
    Map<String, dynamic>? after,
    String? description,
  }) async {
    await pb.collection('audit_log').create(body: {
      'actorId': actorId,
      'actorName': actorName,
      'action': action,
      'entityType': entityType,
      'entityId': entityId,
      'beforeJson': before,
      'afterJson': after,
      'description': description ?? '',
    });
  }

  Future<List<AuditLogEntry>> fetchAuditLog({int limit = 100}) async {
    final records = await pb.collection('audit_log').getList(
      page: 1,
      perPage: limit,
      sort: '-created',
    );
    return records.items
        .map((r) => AuditLogEntry.fromJson({...r.toJson(), 'id': r.id}))
        .toList();
  }

  // ===========================================================
  // NOTIFICATIONS
  // ===========================================================

  Future<List<AppNotification>> fetchNotifications(String recipientId) async {
    final records = await pb.collection('notifications').getFullList(
      filter: 'recipientId = "$recipientId"',
      sort: '-created',
    );
    return records
        .map((r) => AppNotification.fromJson({...r.toJson(), 'id': r.id}))
        .toList();
  }

  Future<void> markNotificationRead(String id) async {
    await pb.collection('notifications').update(id, body: {'isRead': true});
  }

  Future<void> sendNotification({
    required String recipientId,
    required String type,
    required String title,
    required String body,
    String? referenceId,
  }) async {
    await pb.collection('notifications').create(body: {
      'recipientId': recipientId,
      'type': type,
      'title': title,
      'body': body,
      'referenceId': referenceId ?? '',
      'isRead': false,
    });
  }

  // ===========================================================
  // CONSTRAINT RULES
  // ===========================================================

  Future<List<ConstraintRule>> fetchConstraintRules() async {
    final records = await pb.collection('constraint_rules').getFullList();
    return records
        .map((r) => ConstraintRule.fromJson({...r.toJson(), 'id': r.id}))
        .toList();
  }

  // ===========================================================
  // UTILS
  // ===========================================================

  String _dateToString(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

// Riverpod provider
final scheduleServiceProvider = Provider<ScheduleService>((ref) {
  final pb = ref.read(pbProvider);
  return ScheduleService(pb);
});
