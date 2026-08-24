import "package:flutter/material.dart";
import "package:managekar/src/screens/editors.dart";
import "package:managekar/src/state/session.dart";
import "package:managekar/src/state/workspace.dart";

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key, required this.session, required this.workspace});

  final SessionController session;
  final WorkspaceController workspace;

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int index = 0;

  @override
  void initState() {
    super.initState();
    widget.workspace.refresh();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.workspace,
      builder: (context, _) {
        final pages = [
          _HomeTab(workspace: widget.workspace, session: widget.session),
          _ListTab(
            title: "Tasks",
            empty: "Add one task. It is stored in PostgreSQL.",
            items: widget.workspace.tasks,
            subtitle: (item) => "${item["dueDate"]} · ${item["priority"]}",
            onAdd: () => openTaskEditor(context, widget.workspace),
            onTap: (item) => openTaskEditor(context, widget.workspace, item),
            onDelete: (item) => widget.workspace.deleteTask(item["id"] as String),
          ),
          _ListTab(
            title: "Notes",
            empty: "Write a note or record a voice note.",
            items: widget.workspace.notes,
            subtitle: (item) => (item["content"] as String? ?? "").isEmpty ? "Empty" : item["content"] as String,
            onAdd: () => openNoteEditor(context, widget.workspace),
            onTap: (item) => openNoteEditor(context, widget.workspace, item),
            onDelete: (item) => widget.workspace.deleteNote(item["id"] as String),
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
  const _HomeTab({required this.workspace, required this.session});

  final WorkspaceController workspace;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    final pending = workspace.tasks.where((item) => item["completed"] != true).length;
    final notes = workspace.notes.length;
    final habitsDone = workspace.habits.where((item) => item["completedToday"] == true).length;
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
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(
                  builder: (_) => _SimpleFormScreen(
                    title: "Profile",
                    fields: {
                      "name": workspace.user?["name"] as String? ?? "",
                      "phone": workspace.user?["phone"] as String? ?? "",
                      "location": workspace.user?["location"] as String? ?? "",
                      "bio": workspace.user?["bio"] as String? ?? "",
                    },
                    onSave: (values) => workspace.saveProfile(values),
                  ),
                )),
                icon: const Icon(Icons.person_outline),
              ),
              IconButton(
                tooltip: "Open settings",
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(
                  builder: (_) => _SettingsScreen(workspace: workspace, session: session),
                )),
                icon: const Icon(Icons.settings_outlined),
              ),
            ],
          ),
          const Text("Account workspace in PostgreSQL. Export is still the backup you control."),
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
              ActionChip(label: const Text("Goals"), onPressed: () => _openList(context, "Goals", workspace.goals, (item) => item["title"] as String)),
              ActionChip(label: const Text("Time"), onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => _TimeScreen(workspace: workspace)))),
              ActionChip(label: const Text("Focus"), onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => _FocusScreen(workspace: workspace)))),
              ActionChip(label: const Text("Counts"), onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => _CountsScreen(workspace: workspace)))),
            ],
          ),
          if (workspace.error != null) Text(workspace.error!, style: const TextStyle(color: Colors.red)),
        ],
      ),
    );
  }

  void _openList(BuildContext context, String title, List<dynamic> items, String Function(Map<String, dynamic>) label) {
    Navigator.push(context, MaterialPageRoute<void>(
      builder: (_) => Scaffold(
        appBar: AppBar(title: Text(title)),
        floatingActionButton: title == "Goals"
            ? FloatingActionButton(
                onPressed: () async {
                  final controller = TextEditingController();
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text("New goal"),
                      content: TextField(controller: controller, decoration: const InputDecoration(labelText: "Title")),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
                        FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text("Save")),
                      ],
                    ),
                  );
                  if (ok == true) {
                    await workspace.saveGoal({"title": controller.text.trim(), "category": "personal"});
                  }
                },
                child: const Icon(Icons.add),
              )
            : null,
        body: items.isEmpty
            ? const Center(child: Text("Nothing here yet."))
            : ListView(
                children: items
                    .map((raw) {
                      final item = raw as Map<String, dynamic>;
                      return ListTile(title: Text(label(item)), subtitle: Text("${item["status"] ?? item["progress"] ?? ""}"));
                    })
                    .toList(),
              ),
      ),
    ));
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
  });

  final String title;
  final String empty;
  final List<dynamic> items;
  final String Function(Map<String, dynamic>) subtitle;
  final VoidCallback onAdd;
  final void Function(Map<String, dynamic>) onTap;
  final void Function(Map<String, dynamic>) onDelete;

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
                  final item = items[index] as Map<String, dynamic>;
                  return ListTile(
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
                  final habit = raw as Map<String, dynamic>;
                  return SwitchListTile(
                    title: Text(habit["name"] as String? ?? ""),
                    subtitle: Text("Streak ${habit["streak"] ?? 0}"),
                    value: habit["completedToday"] == true,
                    onChanged: (_) => workspace.toggleHabit(habit["id"] as String),
                  );
                }).toList(),
              ),
      ),
    );
  }
}

class _SimpleFormScreen extends StatefulWidget {
  const _SimpleFormScreen({required this.title, required this.fields, required this.onSave});
  final String title;
  final Map<String, String> fields;
  final Future<void> Function(Map<String, dynamic>) onSave;

  @override
  State<_SimpleFormScreen> createState() => _SimpleFormScreenState();
}

class _SimpleFormScreenState extends State<_SimpleFormScreen> {
  late final Map<String, TextEditingController> controllers;

  @override
  void initState() {
    super.initState();
    controllers = {
      for (final entry in widget.fields.entries) entry.key: TextEditingController(text: entry.value),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          ...controllers.entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: TextField(controller: entry.value, decoration: InputDecoration(labelText: entry.key)),
            ),
          ),
          FilledButton(
            onPressed: () async {
              await widget.onSave({for (final entry in controllers.entries) entry.key: entry.value.text});
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }
}

class _SettingsScreen extends StatelessWidget {
  const _SettingsScreen({required this.workspace, required this.session});
  final WorkspaceController workspace;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Settings")),
      body: ListView(
        children: [
          ListTile(
            title: const Text("Account"),
            subtitle: Text(workspace.user?["email"] as String? ?? ""),
          ),
          SwitchListTile(
            title: const Text("Clipboard suggestions"),
            subtitle: const Text("Off by default. Reads clipboard only after you enable it."),
            value: workspace.settings?["privacy"]?["clipboardMonitor"] == true,
            onChanged: (value) => workspace.saveProfile({
              "settings": {"clipboardMonitor": value},
            }),
          ),
          ListTile(
            title: const Text("Sign out"),
            onTap: () async {
              await session.logout();
              if (context.mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}

class _TimeScreen extends StatefulWidget {
  const _TimeScreen({required this.workspace});
  final WorkspaceController workspace;

  @override
  State<_TimeScreen> createState() => _TimeScreenState();
}

class _TimeScreenState extends State<_TimeScreen> {
  final name = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final running = widget.workspace.timeEntries
        .whereType<Map<String, dynamic>>()
        .where((item) => item["isRunning"] == true);
    return Scaffold(
      appBar: AppBar(title: const Text("Time tracker")),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: name, decoration: const InputDecoration(labelText: "What are you working on?")),
          const SizedBox(height: 12),
          FilledButton(onPressed: () => widget.workspace.startTimer(name.text.trim(), "Personal"), child: const Text("Start timer")),
          if (running.isNotEmpty)
            FilledButton.tonal(
              onPressed: () => widget.workspace.stopTimer(running.first["id"] as String),
              child: const Text("Stop"),
            ),
          ...widget.workspace.timeEntries.map((raw) {
            final item = raw as Map<String, dynamic>;
            return ListTile(title: Text(item["taskName"] as String? ?? ""), subtitle: Text(item["project"] as String? ?? ""));
          }),
        ],
      ),
    );
  }
}

class _FocusScreen extends StatelessWidget {
  const _FocusScreen({required this.workspace});
  final WorkspaceController workspace;

  @override
  Widget build(BuildContext context) {
    final active = workspace.activeFocus;
    return Scaffold(
      appBar: AppBar(title: const Text("Focus")),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            if (active != null) ...[
              Text("${active["type"]}", style: Theme.of(context).textTheme.headlineSmall),
              Text("${active["remainingSeconds"]}s left"),
              FilledButton(onPressed: workspace.stopFocus, child: const Text("Stop")),
            ] else
              FilledButton(onPressed: () => workspace.startFocus("pomodoro", 25), child: const Text("Start pomodoro (25m)")),
          ],
        ),
      ),
    );
  }
}

class _CountsScreen extends StatelessWidget {
  const _CountsScreen({required this.workspace});
  final WorkspaceController workspace;

  @override
  Widget build(BuildContext context) {
    final done = workspace.tasks.where((item) => item["completed"] == true).length;
    return Scaffold(
      appBar: AppBar(title: const Text("Counts")),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Text("$done of ${workspace.tasks.length} tasks complete. Counts come from this account, not a model."),
      ),
    );
  }
}
