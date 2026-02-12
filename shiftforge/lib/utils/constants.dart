/// ShiftForge app-wide constants
class AppConstants {
  AppConstants._();

  // ── Day names (Greek) ─────────────────────────────────
  static const List<String> dayNamesShort = [
    'ΔΕΥ', 'ΤΡΙ', 'ΤΕΤ', 'ΠΕΜ', 'ΠΑΡ', 'ΣΑΒ', 'ΚΥΡ'
  ];
  static const List<String> dayNamesFull = [
    'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη',
    'Παρασκευή', 'Σάββατο', 'Κυριακή'
  ];

  // ── Month names (Greek) ───────────────────────────────
  static const List<String> monthNames = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος',
    'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος',
    'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ];

  // ── Constraint Defaults ───────────────────────────────
  static const double maxHoursPerWeek = 48.0;
  static const int minDaysOffPerWeek = 1;
  static const int maxConsecutiveDays = 6;
  static const double minRestBetweenShiftsHours = 11.0;

  // ── PocketBase ────────────────────────────────────────
  static const String defaultPBUrl = 'http://127.0.0.1:8090';

  // ── Ollama ────────────────────────────────────────────
  static const String defaultOllamaUrl = 'http://127.0.0.1:11434';
  static const String defaultModel = 'llama3.1:8b';

  // ── Misc ──────────────────────────────────────────────
  static const int paginationLimit = 50;
  static const int chatMessageLimit = 100;
  static const Duration autoSaveDebounce = Duration(seconds: 2);
}

/// Helpers for date formatting
class DateHelpers {
  DateHelpers._();

  /// Get Monday of the given date's week
  static DateTime weekStart(DateTime date) {
    final weekday = date.weekday; // 1=Mon, 7=Sun
    return DateTime(date.year, date.month, date.day - (weekday - 1));
  }

  /// Format as DD/MM/YYYY
  static String formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  /// Format as "16 Φεβ 2026"
  static String formatDateGreek(DateTime date) {
    const months = [
      'Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν',
      'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  /// Format week range: "16–22 Φεβ 2026"
  static String formatWeekRange(DateTime monday) {
    final sunday = monday.add(const Duration(days: 6));
    final sameMonth = monday.month == sunday.month;
    if (sameMonth) {
      return '${monday.day}–${sunday.day} '
          '${AppConstants.monthNames[monday.month - 1].substring(0, 3)} '
          '${monday.year}';
    }
    return '${formatDateGreek(monday)} – ${formatDateGreek(sunday)}';
  }
}
