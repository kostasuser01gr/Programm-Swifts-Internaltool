import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/schedule_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';

class StaffDirectoryScreen extends ConsumerStatefulWidget {
  const StaffDirectoryScreen({super.key});

  @override
  ConsumerState<StaffDirectoryScreen> createState() =>
      _StaffDirectoryScreenState();
}

class _StaffDirectoryScreenState extends ConsumerState<StaffDirectoryScreen> {
  String _searchQuery = '';
  String? _selectedTeamId;

  @override
  Widget build(BuildContext context) {
    final schedState = ref.watch(scheduleProvider);
    final authState = ref.watch(authProvider);
    final canManage = authState.role.canManageStaff;

    var employees = schedState.employees;

    // Filter by search
    if (_searchQuery.isNotEmpty) {
      employees = employees
          .where((e) =>
              e.displayName
                  .toLowerCase()
                  .contains(_searchQuery.toLowerCase()) ||
              e.firstName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              e.lastName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              e.internalCode
                  .toLowerCase()
                  .contains(_searchQuery.toLowerCase()))
          .toList();
    }

    // Filter by team
    if (_selectedTeamId != null) {
      employees =
          employees.where((e) => e.teamId == _selectedTeamId).toList();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Προσωπικό'),
        actions: [
          if (canManage)
            IconButton(
              icon: const Icon(Icons.person_add),
              tooltip: 'Νέο Μέλος',
              onPressed: () => _showEmployeeForm(context),
            ),
        ],
      ),
      body: Column(
        children: [
          // Search + Filter bar
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'Αναζήτηση...',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v),
                  ),
                ),
                const SizedBox(width: 8),
                // Team filter dropdown
                DropdownButton<String?>(
                  value: _selectedTeamId,
                  hint: const Text('Ομάδα'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Όλες')),
                    ...schedState.teams.map((t) => DropdownMenuItem(
                          value: t.id,
                          child: Text(t.name),
                        )),
                  ],
                  onChanged: (v) => setState(() => _selectedTeamId = v),
                ),
              ],
            ),
          ),

          // Stats bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Theme.of(context).colorScheme.surfaceContainerLow,
            child: Row(
              children: [
                Text('${employees.length} μέλη',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                const Spacer(),
                Text(
                  'Ενεργά: ${employees.where((e) => e.isActive).length}',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          // Employee list
          Expanded(
            child: employees.isEmpty
                ? const Center(child: Text('Δεν βρέθηκαν αποτελέσματα'))
                : ListView.builder(
                    itemCount: employees.length,
                    itemBuilder: (_, i) {
                      final emp = employees[i];
                      return _EmployeeTile(
                        employee: emp,
                        team: schedState.teams
                            .cast<Team?>()
                            .firstWhere((t) => t!.id == emp.teamId,
                                orElse: () => null),
                        canManage: canManage,
                        onTap: () => _showEmployeeDetail(context, emp),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _showEmployeeForm(BuildContext context) {
    // Employee create/edit form — planned for v2
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Φόρμα προσωπικού — υπό ανάπτυξη')),
    );
  }

  void _showEmployeeDetail(BuildContext context, Employee emp) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.5,
        builder: (_, ctrl) => ListView(
          controller: ctrl,
          padding: const EdgeInsets.all(24),
          children: [
            Center(
              child: CircleAvatar(
                radius: 36,
                child: Text(
                  emp.displayName.isNotEmpty
                      ? emp.displayName[0]
                      : '?',
                  style: const TextStyle(fontSize: 28),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(emp.displayName,
                  style: Theme.of(context).textTheme.titleLarge),
            ),
            Center(
              child: Text('${emp.firstName} ${emp.lastName}',
                  style: Theme.of(context).textTheme.bodyMedium),
            ),
            const SizedBox(height: 8),
            Center(
              child: Chip(
                label: Text(emp.role.displayName),
                backgroundColor:
                    Theme.of(context).colorScheme.primaryContainer,
              ),
            ),
            const SizedBox(height: 16),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.badge),
              title: const Text('Κωδικός'),
              subtitle: Text(emp.internalCode),
            ),
            if (emp.email != null)
              ListTile(
                leading: const Icon(Icons.email),
                title: const Text('Email'),
                subtitle: Text(emp.email!),
              ),
            if (emp.phone != null)
              ListTile(
                leading: const Icon(Icons.phone),
                title: const Text('Τηλέφωνο'),
                subtitle: Text(emp.phone!),
              ),
            ListTile(
              leading: const Icon(Icons.timer),
              title: const Text('Ώρες / εβδ.'),
              subtitle: Text('${emp.contractHoursPerWeek.toStringAsFixed(0)}h'),
            ),
            if (emp.skills.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: emp.skills
                    .map((s) => Chip(
                          label: Text(s, style: const TextStyle(fontSize: 12)),
                          visualDensity: VisualDensity.compact,
                        ))
                    .toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EmployeeTile extends StatelessWidget {
  final Employee employee;
  final Team? team;
  final bool canManage;
  final VoidCallback onTap;

  const _EmployeeTile({
    required this.employee,
    this.team,
    required this.canManage,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor:
            Theme.of(context).colorScheme.primaryContainer,
        child: Text(
          employee.displayName.isNotEmpty
              ? employee.displayName[0]
              : '?',
          style: TextStyle(
              color: Theme.of(context).colorScheme.onPrimaryContainer),
        ),
      ),
      title: Text(employee.displayName,
          style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Row(
        children: [
          Text(employee.internalCode),
          const SizedBox(width: 8),
          if (team != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: team!.colorHex.toColor().withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(team!.name,
                  style: const TextStyle(fontSize: 11)),
            ),
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Chip(
            label: Text(employee.role.displayName,
                style: const TextStyle(fontSize: 11)),
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
          ),
          if (!employee.isActive) ...[
            const SizedBox(width: 4),
            const Icon(Icons.block, size: 16, color: Colors.red),
          ],
        ],
      ),
      onTap: onTap,
    );
  }
}

// Inline toColor extension (mirror from theme.dart)
extension _ColorHex on String {
  Color toColor() {
    final hex = replaceFirst('#', '');
    return Color(int.parse('FF$hex', radix: 16));
  }
}
