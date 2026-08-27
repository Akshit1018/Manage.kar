import "package:flutter/material.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/format.dart";

class CountsScreen extends StatelessWidget {
  const CountsScreen({super.key, required this.workspace});

  final WorkspaceController workspace;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: workspace,
      builder: (context, _) {
        final done = workspace.tasks.where((item) => asMap(item)["completed"] == true).length;
        final habitsDone = workspace.habits.where((item) => asMap(item)["completedToday"] == true).length;
        final score = productivityScore(
          doneTasks: done,
          totalTasks: workspace.tasks.length,
          habitsDone: habitsDone,
          totalHabits: workspace.habits.length,
        );
        return Scaffold(
          appBar: AppBar(title: const Text("Counts")),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text("Counts come from this account in PostgreSQL. Recommendations are heuristics, not a model."),
              const SizedBox(height: 16),
              Text("$score", style: Theme.of(context).textTheme.displaySmall),
              const Text("Workspace score"),
              const SizedBox(height: 16),
              ListTile(
                title: const Text("Task completion"),
                subtitle: Text("$done of ${workspace.tasks.length} tasks complete."),
              ),
              ListTile(
                title: const Text("Habits today"),
                subtitle: Text("$habitsDone of ${workspace.habits.length} habits marked done today."),
              ),
              ListTile(
                title: const Text("Notes"),
                subtitle: Text("${workspace.notes.length} notes stored."),
              ),
              ListTile(
                title: const Text("Goals"),
                subtitle: Text("${workspace.goals.length} goals."),
              ),
            ],
          ),
        );
      },
    );
  }
}
