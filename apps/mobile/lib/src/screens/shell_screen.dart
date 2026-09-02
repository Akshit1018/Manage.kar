import "package:flutter/material.dart";
import "package:managekar/src/notifications/local_reminders.dart";
import "package:managekar/src/screens/chats_screen.dart";
import "package:managekar/src/screens/counts_screen.dart";
import "package:managekar/src/screens/editors.dart";
import "package:managekar/src/screens/profile_screen.dart";
import "package:managekar/src/screens/settings_screen.dart";
import "package:managekar/src/state/dialer.dart";
import "package:managekar/src/state/session.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/ui/home_feed.dart";
import "package:managekar/src/util/format.dart";
import "package:managekar/src/widgets/assist_orb.dart";
import "package:managekar/src/widgets/assist_orb_geometry.dart";
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
  final DialerController dialer = DialerController();

  @override
  void initState() {
    super.initState();
    widget.workspace.refresh().then((_) => widget.reminders.sync(widget.workspace));
    dialer.hydrate();
  }

  @override
  void dispose() {
    dialer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.workspace,
      builder: (context, _) {
        final pages = [
          _HomeTab(
            workspace: widget.workspace,
            session: widget.session,
            reminders: widget.reminders,
            dialer: dialer,
            onOpenTab: (value) => setState(() => index = value),
          ),
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
          ChatsTab(dialer: dialer),
          _HabitsTab(workspace: widget.workspace),
        ];
        return Scaffold(
          body: Stack(
            children: [
              pages[index],
              AssistOrb(
                visible: orbVisibleOnTab(index),
                stageHome: index == 0,
                onRecord: () => captureVoiceFromOrb(context, widget.workspace),
                onTask: () => openTaskEditor(context, widget.workspace),
                onNote: () => openNoteEditor(context, widget.workspace),
                onChats: () => setState(() => index = 3),
              ),
            ],
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: index,
            onDestinationSelected: (value) => setState(() => index = value),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home_outlined), label: "Home"),
              NavigationDestination(icon: Icon(Icons.check_circle_outline), label: "Tasks"),
              NavigationDestination(icon: Icon(Icons.sticky_note_2_outlined), label: "Notes"),
              NavigationDestination(icon: Icon(Icons.chat_bubble_outline), label: "Chats"),
              NavigationDestination(icon: Icon(Icons.local_fire_department_outlined), label: "Habits"),
            ],
          ),
        );
      },
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({
    required this.workspace,
    required this.session,
    required this.reminders,
    required this.onOpenTab,
    this.dialer,
  });

  final WorkspaceController workspace;
  final SessionController session;
  final LocalReminders reminders;
  final ValueChanged<int> onOpenTab;
  final DialerController? dialer;

  @override
  Widget build(BuildContext context) {
    final tasks = workspace.tasks.map(asMap).toList();
    final notes = workspace.notes.map(asMap).toList();
    final habits = workspace.habits.map(asMap).toList();
    final due = workspace.dueToday();
    final doingCount = tasks.where((item) => item["status"] == "doing" && item["completed"] != true).length;
    final sessions = visibleSessions(dialer?.state ?? DialerState.empty());
    final agents = homeAgents(sessions);
    final briefAgent = agents.isEmpty ? null : agents.first;
    final chats = chatListItems(dialer?.state ?? DialerState.empty());
    final paired = sessions.any((session) => session.source == "paired");
    final taskPreview = homeTaskPreview(tasks);
    final notePreview = homeNotePreview(notes);
    final habitPreview = homeHabitPreview(habits);
    final chatPreview = homeChatPreview(chats);
    final doing = tasks.where((item) => item["status"] == "doing" && item["completed"] != true);
    final spotlight = doing.isNotEmpty ? doing.first : (due.isEmpty ? null : due.first);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            children: [
              IconButton(
                tooltip: "Open profile",
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => ProfileScreen(workspace: workspace))),
                icon: const Icon(Icons.person_outline),
              ),
              const Spacer(),
              IconButton(
                tooltip: "More",
                onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => CountsScreen(workspace: workspace))),
                icon: const Icon(Icons.grid_view_outlined),
              ),
              IconButton(
                tooltip: "Open settings",
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => SettingsScreen(workspace: workspace, session: session, reminders: reminders, dialer: dialer),
                  ),
                ),
                icon: const Icon(Icons.settings_outlined),
              ),
            ],
          ),
          Text("Today", style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    agentDayBriefing(
                      doingCount: doingCount,
                      todayCount: due.length,
                      paired: paired,
                      agentTitle: briefAgent?.title,
                      agentIsDemo: briefAgent?.source == "demo",
                    ),
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton(
                        onPressed: () => openTaskEditor(context, workspace),
                        child: const Text("Add a task"),
                      ),
                      if (!paired)
                        OutlinedButton(
                          onPressed: () => onOpenTab(3),
                          child: const Text("Pair a machine"),
                        ),
                      if (briefAgent != null)
                        OutlinedButton(
                          onPressed: dialer == null ? null : () => openChatThread(context, dialer!, briefAgent.id),
                          child: Text("Ask ${briefAgent.title}"),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: kHomeBallStageMin),
          if (agents.isNotEmpty)
            SizedBox(
              height: 96,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: agents.map((agent) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: InkWell(
                      onTap: dialer == null ? null : () => openChatThread(context, dialer!, agent.id),
                      child: SizedBox(
                        width: 72,
                        child: Column(
                          children: [
                            CircleAvatar(radius: 28, child: Text(agentInitials(agent.title))),
                            const SizedBox(height: 6),
                            Text(agent.title, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.labelMedium),
                            Text(agentCaption(agent), style: Theme.of(context).textTheme.labelSmall),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              _JumpTile(label: "Task", icon: Icons.check_circle_outline, onTap: () => onOpenTab(1)),
              const SizedBox(width: 8),
              _JumpTile(label: "Notes", icon: Icons.sticky_note_2_outlined, onTap: () => onOpenTab(2)),
              const SizedBox(width: 8),
              _JumpTile(label: "Chat", icon: Icons.chat_bubble_outline, onTap: () => onOpenTab(3)),
              const SizedBox(width: 8),
              _JumpTile(label: "Habit", icon: Icons.local_fire_department_outlined, onTap: () => onOpenTab(4)),
            ],
          ),
          if (spotlight != null) ...[
            const SizedBox(height: 16),
            Card(
              child: ListTile(
                title: Text(spotlight["title"] as String? ?? "Task"),
                subtitle: Text(taskProgressDetail(spotlight)),
                onTap: () => openTaskEditor(context, workspace, spotlight),
              ),
            ),
          ],
          if (showHomeListPreview(chatPreview.length)) ...[
            const SizedBox(height: 20),
            ...chatPreview.map((item) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(item.title),
                subtitle: Text(item.preview),
                onTap: dialer == null ? null : () => openChatThread(context, dialer!, item.id),
              );
            }),
          ],
          if (showHomeListPreview(taskPreview.length)) ...[
            ...taskPreview.map((item) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(item["title"] as String? ?? ""),
                subtitle: Text(taskProgressDetail(item)),
                onTap: () => openTaskEditor(context, workspace, item),
              );
            }),
            if (tasks.where((item) => item["completed"] != true).length > taskPreview.length)
              TextButton(onPressed: () => onOpenTab(1), child: const Text("View all")),
          ],
          if (showHomeListPreview(notePreview.length)) ...[
            ...notePreview.map((item) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(item["title"] as String? ?? "Untitled note"),
                subtitle: Text((item["content"] as String?)?.isEmpty == true ? "Empty" : item["content"] as String? ?? "Empty"),
                onTap: () => openNoteEditor(context, workspace, item),
              );
            }),
            if (notes.length > notePreview.length)
              TextButton(onPressed: () => onOpenTab(2), child: const Text("View all")),
          ],
          if (showHomeListPreview(habitPreview.length)) ...[
            ...habitPreview.map((item) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(item["name"] as String? ?? ""),
                subtitle: Text(item["completedToday"] == true ? "Done today" : "Not yet today"),
                onTap: () => openHabitEditor(context, workspace, item),
              );
            }),
            if (habits.length > habitPreview.length)
              TextButton(onPressed: () => onOpenTab(4), child: const Text("View all")),
          ],
          if (workspace.error != null) Text(workspace.error!, style: const TextStyle(color: Colors.red)),
        ],
      ),
    );
  }
}

class _JumpTile extends StatelessWidget {
  const _JumpTile({required this.label, required this.icon, required this.onTap});

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: AspectRatio(
        aspectRatio: 1,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Ink(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon),
                const SizedBox(height: 6),
                Text(label, style: Theme.of(context).textTheme.labelLarge),
              ],
            ),
          ),
        ),
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
        floatingActionButton: FloatingActionButton(
          tooltip: "Add $title",
          onPressed: onAdd,
          child: const Icon(Icons.add),
        ),
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
        floatingActionButton: FloatingActionButton(
          tooltip: "Add habit",
          onPressed: () => openHabitEditor(context, workspace),
          child: const Icon(Icons.add),
        ),
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
