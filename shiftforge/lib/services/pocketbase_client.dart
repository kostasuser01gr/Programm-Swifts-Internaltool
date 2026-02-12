import 'package:pocketbase/pocketbase.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// PocketBase client singleton — connects to self-hosted backend.
/// Change the URL to your deployment (local, LAN, or Oracle Cloud VM).
class PocketBaseClient {
  static PocketBaseClient? _instance;
  late final PocketBase pb;

  PocketBaseClient._internal() {
    // DEFAULT: local development. Change to your server URL in production.
    // Examples:
    //   Local:  http://127.0.0.1:8090
    //   LAN:    http://192.168.1.100:8090
    //   Cloud:  https://shiftforge.yourdomain.com
    pb = PocketBase(_resolveUrl());
  }

  factory PocketBaseClient() {
    _instance ??= PocketBaseClient._internal();
    return _instance!;
  }

  static String _resolveUrl() {
    // In production, read from environment or config:
    // const url = String.fromEnvironment('PB_URL', defaultValue: 'http://127.0.0.1:8090');
    return const String.fromEnvironment(
      'PB_URL',
      defaultValue: 'http://127.0.0.1:8090',
    );
  }

  /// Check if user is authenticated
  bool get isAuthenticated => pb.authStore.isValid;

  /// Current auth token
  String? get token => pb.authStore.token;

  /// Current user record
  RecordModel? get currentUser =>
      pb.authStore.model is RecordModel ? pb.authStore.model as RecordModel : null;

  /// Sign in with email + password
  Future<RecordAuth> signIn(String email, String password) async {
    return await pb.collection('employees').authWithPassword(email, password);
  }

  /// Sign out
  void signOut() {
    pb.authStore.clear();
  }

  /// Subscribe to real-time changes on a collection
  Future<UnsubscribeFunc> subscribe(
    String collection,
    String recordId,
    void Function(RecordSubscriptionEvent) callback,
  ) async {
    return await pb.collection(collection).subscribe(recordId, callback);
  }

  /// Subscribe to all changes in a collection
  Future<UnsubscribeFunc> subscribeAll(
    String collection,
    void Function(RecordSubscriptionEvent) callback,
  ) async {
    return await pb.collection(collection).subscribe('*', callback);
  }
}

/// Riverpod provider for PocketBase client
final pocketBaseProvider = Provider<PocketBaseClient>((ref) {
  return PocketBaseClient();
});

final pbProvider = Provider<PocketBase>((ref) {
  return ref.read(pocketBaseProvider).pb;
});
