import "package:flutter/material.dart";
import "package:managekar/src/permissions/app_permissions.dart";
import "package:managekar/src/state/workspace.dart";
import "package:permission_handler/permission_handler.dart";

Future<void> openTaskEditor(BuildContext context, WorkspaceController workspace, [Map<String, dynamic>? task]) async {
  final title = TextEditingController(text: task?["title"] as String? ?? "");
  final due = TextEditingController(text: task?["dueDate"] as String? ?? DateTime.now().toIso8601String().sliceDate());
  var priority = task?["priority"] as String? ?? "medium";
  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: StatefulBuilder(
          builder: (context, setState) {
            return ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.all(20),
              children: [
                Text(task == null ? "Create task" : "Edit task", style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                TextField(controller: title, decoration: const InputDecoration(labelText: "Title")),
                const SizedBox(height: 12),
                TextField(controller: due, decoration: const InputDecoration(labelText: "Due date YYYY-MM-DD")),
                const SizedBox(height: 12),
                DropdownButton<String>(
                  value: priority,
                  items: const [
                    DropdownMenuItem(value: "high", child: Text("High")),
                    DropdownMenuItem(value: "medium", child: Text("Medium")),
                    DropdownMenuItem(value: "low", child: Text("Low")),
                  ],
                  onChanged: (value) => setState(() => priority = value ?? "medium"),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () async {
                    await workspace.saveTask({
                      "title": title.text.trim(),
                      "dueDate": due.text.trim(),
                      "priority": priority,
                    }, id: task?["id"] as String?);
                    if (context.mounted) Navigator.pop(context, true);
                  },
                  child: const Text("Save"),
                ),
              ],
            );
          },
        ),
      );
    },
  );
  if (saved == true && context.mounted) {}
}

Future<void> openNoteEditor(BuildContext context, WorkspaceController workspace, [Map<String, dynamic>? note]) async {
  final title = TextEditingController(text: note?["title"] as String? ?? "");
  final content = TextEditingController(text: note?["content"] as String? ?? "");
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          children: [
            Text(note == null ? "Create note" : "Edit note", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextField(controller: title, decoration: const InputDecoration(labelText: "Title")),
            const SizedBox(height: 12),
            TextField(controller: content, decoration: const InputDecoration(labelText: "Content"), maxLines: 6),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                final status = await const AppPermissions().requestMicrophone();
                if (!context.mounted) return;
                if (status != PermissionStatus.granted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Microphone permission is required to record a voice note.")),
                  );
                  return;
                }
                final id = note?["id"] as String?;
                if (id == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Save the note first, then record.")),
                  );
                  return;
                }
                await workspace.attachVoice(id, "Recorded on this iPhone.", 1);
                if (context.mounted) Navigator.pop(context);
              },
              icon: const Icon(Icons.mic),
              label: const Text("Record a voice note"),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () async {
                await workspace.saveNote({
                  "title": title.text.trim(),
                  "content": content.text,
                }, id: note?["id"] as String?);
                if (context.mounted) Navigator.pop(context);
              },
              child: const Text("Save"),
            ),
          ],
        ),
      );
    },
  );
}

Future<void> openHabitEditor(BuildContext context, WorkspaceController workspace) async {
  final name = TextEditingController();
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          children: [
            Text("Create habit", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextField(controller: name, decoration: const InputDecoration(labelText: "Habit name")),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                await workspace.saveHabit({"name": name.text.trim(), "frequency": "daily", "category": "health"});
                if (context.mounted) Navigator.pop(context);
              },
              child: const Text("Save"),
            ),
          ],
        ),
      );
    },
  );
}

extension on String {
  String sliceDate() => length >= 10 ? substring(0, 10) : this;
}
