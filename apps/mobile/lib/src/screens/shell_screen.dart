import "package:flutter/material.dart";
import "package:managekar/src/notifications/local_reminders.dart";
import "package:managekar/src/screens/counts_screen.dart";
import "package:managekar/src/screens/editors.dart";
import "package:managekar/src/screens/focus_screen.dart";
import "package:managekar/src/screens/goals_screen.dart";
import "package:managekar/src/screens/profile_screen.dart";
import "package:managekar/src/screens/settings_screen.dart";
import "package:managekar/src/screens/share_screen.dart";
import "package:managekar/src/screens/time_screen.dart";
import "package:managekar/src/state/session.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/format.dart";
import "package:managekar/src/widgets/forms.dart";

class ShellScreen extends StatefulWidget {
  const ShellScreen({
    super.key,
    required this.session,
    required this.workspace,
    required this.reminders,
  });

  final SessionController session;
  final WorkspaceController workspace;
  final LocalReminders reminders;

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int index = 0;

  @override
  void initState() {
    super.initState();
    widget.workspace.refresh().then((_) => widget.reminders.sync(widget.workspace));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.workspace,
      builder: (context, _) {
        final pages = [
          _HomeTab(workspace: widget.workspace, session: widget.session, reminders: widget.reminders),
          _ListTab(
            title: "Tasks",
            empty: "Add one task. It is stored in PostgreSQL.",
            items: widget.workspace.tasks,
            subtitle: (item) => "${item["dueDate"]} · ${item["priority"]}",
            completed: (item) => item["completed"] == true,
            onAdd: () => openTaskEditor(context, widget.workspace),
            onTap: (item) => openTaskEditor(context, widget.workspace, item),
            onToggle: widget.workspace.toggleTask,
            onDelete: (item) async {
              if (await confirmAction(context, title: "Delete task", message: "Remove this task from your account?")) {
                await widget.workspace.deleteTask(item["id"] as String);
              }
            },
          ),
          _ListTab(
            title: "Notes",
            empty: "Write a note or record a voice note.",
            items: widget.workspace.notes,
            subtitle: (item) {
              final content = item["content"] as String? ?? "";
              final voice = item["voicePath"] != null ? " · voice" : "";
              return (content.isEmpty ? "Empty" : content) + voice;
            },
            onAdd: () => openNoteEditor(context, widget.workspace),
            onTap: (item) => openNoteEditor(context, widget.workspace, item),
            onDelete: (item) async {
              if (await confirmAction(context, title: "Delete note", message: "Remove this note and its voice file?")) {
                await widget.workspace.deleteNote(item["id"] as String);
              }
            },
          ),
          _HabitsTab(workspace: widget.workspace),
        ];
        return Scaffold(
          body: pages[index],
          bottomNavigationBar: NavigationBar(
            selectedIndex: index,
            onDestinationSelected: (value) => setState(() => index = value),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home_outlined), label: "Home"),
              NavigationDestination(icon: Icon(Icons.check_circle_outline), label: "Tasks"),
              NavigationDestination(icon: Icon(Icons.sticky_note_2_outlined), label: "Notes"),
              NavigationDestination(icon: Icon(Icons.local_fire_department_outlined), label: "Habits"),
            ],
          ),
        );
      },
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({required this.workspace, required this.session, required this.reminders});

  final WorkspaceController workspace;
  final SessionController session;
  final LocalReminders reminders;

  @override
  Widget build(BuildContext context) {
    final pending = workspace.tasks.where((item) => asMap(item)["completed"] != true).length;
    final notes = workspace.notes.length;
    final habitsDone = workspace.habits.where((item) => asMap(item)["completedToday"] == true).length;
    final due = workspace.dueToday();
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            children: [
              Expanded(
                child: Text("Your workspace", style: Theme.of(context).textTheme.headlineSmall),
              ),
              IconButton(
                tooltip: "Open profile",
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => ProfileScreen(workspace: workspace))),
                icon: const Icon(Icons.person_outline),
              ),
              IconButton(
                tooltip: "Open settings",
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => SettingsScreen(workspace: workspace, session: session, reminders: reminders),
                  ),
                ),
                icon: const Icon(Icons.settings_outlined),
              ),
            ],
          ),
          Text("Signed in as ${workspace.user?["name"] ?? "you"}. Data lives in PostgreSQL."),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _StatCard(label: "Pending", value: "$pending"),
              _StatCard(label: "Notes", value: "$notes"),
              _StatCard(label: "Habits today", value: "$habitsDone/${workspace.habits.length}"),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: [
              ActionChip(
                label: const Text("Goals"),
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => GoalsScreen(workspace: workspace))),
              ),
              ActionChip(
                label: const Text("Time"),
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => TimeScreen(workspace: workspace))),
              ),
              ActionChip(
                label: const Text("Focus"),
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => FocusScreen(workspace: workspace))),
              ),
              ActionChip(
                label: const Text("Counts"),
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => CountsScreen(workspace: workspace))),
              ),
              ActionChip(
                label: const Text("Share"),
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => ShareScreen(workspace: workspace))),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text("Due today", style: Theme.of(context).textTheme.titleMedium),
          if (due.isEmpty)
            const ListTile(contentPadding: EdgeInsets.zero, title: Text("Nothing due today."))
          else
            ...due.map((task) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(task["title"] as String? ?? ""),
                subtitle: Text("${task["priority"]}"),
                onTap: () => openTaskEditor(context, workspace, task),
              );
            }),
          if (workspace.error != null) Text(workspace.error!, style: const TextStyle(color: Colors.red)),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [Text(value, style: Theme.of(context).textTheme.headlineSmall), Text(label)]),
      ),
    );
  }
}

class _ListTab extends StatelessWidget {
  const _ListTab({
    required this.title,
    required this.empty,
    required this.items,
    required this.subtitle,
    required this.onAdd,
    required this.onTap,
    required this.onDelete,
    this.onToggle,
    this.completed,
  });

  final String title;
  final String empty;
  final List<dynamic> items;
  final String Function(Map<String, dynamic>) subtitle;
  final VoidCallback onAdd;
  final void Function(Map<String, dynamic>) onTap;
  final Future<void> Function(Map<String, dynamic>) onDelete;
  final Future<void> Function(Map<String, dynamic>)? onToggle;
  final bool Function(Map<String, dynamic>)? completed;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(title: Text(title)),
        floatingActionButton: FloatingActionButton(onPressed: onAdd, child: const Icon(Icons.add)),
        body: items.isEmpty
            ? Center(child: Text(empty))
            : ListView.builder(
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = asMap(items[index]);
                  return ListTile(
                    leading: onToggle == null
                        ? null
                        : Checkbox(
                            value: completed?.call(item) ?? false,
                            onChanged: (_) => onToggle!(item),
                          ),
                    title: Text(item["title"] as String? ?? item["name"] as String? ?? ""),
                    subtitle: Text(subtitle(item)),
                    onTap: () => onTap(item),
                    trailing: IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => onDelete(item)),
                  );
                },
              ),
      ),
    );
  }
}

class _HabitsTab extends StatelessWidget {
  const _HabitsTab({required this.workspace});
  final WorkspaceController workspace;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(title: const Text("Habits")),
        floatingActionButton: FloatingActionButton(onPressed: () => openHabitEditor(context, workspace), child: const Icon(Icons.add)),
        body: workspace.habits.isEmpty
            ? const Center(child: Text("Add one habit you can keep."))
            : ListView(
                children: workspace.habits.map((raw) {
                  final habit = asMap(raw);
                  return SwitchListTile(
                    title: Text(habit["name"] as String? ?? ""),
                    subtitle: Text("${habit["category"]} · streak ${habit["streak"] ?? 0}"),
                    value: habit["completedToday"] == true,
                    onChanged: (_) => workspace.toggleHabit(habit["id"] as String),
                    secondary: IconButton(
                      icon: const Icon(Icons.edit_outlined),
                      onPressed: () => openHabitEditor(context, workspace, habit),
                    ),
                  );
                }).toList(),
              ),
      ),
    );
  }
}
