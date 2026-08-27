import "package:flutter/material.dart";
import "package:managekar/src/screens/voice_bowl.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/format.dart";
import "package:managekar/src/widgets/forms.dart";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

Future<void> captureVoiceFromOrb(BuildContext context, WorkspaceController workspace) async {
  final result = await openVoiceBowl(context);
  if (result == null || !context.mounted) {
    return;
  }
  final title = result.transcription.isEmpty ? "Voice note" : result.transcription;
  final saved = await workspace.saveNote({
    "title": title,
    "content": result.transcription,
  });
  final id = saved?["id"] as String?;
  if (id == null) {
    return;
  }
  await workspace.uploadVoiceFile(
    id,
    result.path,
    transcription: result.transcription,
    duration: result.duration,
  );
}

Future<void> openTaskEditor(BuildContext context, WorkspaceController workspace, [Map<String, dynamic>? task]) async {
  final title = TextEditingController(text: task?["title"] as String? ?? "");
  final due = TextEditingController(text: (task?["dueDate"] as String? ?? todayKey()).sliceDate());
  final description = TextEditingController(text: task?["description"] as String? ?? "");
  var priority = task?["priority"] as String? ?? "medium";
  var recurring = task?["recurring"] as String? ?? "none";
  var reminders = task?["reminders"] == true;
  var completed = task?["completed"] == true;
  final checklist = <Map<String, dynamic>>[
    ...((task?["checklist"] as List<dynamic>? ?? []).whereType<Map>().map(asMap)),
  ];
  final item = TextEditingController();

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: StatefulBuilder(
          builder: (context, setState) {
            return EditorScaffold(
              title: task == null ? "Create task" : "Edit task",
              children: [
                TextField(controller: title, decoration: const InputDecoration(labelText: "Title")),
                const SizedBox(height: 12),
                TextField(controller: due, decoration: const InputDecoration(labelText: "Due date YYYY-MM-DD")),
                const SizedBox(height: 12),
                TextField(controller: description, decoration: const InputDecoration(labelText: "Description"), maxLines: 3),
                const SizedBox(height: 12),
                LabeledDropdown(
                  label: "Priority",
                  value: priority,
                  items: const ["high", "medium", "low"],
                  onChanged: (value) => setState(() => priority = value),
                ),
                const SizedBox(height: 12),
                LabeledDropdown(
                  label: "Repeats",
                  value: recurring,
                  items: const ["none", "daily", "weekly", "monthly"],
                  onChanged: (value) => setState(() => recurring = value),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text("Reminders"),
                  value: reminders,
                  onChanged: (value) => setState(() => reminders = value),
                ),
                if (task != null)
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text("Completed"),
                    value: completed,
                    onChanged: (value) => setState(() => completed = value),
                  ),
                TextField(
                  controller: item,
                  decoration: InputDecoration(
                    labelText: "Checklist item",
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.add),
                      onPressed: () {
                        if (item.text.trim().isEmpty) {
                          return;
                        }
                        setState(() {
                          checklist.add({"id": checklist.length + 1, "text": item.text.trim(), "completed": false});
                          item.clear();
                        });
                      },
                    ),
                  ),
                ),
                ...checklist.map((entry) {
                  return CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(entry["text"] as String? ?? ""),
                    value: entry["completed"] == true,
                    onChanged: (value) => setState(() => entry["completed"] = value == true),
                    secondary: IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => setState(() => checklist.remove(entry)),
                    ),
                  );
                }),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () async {
                    if (title.text.trim().isEmpty) {
                      return;
                    }
                    await workspace.saveTask({
                      "title": title.text.trim(),
                      "dueDate": due.text.trim(),
                      "description": description.text,
                      "priority": priority,
                      "recurring": recurring,
                      "reminders": reminders,
                      "completed": completed,
                      "checklist": checklist,
                    }, id: task?["id"] as String?);
                    if (context.mounted) {
                      Navigator.pop(context);
                    }
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
}

Future<void> openNoteEditor(BuildContext context, WorkspaceController workspace, [Map<String, dynamic>? note]) async {
  final title = TextEditingController(text: note?["title"] as String? ?? "");
  final content = TextEditingController(text: note?["content"] as String? ?? "");
  String? noteId = note?["id"] as String?;
  String? transcription = note?["transcription"] as String?;
  final hasVoice = note?["voicePath"] != null;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setState) {
          return EditorScaffold(
            title: note == null ? "Create note" : "Edit note",
            children: [
              TextField(controller: title, decoration: const InputDecoration(labelText: "Title")),
              const SizedBox(height: 12),
              TextField(controller: content, decoration: const InputDecoration(labelText: "Content"), maxLines: 6),
              if ((transcription ?? "").isNotEmpty) ...[
                const SizedBox(height: 12),
                Text("Transcription: $transcription"),
              ],
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  var id = noteId;
                  if (id == null) {
                    if (title.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Add a title before recording.")),
                      );
                      return;
                    }
                    final saved = await workspace.saveNote({
                      "title": title.text.trim(),
                      "content": content.text,
                    });
                    id = saved?["id"] as String?;
                    noteId = id;
                  }
                  if (id == null || !context.mounted) {
                    return;
                  }
                  final result = await openVoiceBowl(context);
                  if (result == null) {
                    return;
                  }
                  await workspace.uploadVoiceFile(
                    id,
                    result.path,
                    transcription: result.transcription,
                    duration: result.duration,
                  );
                  setState(() => transcription = result.transcription);
                  if (context.mounted) {
                    Navigator.pop(context);
                  }
                },
                icon: const Icon(Icons.mic),
                label: Text(hasVoice ? "Replace voice note" : "Record a voice note"),
              ),
              if (hasVoice && noteId != null)
                TextButton.icon(
                  onPressed: () async {
                    final bytes = await workspace.api.downloadVoice(noteId!);
                    await playVoiceBytes(bytes);
                  },
                  icon: const Icon(Icons.play_arrow),
                  label: const Text("Play saved voice"),
                ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () async {
                  if (title.text.trim().isEmpty) {
                    return;
                  }
                  await workspace.saveNote({
                    "title": title.text.trim(),
                    "content": content.text,
                  }, id: noteId);
                  if (context.mounted) {
                    Navigator.pop(context);
                  }
                },
                child: const Text("Save"),
              ),
            ],
          );
        },
      );
    },
  );
}

Future<void> openHabitEditor(BuildContext context, WorkspaceController workspace, [Map<String, dynamic>? habit]) async {
  final name = TextEditingController(text: habit?["name"] as String? ?? "");
  final description = TextEditingController(text: habit?["description"] as String? ?? "");
  final unit = TextEditingController(text: habit?["unit"] as String? ?? "times");
  final reminderTime = TextEditingController(text: habit?["reminderTime"] as String? ?? "09:00");
  var category = habit?["category"] as String? ?? "health";
  var frequency = habit?["frequency"] as String? ?? "daily";
  var reminders = habit?["reminders"] == true;
  var goal = habit?["goal"] as int? ?? 1;
  final customDays = <String>{
    ...((habit?["customDays"] as List<dynamic>? ?? []).map((item) => item.toString())),
  };

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: StatefulBuilder(
          builder: (context, setState) {
            return EditorScaffold(
              title: habit == null ? "Create habit" : "Edit habit",
              children: [
                TextField(controller: name, decoration: const InputDecoration(labelText: "Habit name")),
                const SizedBox(height: 12),
                TextField(controller: description, decoration: const InputDecoration(labelText: "Description")),
                const SizedBox(height: 12),
                LabeledDropdown(
                  label: "Category",
                  value: category,
                  items: const ["health", "fitness", "mindfulness", "productivity", "learning", "lifestyle"],
                  onChanged: (value) => setState(() => category = value),
                ),
                const SizedBox(height: 12),
                LabeledDropdown(
                  label: "Frequency",
                  value: frequency,
                  items: const ["daily", "weekly", "custom"],
                  onChanged: (value) => setState(() => frequency = value),
                ),
                if (frequency == "custom")
                  Wrap(
                    children: weekdays.map((day) {
                      final selected = customDays.contains(day);
                      return FilterChip(
                        label: Text(day.substring(0, 3)),
                        selected: selected,
                        onSelected: (value) => setState(() {
                          if (value) {
                            customDays.add(day);
                          } else {
                            customDays.remove(day);
                          }
                        }),
                      );
                    }).toList(),
                  ),
                const SizedBox(height: 12),
                TextField(controller: unit, decoration: const InputDecoration(labelText: "Unit")),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text("Reminders"),
                  value: reminders,
                  onChanged: (value) => setState(() => reminders = value),
                ),
                TextField(controller: reminderTime, decoration: const InputDecoration(labelText: "Reminder time HH:MM")),
                Row(
                  children: [
                    const Text("Daily goal"),
                    const Spacer(),
                    IconButton(onPressed: () => setState(() => goal = goal > 1 ? goal - 1 : 1), icon: const Icon(Icons.remove)),
                    Text("$goal"),
                    IconButton(onPressed: () => setState(() => goal += 1), icon: const Icon(Icons.add)),
                  ],
                ),
                if (habit != null)
                  TextButton(
                    onPressed: () async {
                      if (await confirmAction(context, title: "Delete habit", message: "Remove this habit and its history?")) {
                        await workspace.deleteHabit(habit["id"] as String);
                        if (context.mounted) {
                          Navigator.pop(context);
                        }
                      }
                    },
                    child: const Text("Delete"),
                  ),
                FilledButton(
                  onPressed: () async {
                    if (name.text.trim().isEmpty) {
                      return;
                    }
                    await workspace.saveHabit({
                      "name": name.text.trim(),
                      "description": description.text,
                      "category": category,
                      "frequency": frequency,
                      "customDays": customDays.toList(),
                      "goal": goal,
                      "unit": unit.text.trim().isEmpty ? "times" : unit.text.trim(),
                      "reminders": reminders,
                      "reminderTime": reminderTime.text.trim(),
                    }, id: habit?["id"] as String?);
                    if (context.mounted) {
                      Navigator.pop(context);
                    }
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
}

extension on String {
  String sliceDate() => length >= 10 ? substring(0, 10) : this;
}
