import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../providers/schedule_provider.dart';
import '../../utils/constants.dart';

/// CopilotScreen — AI assistant for schedule suggestions,
/// powered by Ollama (self-hosted, free LLM).
class CopilotScreen extends ConsumerStatefulWidget {
  const CopilotScreen({super.key});

  @override
  ConsumerState<CopilotScreen> createState() => _CopilotScreenState();
}

class _CopilotScreenState extends ConsumerState<CopilotScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  final List<_CopilotMessage> _messages = [];
  bool _isThinking = false;

  // Quick prompt templates
  static const List<_QuickPrompt> _quickPrompts = [
    _QuickPrompt(
      icon: Icons.auto_fix_high,
      label: 'Αυτόματο Πρόγραμμα',
      prompt: 'Δημιούργησε αυτόματο πρόγραμμα βαρδιών για αυτή την εβδομάδα, '
          'τηρώντας τους κανόνες (max 48h, min 1 ρεπό, 11h ανάπαυση).',
    ),
    _QuickPrompt(
      icon: Icons.balance,
      label: 'Έλεγχος Δικαιοσύνης',
      prompt: 'Ανάλυσε αν οι βάρδιες είναι δίκαια κατανεμημένες. '
          'Ποιοι υπάλληλοι έχουν υπερβολικές ώρες ή πολλές νύχτες;',
    ),
    _QuickPrompt(
      icon: Icons.warning_amber,
      label: 'Βρες Προβλήματα',
      prompt: 'Εντόπισε όλες τις παραβάσεις κανόνων στο τρέχον πρόγραμμα '
          'και πρότεινε λύσεις.',
    ),
    _QuickPrompt(
      icon: Icons.swap_horiz,
      label: 'Πρόταση Ανταλλαγών',
      prompt: 'Πρότεινε βέλτιστες ανταλλαγές βαρδιών για να λυθούν '
          'τυχόν συγκρούσεις ή υπερωρίες.',
    ),
    _QuickPrompt(
      icon: Icons.event_busy,
      label: 'Κάλυψη Κενών',
      prompt: 'Ποιες ημέρες/βάρδιες έχουν ανεπαρκή κάλυψη; '
          'Πρότεινε ποιοι μπορούν να καλύψουν τα κενά.',
    ),
  ];

  @override
  void initState() {
    super.initState();
    // Welcome message
    _messages.add(_CopilotMessage(
      isUser: false,
      text: 'Γεια σου! Είμαι ο AI Copilot του ShiftForge. 🤖\n\n'
          'Μπορώ να σε βοηθήσω με:\n'
          '• Αυτόματη δημιουργία προγράμματος\n'
          '• Εντοπισμό παραβάσεων κανόνων\n'
          '• Ανάλυση δικαιοσύνης βαρδιών\n'
          '• Προτάσεις ανταλλαγών\n\n'
          'Χρησιμοποίησε τα γρήγορα prompts ή γράψε τη δική σου ερώτηση!',
      time: _now(),
    ));
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    if (!authState.role.canUseAICopilot) {
      return Scaffold(
        appBar: AppBar(title: const Text('AI Copilot')),
        body: const Center(
          child: Text('Δεν έχετε πρόσβαση στο AI Copilot.'),
        ),
      );
    }

    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.auto_awesome, size: 22),
            SizedBox(width: 8),
            Text('AI Copilot'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Καθαρισμός',
            onPressed: () => setState(() {
              _messages.removeRange(1, _messages.length);
            }),
          ),
        ],
      ),
      body: Column(
        children: [
          // Quick prompts bar
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              itemCount: _quickPrompts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (_, i) {
                final qp = _quickPrompts[i];
                return ActionChip(
                  avatar: Icon(qp.icon, size: 16),
                  label: Text(qp.label, style: const TextStyle(fontSize: 12)),
                  onPressed: _isThinking
                      ? null
                      : () => _sendMessage(qp.prompt),
                );
              },
            ),
          ),
          const Divider(height: 1),

          // Messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(12),
              itemCount: _messages.length + (_isThinking ? 1 : 0),
              itemBuilder: (_, i) {
                if (i == _messages.length && _isThinking) {
                  return _ThinkingBubble();
                }
                final msg = _messages[i];
                return _MessageBubble(message: msg);
              },
            ),
          ),

          // Input
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colors.surface,
              border: Border(top: BorderSide(color: colors.outlineVariant)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    decoration: const InputDecoration(
                      hintText: 'Ρώτησε τον AI Copilot...',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    maxLines: 3,
                    minLines: 1,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _isThinking ? null : _send,
                  icon: const Icon(Icons.send, size: 20),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _send() {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;
    _inputController.clear();
    _sendMessage(text);
  }

  void _sendMessage(String text) {
    setState(() {
      _messages.add(_CopilotMessage(isUser: true, text: text, time: _now()));
      _isThinking = true;
    });
    _scrollToBottom();

    // Simulate AI response (replace with real Ollama call)
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;

      // Build context from schedule state
      final sched = ref.read(scheduleProvider);
      final response = _generateLocalResponse(text, sched);

      setState(() {
        _isThinking = false;
        _messages.add(
            _CopilotMessage(isUser: false, text: response, time: _now()));
      });
      _scrollToBottom();
    });
  }

  String _generateLocalResponse(String query, ScheduleState sched) {
    // Basic local intelligence before Ollama is connected
    final lowerQuery = query.toLowerCase();

    if (lowerQuery.contains('παράβα') || lowerQuery.contains('πρόβλημα')) {
      if (sched.violations.isEmpty) {
        return '✅ Δεν βρέθηκαν παραβάσεις κανόνων στο τρέχον πρόγραμμα!\n\n'
            'Οι κανόνες που ελέγχθηκαν:\n'
            '• Max ${AppConstants.maxHoursPerWeek.toInt()}h / εβδομάδα\n'
            '• Min ${AppConstants.minDaysOffPerWeek} ρεπό / εβδομάδα\n'
            '• Max ${AppConstants.maxConsecutiveDays} συνεχόμενες ημέρες\n'
            '• Min ${AppConstants.minRestBetweenShiftsHours.toInt()}h ανάπαυση';
      }
      return '⚠️ Βρέθηκαν ${sched.violations.length} παραβάσεις:\n\n'
          '${sched.violations.map((v) => '• ${v.message}').join('\n')}\n\n'
          '*Σύνδεσε τον Ollama server για αυτόματες προτάσεις λύσεων.*';
    }

    if (lowerQuery.contains('αυτόματο') || lowerQuery.contains('δημιούργησε')) {
      return '🤖 Η αυτόματη δημιουργία προγράμματος απαιτεί σύνδεση '
          'με τον Ollama AI server.\n\n'
          '**Ρύθμιση:**\n'
          '1. Εγκατέστησε Ollama: `curl -fsSL https://ollama.com/install.sh | sh`\n'
          '2. Κατέβασε μοντέλο: `ollama pull llama3.1:8b`\n'
          '3. Τρέξε: `ollama serve`\n\n'
          'Μετά, ο Copilot θα αναλύει τα δεδομένα σας και θα δημιουργεί '
          'βέλτιστο πρόγραμμα αυτόματα.';
    }

    if (lowerQuery.contains('δικαιοσύνη') || lowerQuery.contains('δίκαι')) {
      final hoursReport = sched.employees.map((e) {
        final hours = sched.totalHoursFor(e.id);
        final rest = sched.restDaysFor(e.id);
        return '${e.displayName}: ${hours.toStringAsFixed(0)}h, ${rest} ρεπό';
      }).join('\n');
      return '📊 **Ανάλυση Δικαιοσύνης Βαρδιών:**\n\n$hoursReport\n\n'
          '*Σύνδεσε Ollama για βαθύτερη ανάλυση και αυτόματη εξισορρόπηση.*';
    }

    return '🤖 Κατάλαβα! Αυτή η λειτουργία απαιτεί σύνδεση με τον '
        'Ollama AI server (δωρεάν, self-hosted).\n\n'
        '**Τρέχουσα κατάσταση:**\n'
        '• Υπάλληλοι: ${sched.employees.length}\n'
        '• Βάρδιες αυτής εβδ.: ${sched.assignments.length}\n'
        '• Παραβάσεις: ${sched.violations.length}\n\n'
        'Γράψε μια πιο συγκεκριμένη ερώτηση ή χρησιμοποίησε τα γρήγορα prompts!';
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _now() {
    final now = TimeOfDay.now();
    return '${now.hour}:${now.minute.toString().padLeft(2, '0')}';
  }
}

// ── Data Classes ────────────────────────────────────────

class _CopilotMessage {
  final bool isUser;
  final String text;
  final String time;
  _CopilotMessage({required this.isUser, required this.text, required this.time});
}

class _QuickPrompt {
  final IconData icon;
  final String label;
  final String prompt;
  const _QuickPrompt(
      {required this.icon, required this.label, required this.prompt});
}

// ── Widgets ─────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final _CopilotMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isUser = message.isUser;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isUser ? colors.primaryContainer : colors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12).copyWith(
            bottomRight: isUser ? Radius.zero : const Radius.circular(12),
            bottomLeft: !isUser ? Radius.zero : const Radius.circular(12),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isUser ? Icons.person : Icons.auto_awesome,
                  size: 14,
                  color: colors.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  isUser ? 'Εσύ' : 'AI Copilot',
                  style: TextStyle(
                    fontSize: 11,
                    color: colors.onSurfaceVariant,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Text(message.time,
                    style:
                        TextStyle(fontSize: 10, color: colors.onSurfaceVariant)),
              ],
            ),
            const SizedBox(height: 4),
            SelectableText(message.text),
          ],
        ),
      ),
    );
  }
}

class _ThinkingBubble extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: colors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12)
              .copyWith(bottomLeft: Radius.zero),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: colors.primary,
              ),
            ),
            const SizedBox(width: 8),
            Text('Σκέφτομαι...',
                style: TextStyle(
                    color: colors.onSurfaceVariant,
                    fontStyle: FontStyle.italic)),
          ],
        ),
      ),
    );
  }
}
