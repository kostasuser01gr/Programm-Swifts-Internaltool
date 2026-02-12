import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';

/// Service for communicating with the self-hosted Ollama LLM server.
/// Completely free — no API keys, no rate limits, no costs.
///
/// Setup:
///   1. Install Ollama: curl -fsSL https://ollama.com/install.sh | sh
///   2. Pull a model: ollama pull llama3.1:8b
///   3. Start server: ollama serve  (default port 11434)
class OllamaService {
  final String baseUrl;
  final String model;

  OllamaService({
    String? baseUrl,
    String? model,
  })  : baseUrl = baseUrl ??
            const String.fromEnvironment(
              'OLLAMA_URL',
              defaultValue: AppConstants.defaultOllamaUrl,
            ),
        model = model ?? AppConstants.defaultModel;

  /// Check if the Ollama server is reachable
  Future<bool> isAvailable() async {
    try {
      final resp = await http
          .get(Uri.parse(baseUrl))
          .timeout(const Duration(seconds: 3));
      return resp.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// List available models on the server
  Future<List<String>> listModels() async {
    try {
      final resp = await http.get(Uri.parse('$baseUrl/api/tags'));
      if (resp.statusCode != 200) return [];
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final models = (data['models'] as List<dynamic>?) ?? [];
      return models.map((m) => m['name'] as String).toList();
    } catch (_) {
      return [];
    }
  }

  /// Generate a completion (non-streaming)
  Future<String> generate({
    required String prompt,
    String? systemPrompt,
    double temperature = 0.7,
    int? maxTokens,
  }) async {
    final body = {
      'model': model,
      'prompt': prompt,
      'stream': false,
      'options': {
        'temperature': temperature,
        if (maxTokens != null) 'num_predict': maxTokens,
      },
      if (systemPrompt != null) 'system': systemPrompt,
    };

    final resp = await http.post(
      Uri.parse('$baseUrl/api/generate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (resp.statusCode != 200) {
      throw OllamaException('Generation failed: ${resp.statusCode}');
    }

    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    return data['response'] as String? ?? '';
  }

  /// Chat completion with message history
  Future<String> chat({
    required List<OllamaChatMessage> messages,
    String? systemPrompt,
    double temperature = 0.7,
  }) async {
    final chatMessages = <Map<String, String>>[];

    if (systemPrompt != null) {
      chatMessages.add({'role': 'system', 'content': systemPrompt});
    }

    for (final msg in messages) {
      chatMessages.add({'role': msg.role, 'content': msg.content});
    }

    final body = {
      'model': model,
      'messages': chatMessages,
      'stream': false,
      'options': {'temperature': temperature},
    };

    final resp = await http.post(
      Uri.parse('$baseUrl/api/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (resp.statusCode != 200) {
      throw OllamaException('Chat failed: ${resp.statusCode}');
    }

    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    final message = data['message'] as Map<String, dynamic>?;
    return message?['content'] as String? ?? '';
  }

  /// Generate schedule suggestion based on context
  Future<String> suggestSchedule({
    required String scheduleContext,
    required String constraints,
    required String request,
  }) async {
    const systemPrompt = '''
Είσαι ο AI Copilot του ShiftForge, ένα σύστημα διαχείρισης βαρδιών.
Απαντάς πάντα στα Ελληνικά.
Παράγεις βέλτιστα προγράμματα βαρδιών τηρώντας τους κανόνες εργασίας.

Κανόνες that MUST be respected:
1. Max 48 ώρες / εβδομάδα ανά υπάλληλο
2. Min 1 ρεπό / εβδομάδα
3. Max 6 συνεχόμενες ημέρες εργασίας
4. Min 11 ώρες ανάπαυση μεταξύ βαρδιών
5. Δίκαιη κατανομή ωρών και τύπων βαρδιών
6. Κάλυψη ελάχιστων αναγκών ανά time slot

Μορφοποίησε τις απαντήσεις σου καθαρά, με bullet points και πίνακες όπου χρειάζεται.
''';

    final prompt = '''
ΤΡΕΧΟΝ ΠΡΟΓΡΑΜΜΑ:
$scheduleContext

ΚΑΝΟΝΕΣ & ΠΕΡΙΟΡΙΣΜΟΙ:
$constraints

ΑΙΤΗΜΑ ΧΡΗΣΤΗ:
$request
''';

    return chat(
      messages: [OllamaChatMessage(role: 'user', content: prompt)],
      systemPrompt: systemPrompt,
    );
  }

  /// Analyze schedule fairness
  Future<String> analyzeFairness({
    required String hoursBreakdown,
    required String shiftDistribution,
  }) async {
    const systemPrompt = '''
Είσαι αναλυτής δικαιοσύνης βαρδιών. Αξιολογείς αν οι βάρδιες
κατανέμονται δίκαια μεταξύ υπαλλήλων. Ελέγχεις:
- Ισοκατανομή ωρών
- Ισοκατανομή νυχτερινών / Σ/Κ βαρδιών
- Ισοκατανομή ρεπό
Δώσε βαθμολογία 1-10 και συγκεκριμένες συστάσεις.
Απάντησε στα Ελληνικά.
''';

    return chat(
      messages: [
        OllamaChatMessage(
          role: 'user',
          content: 'ΩΡΕΣ:\n$hoursBreakdown\n\nΚΑΤΑΝΟΜΗ:\n$shiftDistribution',
        ),
      ],
      systemPrompt: systemPrompt,
    );
  }
}

/// Simple chat message for Ollama
class OllamaChatMessage {
  final String role; // 'system', 'user', 'assistant'
  final String content;

  OllamaChatMessage({required this.role, required this.content});
}

class OllamaException implements Exception {
  final String message;
  OllamaException(this.message);

  @override
  String toString() => 'OllamaException: $message';
}
