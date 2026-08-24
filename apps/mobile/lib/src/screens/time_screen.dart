import "dart:async";

import "package:flutter/material.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/format.dart";

class TimeScreen extends StatefulWidget {
  const TimeScreen({super.key, required this.workspace});

  final WorkspaceController workspace;

  @override
  State<TimeScreen> createState() => _TimeScreenState();
}

class _TimeScreenState extends State<TimeScreen> {
  final name = TextEditingController();
  var project = "Personal";
  Timer? ticker;
  var now = DateTime.now();

  @override
  void initState() {
    super.initState();
    ticker = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => now = DateTime.now()));
  }

  @override
  void dispose() {
    ticker?.cancel();
    name.dispose();
    super.dispose();
  }

  int runningMs(Map<String, dynamic> entry) {
    final stored = entry["duration"] as int? ?? 0;
    if (entry["isRunning"] != true) {
      return stored;
    }
    final started = DateTime.tryParse(entry["startTime"] as String? ?? "") ?? now;
    return stored + now.difference(started).inMilliseconds;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.workspace,
      builder: (context, _) {
        final entries = widget.workspace.timeEntries.whereType<Map>().map(asMap).toList();
        final current = entries.cast<Map<String, dynamic>?>().firstWhere(
              (item) => item!["isRunning"] == true || item["endTime"] == null,
              orElse: () => null,
            );
        final todayTotal = entries.fold<int>(0, (sum, item) {
          final started = DateTime.tryParse(item["startTime"] as String? ?? "");
          if (started == null || started.toIso8601String().sliceDate() != todayKey()) {
            return sum;
          }
          return sum + runningMs(item);
        });
        return Scaffold(
          appBar: AppBar(title: const Text("Time tracker")),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(formatDurationMs(current == null ? 0 : runningMs(current)), style: Theme.of(context).textTheme.displaySmall),
              const SizedBox(height: 8),
              Text("Today ${formatDurationMs(todayTotal)}"),
              const SizedBox(height: 16),
              TextField(controller: name, decoration: const InputDecoration(labelText: "What are you working on?")),
              const SizedBox(height: 12),
              LabeledProject(value: project, onChanged: (value) => setState(() => project = value)),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () async {
                  if (name.text.trim().isEmpty) {
                    return;
                  }
                  await widget.workspace.startTimer(name.text.trim(), project);
                  name.clear();
                },
                child: const Text("Start timer"),
              ),
              if (current != null) ...[
                const SizedBox(height: 8),
                if (current["isRunning"] == true)
                  FilledButton.tonal(onPressed: () => widget.workspace.pauseTimer(current["id"] as String), child: const Text("Pause"))
                else if (current["endTime"] == null)
                  FilledButton.tonal(onPressed: () => widget.workspace.resumeTimer(current["id"] as String), child: const Text("Resume")),
                TextButton(onPressed: () => widget.workspace.stopTimer(current["id"] as String), child: const Text("Stop")),
              ],
              const SizedBox(height: 16),
              ...entries.map((item) {
                return ListTile(
                  title: Text(item["taskName"] as String? ?? ""),
                  subtitle: Text("${item["project"]} · ${formatDurationMs(runningMs(item))}"),
                  trailing: item["isRunning"] == true ? const Icon(Icons.timelapse) : null,
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

class LabeledProject extends StatelessWidget {
  const LabeledProject({super.key, required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: const InputDecoration(labelText: "Project"),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: value,
          items: const ["Personal", "Work", "Learning", "Health"]
              .map((item) => DropdownMenuItem(value: item, child: Text(item)))
              .toList(),
          onChanged: (next) {
            if (next != null) {
              onChanged(next);
            }
          },
        ),
      ),
    );
  }
}

extension on String {
  String sliceDate() => length >= 10 ? substring(0, 10) : this;
}
