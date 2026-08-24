import "package:flutter/material.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/format.dart";
import "package:managekar/src/widgets/forms.dart";

class GoalsScreen extends StatelessWidget {
  const GoalsScreen({super.key, required this.workspace});

  final WorkspaceController workspace;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: workspace,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(title: const Text("Goals")),
          floatingActionButton: FloatingActionButton(
            onPressed: () => openGoalEditor(context, workspace),
            child: const Icon(Icons.add),
          ),
          body: workspace.goals.isEmpty
              ? const Center(child: Text("Add one goal you can finish."))
              : ListView(
                  children: workspace.goals.map((raw) {
                    final goal = asMap(raw);
                    return ListTile(
                      title: Text(goal["title"] as String? ?? ""),
                      subtitle: Text("${goal["status"]} · ${goal["progress"]}%"),
                      onTap: () => openGoalEditor(context, workspace, goal),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () async {
                          if (await confirmAction(
                            context,
                            title: "Delete goal",
                            message: "This removes the goal and its milestones from PostgreSQL.",
                          )) {
                            await workspace.deleteGoal(goal["id"] as String);
                          }
                        },
                      ),
                    );
                  }).toList(),
                ),
        );
      },
    );
  }
}

Future<void> openGoalEditor(BuildContext context, WorkspaceController workspace, [Map<String, dynamic>? goal]) async {
  final title = TextEditingController(text: goal?["title"] as String? ?? "");
  final description = TextEditingController(text: goal?["description"] as String? ?? "");
  final target = TextEditingController(text: goal?["targetDate"] as String? ?? "");
  final milestone = TextEditingController();
  var category = goal?["category"] as String? ?? "personal";
  var priority = goal?["priority"] as String? ?? "medium";
  var status = goal?["status"] as String? ?? "active";

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: AnimatedBuilder(
          animation: workspace,
          builder: (context, _) {
            final latest = goal == null
                ? null
                : workspace.goals.whereType<Map>().map(asMap).cast<Map<String, dynamic>?>().firstWhere(
                      (item) => item!["id"] == goal["id"],
                      orElse: () => goal,
                    );
            final milestones = ((latest?["milestones"] as List<dynamic>?) ?? []).whereType<Map>().map(asMap).toList();
            return StatefulBuilder(
              builder: (context, setState) {
                return EditorScaffold(
                  title: goal == null ? "Create goal" : "Edit goal",
                  children: [
                    TextField(controller: title, decoration: const InputDecoration(labelText: "Title")),
                    const SizedBox(height: 12),
                    TextField(controller: description, decoration: const InputDecoration(labelText: "Description"), maxLines: 3),
                    const SizedBox(height: 12),
                    TextField(controller: target, decoration: const InputDecoration(labelText: "Target date")),
                    const SizedBox(height: 12),
                    LabeledDropdown(
                      label: "Category",
                      value: category,
                      items: const ["personal", "work", "health", "learning", "financial"],
                      onChanged: (value) => setState(() => category = value),
                    ),
                    const SizedBox(height: 12),
                    LabeledDropdown(
                      label: "Priority",
                      value: priority,
                      items: const ["high", "medium", "low"],
                      onChanged: (value) => setState(() => priority = value),
                    ),
                    const SizedBox(height: 12),
                    LabeledDropdown(
                      label: "Status",
                      value: status,
                      items: const ["active", "completed", "paused"],
                      onChanged: (value) => setState(() => status = value),
                    ),
                    if (latest != null) ...[
                      const SizedBox(height: 12),
                      TextField(
                        controller: milestone,
                        decoration: InputDecoration(
                          labelText: "Add milestone",
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.add),
                            onPressed: () async {
                              if (milestone.text.trim().isEmpty) {
                                return;
                              }
                              await workspace.addMilestone(latest["id"] as String, milestone.text.trim());
                              milestone.clear();
                            },
                          ),
                        ),
                      ),
                      ...milestones.map((item) {
                        return CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(item["title"] as String? ?? ""),
                          value: item["completed"] == true,
                          onChanged: (_) => workspace.toggleMilestone(latest["id"] as String, item),
                        );
                      }),
                    ],
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () async {
                        if (title.text.trim().isEmpty) {
                          return;
                        }
                        await workspace.saveGoal({
                          "title": title.text.trim(),
                          "description": description.text,
                          "category": category,
                          "priority": priority,
                          "targetDate": target.text.trim(),
                          "status": status,
                        }, id: goal?["id"] as String?);
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
        ),
      );
    },
  );
}
