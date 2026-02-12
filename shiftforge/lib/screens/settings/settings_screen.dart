import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Ρυθμίσεις')),
      body: ListView(
        children: [
          // User info card
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    child: Text(
                      authState.currentUser?.displayName.isNotEmpty == true
                          ? authState.currentUser!.displayName[0]
                          : '?',
                      style: const TextStyle(fontSize: 22),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          authState.currentUser?.displayName ?? 'Χρήστης',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        Text(authState.currentUser?.email ?? '',
                            style: Theme.of(context).textTheme.bodySmall),
                        Chip(
                          label: Text(authState.role.displayName,
                              style: const TextStyle(fontSize: 11)),
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // General
          _SectionHeader('Γενικά'),
          _SettingsTile(
            icon: Icons.language,
            title: 'Γλώσσα',
            subtitle: 'Ελληνικά',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.dark_mode,
            title: 'Θέμα',
            subtitle: 'Σύστημα',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.notifications,
            title: 'Ειδοποιήσεις',
            subtitle: 'Ενεργές',
            onTap: () {},
          ),

          // Schedule defaults
          _SectionHeader('Πρόγραμμα'),
          _SettingsTile(
            icon: Icons.timer,
            title: 'Max ώρες / εβδομάδα',
            subtitle: '48',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.hotel,
            title: 'Min ανάπαυση (ώρες)',
            subtitle: '11',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.weekend,
            title: 'Min ρεπό / εβδομάδα',
            subtitle: '1',
            onTap: () {},
          ),

          // Server
          _SectionHeader('Σύνδεση'),
          _SettingsTile(
            icon: Icons.dns,
            title: 'PocketBase Server',
            subtitle: 'http://127.0.0.1:8090',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.smart_toy,
            title: 'Ollama Server',
            subtitle: 'http://127.0.0.1:11434',
            onTap: () {},
          ),

          // Account
          _SectionHeader('Λογαριασμός'),
          _SettingsTile(
            icon: Icons.lock,
            title: 'Αλλαγή Κωδικού',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.info_outline,
            title: 'Σχετικά',
            subtitle: 'ShiftForge v1.0.0',
            onTap: () {},
          ),
          const Divider(),
          ListTile(
            leading: Icon(Icons.logout, color: colors.error),
            title: Text('Αποσύνδεση',
                style: TextStyle(color: colors.error)),
            onTap: () {
              ref.read(authProvider.notifier).signOut();
            },
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 4),
      child: Text(title,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.bold,
              )),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
    );
  }
}
