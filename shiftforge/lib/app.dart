import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/schedule/schedule_screen.dart';
import 'screens/staff/staff_directory_screen.dart';
import 'screens/chat/channel_list_screen.dart';
import 'screens/ai_copilot/copilot_screen.dart';
import 'screens/requests/requests_screen.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/admin/audit_log_screen.dart';
import 'screens/admin/shift_codes_screen.dart';
import 'screens/analytics/analytics_screen.dart';
import 'utils/theme.dart';
import 'widgets/app_shell.dart';

class ShiftForgeApp extends ConsumerWidget {
  const ShiftForgeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp.router(
      title: 'ShiftForge',
      debugShowCheckedModeBanner: false,
      theme: ShiftForgeTheme.light,
      darkTheme: ShiftForgeTheme.dark,
      themeMode: ThemeMode.system,
      locale: const Locale('el', 'GR'),
      supportedLocales: const [
        Locale('el', 'GR'),
        Locale('en', 'US'),
      ],
      routerConfig: _buildRouter(authState),
    );
  }

  GoRouter _buildRouter(AuthState authState) {
    return GoRouter(
      initialLocation: '/schedule',
      redirect: (context, state) {
        final isLoggedIn = authState.isAuthenticated;
        final isLoginRoute = state.matchedLocation == '/login';

        if (!isLoggedIn && !isLoginRoute) return '/login';
        if (isLoggedIn && isLoginRoute) return '/schedule';
        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(
              path: '/dashboard',
              builder: (context, state) => const DashboardScreen(),
            ),
            GoRoute(
              path: '/schedule',
              builder: (context, state) => const ScheduleScreen(),
            ),
            GoRoute(
              path: '/staff',
              builder: (context, state) => const StaffDirectoryScreen(),
            ),
            GoRoute(
              path: '/chat',
              builder: (context, state) => const ChannelListScreen(),
            ),
            GoRoute(
              path: '/copilot',
              builder: (context, state) => const CopilotScreen(),
            ),
            GoRoute(
              path: '/requests',
              builder: (context, state) => const RequestsScreen(),
            ),
            GoRoute(
              path: '/analytics',
              builder: (context, state) => const AnalyticsScreen(),
            ),
            GoRoute(
              path: '/audit',
              builder: (context, state) => const AuditLogScreen(),
            ),
            GoRoute(
              path: '/shift-codes',
              builder: (context, state) => const ShiftCodesScreen(),
            ),
            GoRoute(
              path: '/settings',
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    );
  }
}
