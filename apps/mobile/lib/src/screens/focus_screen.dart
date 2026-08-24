import "dart:async";

import "package:flutter/material.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/format.dart";

const focusTypes = [
  ("pomodoro", "Pomodoro", 25),
  ("deep-work", "Deep work", 90),
  ("break", "Break", 5),
  ("custom", "Custom", 30),
];

class FocusScreen extends StatefulWidget {
  const FocusScreen({super.key, required this.workspace});

  final WorkspaceController workspace;

  @override
  State<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends State<FocusScreen> {
  Timer? ticker;
  var now = DateTime.now();
  var customMinutes = 30;

  @override
  void initState() {
    super.initState();
    ticker = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => now = DateTime.now()));
  }

  @override
  void dispose() {
    ticker?.cancel();
    super.dispose();
  }

  int remaining(Map<String, dynamic> active) {
    final stored = active["remainingSeconds"] as int? ?? 0;
    if (active["isRunning"] != true) {
      return stored;
    }
    final started = DateTime.tryParse(active["startedAt"] as String? ?? "") ?? now;
    return (stored - now.difference(started).inSeconds).clamp(0, 24 * 3600);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.workspace,
      builder: (context, _) {
        final active = widget.workspace.activeFocus;
        return Scaffold(
          appBar: AppBar(title: const Text("Focus")),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (active != null) ...[
                Text(active["type"] as String? ?? "", style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                Text(formatClock(remaining(active)), style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 16),
                if (active["isRunning"] == true)
                  FilledButton(onPressed: widget.workspace.pauseFocus, child: const Text("Pause"))
                else
                  FilledButton(onPressed: widget.workspace.resumeFocus, child: const Text("Resume")),
                TextButton(onPressed: widget.workspace.stopFocus, child: const Text("Stop")),
              ] else ...[
                for (final item in focusTypes)
                  ListTile(
                    title: Text(item.$2),
                    subtitle: Text(item.$1 == "custom" ? "$customMinutes min" : "${item.$3} min"),
                    trailing: FilledButton(
                      onPressed: () => widget.workspace.startFocus(item.$1, item.$1 == "custom" ? customMinutes : item.$3),
                      child: const Text("Start"),
                    ),
                  ),
                Slider(
                  min: 5,
                  max: 120,
                  divisions: 23,
                  value: customMinutes.toDouble(),
                  label: "$customMinutes min",
                  onChanged: (value) => setState(() => customMinutes = value.round()),
                ),
              ],
              const SizedBox(height: 16),
              Text("Recent sessions", style: Theme.of(context).textTheme.titleMedium),
              ...widget.workspace.focusSessions.map((raw) {
                final session = asMap(raw);
                return ListTile(
                  title: Text(session["type"] as String? ?? ""),
                  subtitle: Text(session["completed"] == true ? "Completed" : "Stopped"),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}
