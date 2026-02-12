import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../services/pocketbase_client.dart';

/// Auth state model
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final Employee? currentUser;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.currentUser,
    this.error,
  });

  UserRole get role => currentUser?.role ?? UserRole.viewer;

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    Employee? currentUser,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      currentUser: currentUser ?? this.currentUser,
      error: error,
    );
  }
}

/// Auth state notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final PocketBaseClient _client;

  AuthNotifier(this._client) : super(const AuthState()) {
    _checkAuthState();
  }

  void _checkAuthState() {
    if (_client.isAuthenticated && _client.currentUser != null) {
      final record = _client.currentUser!;
      final employee = Employee.fromJson({...record.toJson(), 'id': record.id});
      state = AuthState(
        isAuthenticated: true,
        currentUser: employee,
      );
    }
  }

  Future<void> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authResult = await _client.signIn(email, password);
      final record = authResult.record;
      if (record != null) {
        final employee = Employee.fromJson({...record.toJson(), 'id': record.id});
        state = AuthState(
          isAuthenticated: true,
          currentUser: employee,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Αποτυχία σύνδεσης. Ελέγξτε τα στοιχεία σας.',
      );
    }
  }

  void signOut() {
    _client.signOut();
    state = const AuthState();
  }
}

/// Riverpod providers
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final client = ref.read(pocketBaseProvider);
  return AuthNotifier(client);
});

/// Quick access to current user role
final currentRoleProvider = Provider<UserRole>((ref) {
  return ref.watch(authProvider).role;
});

/// Quick access to current user ID
final currentUserIdProvider = Provider<String?>((ref) {
  return ref.watch(authProvider).currentUser?.id;
});
