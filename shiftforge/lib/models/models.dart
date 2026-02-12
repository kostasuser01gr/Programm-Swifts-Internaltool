// ============================================================
// ShiftForge — Complete Data Models
// All entities for scheduling, staff, chat, AI, audit
// ============================================================

import 'package:equatable/equatable.dart';

// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  owner,
  admin,
  manager,
  staff,
  viewer;

  bool get canEditSchedule => [owner, admin, manager].contains(this);
  bool get canApproveRequests => [owner, admin, manager].contains(this);
  bool get canManageStaff => [owner, admin].contains(this);
  bool get canManageShiftCodes => [owner, admin].contains(this);
  bool get canViewAnalytics => [owner, admin, manager].contains(this);
  bool get canViewAuditLog => [owner, admin].contains(this);
  bool get canUseAICopilot => this != viewer;
  bool get canGenerateAISchedule => [owner, admin, manager].contains(this);
  bool get canSendChat => this != viewer;
  bool get canCreateChannels => [owner, admin, manager].contains(this);
  bool get canExport => [owner, admin, manager].contains(this);
  bool get canDeleteOrg => this == owner;

  String get displayName {
    switch (this) {
      case owner:
        return 'Ιδιοκτήτης';
      case admin:
        return 'Διαχειριστής';
      case manager:
        return 'Υπεύθυνος';
      case staff:
        return 'Προσωπικό';
      case viewer:
        return 'Επισκέπτης';
    }
  }
}

enum ScheduleStatus {
  draft,
  published,
  archived;

  String get displayName {
    switch (this) {
      case draft:
        return 'Πρόχειρο';
      case published:
        return 'Δημοσιευμένο';
      case archived:
        return 'Αρχειοθετημένο';
    }
  }
}

enum RequestStatus {
  pending,
  approved,
  denied,
  cancelled;

  String get displayName {
    switch (this) {
      case pending:
        return 'Εκκρεμεί';
      case approved:
        return 'Εγκρίθηκε';
      case denied:
        return 'Απορρίφθηκε';
      case cancelled:
        return 'Ακυρώθηκε';
    }
  }
}

enum ChannelType { announcement, team, department, directMessage }

enum NotificationType {
  schedulePublished,
  shiftChanged,
  swapRequested,
  swapApproved,
  leaveApproved,
  leaveDenied,
  urgentMessage,
  aiSuggestion,
  coverageAlert,
}

enum ConstraintType {
  maxHoursPerWeek,
  minRestBetweenShifts,
  minDaysOffPerWeek,
  maxConsecutiveDays,
  minCoveragePerShiftCode,
  fairnessBalance,
  skillRequirement,
  noBackToBackNights,
}

// ============================================================
// CORE MODELS
// ============================================================

class Employee extends Equatable {
  final String id;
  final String internalCode; // "STF-001"
  final String firstName;
  final String lastName;
  final String displayName; // "ΤΖΑΝΙΔΑΚΗ"
  final String? email;
  final String? phone;
  final UserRole role;
  final String teamId;
  final List<String> skills; // ["returns", "deliveries", "cashier"]
  final double contractHoursPerWeek; // e.g., 40.0
  final List<DayAvailability> defaultAvailability;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Employee({
    required this.id,
    required this.internalCode,
    required this.firstName,
    required this.lastName,
    required this.displayName,
    this.email,
    this.phone,
    required this.role,
    required this.teamId,
    this.skills = const [],
    this.contractHoursPerWeek = 40.0,
    this.defaultAvailability = const [],
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [id, internalCode, displayName, role, teamId];

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] as String,
      internalCode: json['internalCode'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      displayName: json['displayName'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      role: UserRole.values.firstWhere(
        (r) => r.name == json['role'],
        orElse: () => UserRole.staff,
      ),
      teamId: json['teamId'] as String? ?? '',
      skills: (json['skills'] as List<dynamic>?)
              ?.map((s) => s as String)
              .toList() ??
          [],
      contractHoursPerWeek:
          (json['contractHoursPerWeek'] as num?)?.toDouble() ?? 40.0,
      defaultAvailability: [],
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse(json['created'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'internalCode': internalCode,
        'firstName': firstName,
        'lastName': lastName,
        'displayName': displayName,
        'email': email,
        'phone': phone,
        'role': role.name,
        'teamId': teamId,
        'skills': skills,
        'contractHoursPerWeek': contractHoursPerWeek,
        'isActive': isActive,
      };

  Employee copyWith({
    String? id,
    String? internalCode,
    String? firstName,
    String? lastName,
    String? displayName,
    String? email,
    String? phone,
    UserRole? role,
    String? teamId,
    List<String>? skills,
    double? contractHoursPerWeek,
    bool? isActive,
  }) {
    return Employee(
      id: id ?? this.id,
      internalCode: internalCode ?? this.internalCode,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      teamId: teamId ?? this.teamId,
      skills: skills ?? this.skills,
      contractHoursPerWeek:
          contractHoursPerWeek ?? this.contractHoursPerWeek,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

class DayAvailability {
  final int dayOfWeek; // 1=Mon, 7=Sun
  final bool isAvailable;
  final bool preferredOff;
  final String? notes;

  const DayAvailability({
    required this.dayOfWeek,
    this.isAvailable = true,
    this.preferredOff = false,
    this.notes,
  });
}

// ============================================================
// SHIFT CODE (with real data from image)
// ============================================================

class ShiftCode extends Equatable {
  final String id;
  final String code; // "301", "206", "R"
  final String label; // "Πρωινή 08:00-16:00"
  final String colorHex; // "#4CAF50"
  final String? startTime; // "08:00" (null for rest)
  final String? endTime; // "16:00"
  final double paidHours; // 8.0 or 0.0
  final bool isRestDay;
  final bool isNightShift;
  final List<String> tags; // ["returns", "deliveries"]
  final int sortOrder;
  final bool isActive;

  const ShiftCode({
    required this.id,
    required this.code,
    required this.label,
    required this.colorHex,
    this.startTime,
    this.endTime,
    this.paidHours = 8.0,
    this.isRestDay = false,
    this.isNightShift = false,
    this.tags = const [],
    this.sortOrder = 0,
    this.isActive = true,
  });

  @override
  List<Object?> get props => [id, code];

  /// Returns the duration string like "07:00–15:00"
  String get timeRange {
    if (isRestDay) return 'ΡΕΠΟ';
    if (startTime == null || endTime == null) return '—';
    return '$startTime – $endTime';
  }

  factory ShiftCode.fromJson(Map<String, dynamic> json) {
    return ShiftCode(
      id: json['id'] as String,
      code: json['code'] as String,
      label: json['label'] as String? ?? '',
      colorHex: json['colorHex'] as String? ?? '#9E9E9E',
      startTime: json['startTime'] as String?,
      endTime: json['endTime'] as String?,
      paidHours: (json['paidHours'] as num?)?.toDouble() ?? 8.0,
      isRestDay: json['isRestDay'] as bool? ?? false,
      isNightShift: json['isNightShift'] as bool? ?? false,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((t) => t as String)
              .toList() ??
          [],
      sortOrder: json['sortOrder'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'code': code,
        'label': label,
        'colorHex': colorHex,
        'startTime': startTime,
        'endTime': endTime,
        'paidHours': paidHours,
        'isRestDay': isRestDay,
        'isNightShift': isNightShift,
        'tags': tags,
        'sortOrder': sortOrder,
        'isActive': isActive,
      };
}

// ============================================================
// TEAM
// ============================================================

class Team extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String colorHex;
  final int sortOrder;

  const Team({
    required this.id,
    required this.name,
    this.description,
    this.colorHex = '#2196F3',
    this.sortOrder = 0,
  });

  @override
  List<Object?> get props => [id, name];

  factory Team.fromJson(Map<String, dynamic> json) => Team(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        colorHex: json['colorHex'] as String? ?? '#2196F3',
        sortOrder: json['sortOrder'] as int? ?? 0,
      );
}

// ============================================================
// SCHEDULE
// ============================================================

class ScheduleWeek extends Equatable {
  final String id;
  final DateTime weekStartDate; // Monday
  final ScheduleStatus status;
  final String createdBy;
  final DateTime? publishedAt;
  final DateTime createdAt;

  const ScheduleWeek({
    required this.id,
    required this.weekStartDate,
    this.status = ScheduleStatus.draft,
    required this.createdBy,
    this.publishedAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, weekStartDate, status];

  factory ScheduleWeek.fromJson(Map<String, dynamic> json) => ScheduleWeek(
        id: json['id'] as String,
        weekStartDate: DateTime.parse(json['weekStartDate'] as String),
        status: ScheduleStatus.values.firstWhere(
          (s) => s.name == json['status'],
          orElse: () => ScheduleStatus.draft,
        ),
        createdBy: json['createdBy'] as String,
        publishedAt: json['publishedAt'] != null
            ? DateTime.tryParse(json['publishedAt'] as String)
            : null,
        createdAt:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
      );
}

class ShiftAssignment extends Equatable {
  final String id;
  final String scheduleWeekId;
  final String employeeId;
  final String shiftCodeId;
  final DateTime date;
  final int dayOfWeek; // 1=Mon, 7=Sun
  final String? notes;
  final bool isOverride;
  final DateTime createdAt;

  const ShiftAssignment({
    required this.id,
    required this.scheduleWeekId,
    required this.employeeId,
    required this.shiftCodeId,
    required this.date,
    required this.dayOfWeek,
    this.notes,
    this.isOverride = false,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, employeeId, shiftCodeId, date];

  factory ShiftAssignment.fromJson(Map<String, dynamic> json) =>
      ShiftAssignment(
        id: json['id'] as String,
        scheduleWeekId: json['scheduleWeekId'] as String,
        employeeId: json['employeeId'] as String,
        shiftCodeId: json['shiftCodeId'] as String,
        date: DateTime.parse(json['date'] as String),
        dayOfWeek: json['dayOfWeek'] as int? ?? 1,
        notes: json['notes'] as String?,
        isOverride: json['isOverride'] as bool? ?? false,
        createdAt:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
        'scheduleWeekId': scheduleWeekId,
        'employeeId': employeeId,
        'shiftCodeId': shiftCodeId,
        'date': date.toIso8601String().substring(0, 10),
        'dayOfWeek': dayOfWeek,
        'notes': notes,
        'isOverride': isOverride,
      };
}

// ============================================================
// REQUESTS (Leave + Swap)
// ============================================================

class LeaveRequest extends Equatable {
  final String id;
  final String employeeId;
  final DateTime requestedDate;
  final String reason;
  final RequestStatus status;
  final String? reviewedBy;
  final String? reviewNote;
  final DateTime createdAt;

  const LeaveRequest({
    required this.id,
    required this.employeeId,
    required this.requestedDate,
    required this.reason,
    this.status = RequestStatus.pending,
    this.reviewedBy,
    this.reviewNote,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, employeeId, requestedDate, status];

  factory LeaveRequest.fromJson(Map<String, dynamic> json) => LeaveRequest(
        id: json['id'] as String,
        employeeId: json['employeeId'] as String,
        requestedDate: DateTime.parse(json['requestedDate'] as String),
        reason: json['reason'] as String? ?? '',
        status: RequestStatus.values.firstWhere(
          (s) => s.name == json['status'],
          orElse: () => RequestStatus.pending,
        ),
        reviewedBy: json['reviewedBy'] as String?,
        reviewNote: json['reviewNote'] as String?,
        createdAt:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
      );
}

class SwapRequest extends Equatable {
  final String id;
  final String requesterId;
  final String targetEmployeeId;
  final String requesterAssignmentId;
  final String targetAssignmentId;
  final String? reason;
  final RequestStatus status;
  final bool requesterConfirmed;
  final bool targetConfirmed;
  final String? reviewedBy;
  final String? reviewNote;
  final DateTime createdAt;

  const SwapRequest({
    required this.id,
    required this.requesterId,
    required this.targetEmployeeId,
    required this.requesterAssignmentId,
    required this.targetAssignmentId,
    this.reason,
    this.status = RequestStatus.pending,
    this.requesterConfirmed = true,
    this.targetConfirmed = false,
    this.reviewedBy,
    this.reviewNote,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, requesterId, targetEmployeeId, status];

  factory SwapRequest.fromJson(Map<String, dynamic> json) => SwapRequest(
        id: json['id'] as String,
        requesterId: json['requesterId'] as String,
        targetEmployeeId: json['targetEmployeeId'] as String,
        requesterAssignmentId: json['requesterAssignmentId'] as String,
        targetAssignmentId: json['targetAssignmentId'] as String,
        reason: json['reason'] as String?,
        status: RequestStatus.values.firstWhere(
          (s) => s.name == json['status'],
          orElse: () => RequestStatus.pending,
        ),
        requesterConfirmed: json['requesterConfirmed'] as bool? ?? true,
        targetConfirmed: json['targetConfirmed'] as bool? ?? false,
        reviewedBy: json['reviewedBy'] as String?,
        reviewNote: json['reviewNote'] as String?,
        createdAt:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
      );
}

// ============================================================
// CHAT
// ============================================================

class Channel extends Equatable {
  final String id;
  final String name;
  final ChannelType type;
  final List<String> memberIds;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final DateTime createdAt;

  const Channel({
    required this.id,
    required this.name,
    required this.type,
    this.memberIds = const [],
    this.lastMessage,
    this.lastMessageAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, name, type];

  factory Channel.fromJson(Map<String, dynamic> json) => Channel(
        id: json['id'] as String,
        name: json['name'] as String,
        type: ChannelType.values.firstWhere(
          (t) => t.name == json['type'],
          orElse: () => ChannelType.team,
        ),
        memberIds: (json['memberIds'] as List<dynamic>?)
                ?.map((m) => m as String)
                .toList() ??
            [],
        lastMessage: json['lastMessage'] as String?,
        lastMessageAt: json['lastMessageAt'] != null
            ? DateTime.tryParse(json['lastMessageAt'] as String)
            : null,
        createdAt:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
      );
}

class ChatMessage extends Equatable {
  final String id;
  final String channelId;
  final String senderId;
  final String senderName;
  final String text;
  final ShiftReference? shiftReference;
  final List<String>? attachmentUrls;
  final DateTime createdAt;
  final bool isEdited;

  const ChatMessage({
    required this.id,
    required this.channelId,
    required this.senderId,
    required this.senderName,
    required this.text,
    this.shiftReference,
    this.attachmentUrls,
    required this.createdAt,
    this.isEdited = false,
  });

  @override
  List<Object?> get props => [id, channelId, senderId, text];

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        channelId: json['channelId'] as String,
        senderId: json['senderId'] as String,
        senderName: json['senderName'] as String? ?? '',
        text: json['text'] as String,
        createdAt:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
        isEdited: json['isEdited'] as bool? ?? false,
      );
}

class ShiftReference {
  final String? employeeId;
  final DateTime? date;
  final String? shiftCode;

  const ShiftReference({this.employeeId, this.date, this.shiftCode});
}

// ============================================================
// AUDIT LOG
// ============================================================

class AuditLogEntry extends Equatable {
  final String id;
  final String actorId;
  final String actorName;
  final String action; // "shift.assign", "leave.approve"
  final String entityType; // "ShiftAssignment", "Employee"
  final String entityId;
  final String? beforeJson;
  final String? afterJson;
  final String? description;
  final DateTime timestamp;

  const AuditLogEntry({
    required this.id,
    required this.actorId,
    required this.actorName,
    required this.action,
    required this.entityType,
    required this.entityId,
    this.beforeJson,
    this.afterJson,
    this.description,
    required this.timestamp,
  });

  @override
  List<Object?> get props => [id, action, entityType, timestamp];

  factory AuditLogEntry.fromJson(Map<String, dynamic> json) => AuditLogEntry(
        id: json['id'] as String,
        actorId: json['actorId'] as String,
        actorName: json['actorName'] as String? ?? '',
        action: json['action'] as String,
        entityType: json['entityType'] as String,
        entityId: json['entityId'] as String,
        beforeJson: json['beforeJson'] as String?,
        afterJson: json['afterJson'] as String?,
        description: json['description'] as String?,
        timestamp:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
      );
}

// ============================================================
// CONSTRAINT RULES
// ============================================================

class ConstraintRule extends Equatable {
  final String id;
  final String name;
  final ConstraintType type;
  final bool isEnabled;
  final Map<String, double> parameters;
  final String appliesTo; // "all", "team:<id>", "employee:<id>"

  const ConstraintRule({
    required this.id,
    required this.name,
    required this.type,
    this.isEnabled = true,
    this.parameters = const {},
    this.appliesTo = 'all',
  });

  @override
  List<Object?> get props => [id, type, isEnabled];

  factory ConstraintRule.fromJson(Map<String, dynamic> json) => ConstraintRule(
        id: json['id'] as String,
        name: json['name'] as String,
        type: ConstraintType.values.firstWhere(
          (t) => t.name == json['type'],
          orElse: () => ConstraintType.maxHoursPerWeek,
        ),
        isEnabled: json['isEnabled'] as bool? ?? true,
        parameters: (json['parameters'] as Map<String, dynamic>?)
                ?.map((k, v) => MapEntry(k, (v as num).toDouble())) ??
            {},
        appliesTo: json['appliesTo'] as String? ?? 'all',
      );
}

// ============================================================
// SCHEDULE TEMPLATE
// ============================================================

class ScheduleTemplate extends Equatable {
  final String id;
  final String name;
  final String? description;
  final List<TemplateEntry> entries;
  final String createdBy;
  final DateTime createdAt;

  const ScheduleTemplate({
    required this.id,
    required this.name,
    this.description,
    this.entries = const [],
    required this.createdBy,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, name];

  factory ScheduleTemplate.fromJson(Map<String, dynamic> json) =>
      ScheduleTemplate(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        entries: [],
        createdBy: json['createdBy'] as String? ?? '',
        createdAt:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
      );
}

class TemplateEntry {
  final String employeeId;
  final int dayOfWeek;
  final String shiftCodeId;

  const TemplateEntry({
    required this.employeeId,
    required this.dayOfWeek,
    required this.shiftCodeId,
  });
}

// ============================================================
// NOTIFICATION
// ============================================================

class AppNotification extends Equatable {
  final String id;
  final String recipientId;
  final NotificationType type;
  final String title;
  final String body;
  final String? referenceId;
  final bool isRead;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.recipientId,
    required this.type,
    required this.title,
    required this.body,
    this.referenceId,
    this.isRead = false,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, type, isRead];

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        recipientId: json['recipientId'] as String,
        type: NotificationType.values.firstWhere(
          (t) => t.name == json['type'],
          orElse: () => NotificationType.shiftChanged,
        ),
        title: json['title'] as String,
        body: json['body'] as String,
        referenceId: json['referenceId'] as String?,
        isRead: json['isRead'] as bool? ?? false,
        createdAt:
            DateTime.tryParse(json['created'] as String? ?? '') ?? DateTime.now(),
      );
}

// ============================================================
// AI COPILOT TYPES
// ============================================================

class AISuggestion {
  final String id;
  final String description;
  final int confidencePercent;
  final List<ProposedAssignment> proposedAssignments;
  final List<String> satisfiedConstraints;
  final List<String> violatedConstraints;
  final String reasoning;
  final bool isApplied;

  const AISuggestion({
    required this.id,
    required this.description,
    required this.confidencePercent,
    this.proposedAssignments = const [],
    this.satisfiedConstraints = const [],
    this.violatedConstraints = const [],
    this.reasoning = '',
    this.isApplied = false,
  });
}

class ProposedAssignment {
  final String employeeId;
  final DateTime date;
  final String shiftCodeId;
  final String? replacesAssignmentId;

  const ProposedAssignment({
    required this.employeeId,
    required this.date,
    required this.shiftCodeId,
    this.replacesAssignmentId,
  });
}

class CopilotMessage {
  final String id;
  final String text;
  final bool isUser;
  final AISuggestion? suggestion;
  final DateTime timestamp;

  CopilotMessage({
    String? id,
    required this.text,
    required this.isUser,
    this.suggestion,
    DateTime? timestamp,
  })  : id = id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        timestamp = timestamp ?? DateTime.now();
}

// ============================================================
// CONSTRAINT VIOLATION (computed, not stored)
// ============================================================

class ConstraintViolation {
  final String employeeId;
  final DateTime date;
  final ConstraintType ruleType;
  final String message;
  final String severity; // "error", "warning", "info"

  const ConstraintViolation({
    required this.employeeId,
    required this.date,
    required this.ruleType,
    required this.message,
    this.severity = 'error',
  });
}
