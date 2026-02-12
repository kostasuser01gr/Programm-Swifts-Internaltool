import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppShell extends ConsumerWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isWide = MediaQuery.of(context).size.width > 800;

    if (isWide) {
      return _DesktopShell(child: child);
    } else {
      return _MobileShell(child: child);
    }
  }
}

class _DesktopShell extends StatelessWidget {
  final Widget child;
  const _DesktopShell({required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          _SideNav(),
          const VerticalDivider(width: 1),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _MobileShell extends StatelessWidget {
  final Widget child;
  const _MobileShell({required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: _BottomNav(),
    );
  }
}

class _SideNav extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final currentPath = ModalRoute.of(context)?.settings.name ?? '/schedule';

    return NavigationRail(
      extended: MediaQuery.of(context).size.width > 1100,
      selectedIndex: _pathToIndex(currentPath),
      onDestinationSelected: (index) {
        Navigator.of(context).pushReplacementNamed(_indexToPath(index));
      },
      leading: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          children: [
            Icon(Icons.calendar_month, size: 32, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 4),
            const Text('ShiftForge', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
      ),
      destinations: const [
        NavigationRailDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: Text('Αρχική')),
        NavigationRailDestination(icon: Icon(Icons.calendar_today_outlined), selectedIcon: Icon(Icons.calendar_today), label: Text('Πρόγραμμα')),
        NavigationRailDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: Text('Προσωπικό')),
        NavigationRailDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: Text('Chat')),
        NavigationRailDestination(icon: Icon(Icons.auto_awesome_outlined), selectedIcon: Icon(Icons.auto_awesome), label: Text('AI')),
        NavigationRailDestination(icon: Icon(Icons.swap_horiz), selectedIcon: Icon(Icons.swap_horiz), label: Text('Αιτήματα')),
        NavigationRailDestination(icon: Icon(Icons.analytics_outlined), selectedIcon: Icon(Icons.analytics), label: Text('Αναλυτικά')),
        NavigationRailDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: Text('Ρυθμίσεις')),
      ],
    );
  }

  int _pathToIndex(String path) {
    const map = {'/dashboard': 0, '/schedule': 1, '/staff': 2, '/chat': 3, '/copilot': 4, '/requests': 5, '/analytics': 6, '/settings': 7};
    return map[path] ?? 1;
  }

  String _indexToPath(int index) {
    const paths = ['/dashboard', '/schedule', '/staff', '/chat', '/copilot', '/requests', '/analytics', '/settings'];
    return paths[index];
  }
}

class _BottomNav extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: 1,
      onDestinationSelected: (index) {
        const paths = ['/dashboard', '/schedule', '/chat', '/copilot', '/settings'];
        if (index < paths.length) {
          Navigator.of(context).pushReplacementNamed(paths[index]);
        }
      },
      destinations: const [
        NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Αρχική'),
        NavigationDestination(icon: Icon(Icons.calendar_today_outlined), selectedIcon: Icon(Icons.calendar_today), label: 'Πρόγραμμα'),
        NavigationDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: 'Chat'),
        NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), selectedIcon: Icon(Icons.auto_awesome), label: 'AI'),
        NavigationDestination(icon: Icon(Icons.more_horiz), label: 'Άλλα'),
      ],
    );
  }
}
