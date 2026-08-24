import "dart:convert";

import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/format.dart";
import "package:share_plus/share_plus.dart";

class ShareScreen extends StatefulWidget {
  const ShareScreen({super.key, required this.workspace});

  final WorkspaceController workspace;

  @override
  State<ShareScreen> createState() => _ShareScreenState();
}

class _ShareScreenState extends State<ShareScreen> {
  final selected = <String>{};
  var message = "";

  @override
  void initState() {
    super.initState();
    selected.addAll(
      widget.workspace.tasks.whereType<Map>().map(asMap).map((item) => item["id"] as String? ?? ""),
    );
    selected.remove("");
  }

  List<Map<String, dynamic>> chosen() {
    return widget.workspace.tasks
        .whereType<Map>()
        .map(asMap)
        .where((item) => selected.contains(item["id"]))
        .toList();
  }

  String asText() {
    final tasks = chosen();
    final lines = [
      "Manage.kar tasks from ${widget.workspace.user?["name"] ?? "me"}",
      if (message.trim().isNotEmpty) message.trim(),
      "",
      ...tasks.map((item) {
        final mark = item["completed"] == true ? "[x]" : "[ ]";
        return "$mark ${item["title"]} · ${item["dueDate"]} · ${item["priority"]}";
      }),
    ];
    return lines.join("\n");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Share")),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            "WhatsApp and the system share sheet send plain text. This is not the password-protected web link.",
          ),
          const SizedBox(height: 12),
          TextField(
            decoration: const InputDecoration(labelText: "Optional message"),
            onChanged: (value) => message = value,
          ),
          const SizedBox(height: 12),
          ...widget.workspace.tasks.map((raw) {
            final task = asMap(raw);
            final id = task["id"] as String? ?? "";
            return CheckboxListTile(
              title: Text(task["title"] as String? ?? ""),
              subtitle: Text("${task["dueDate"]} · ${task["priority"]}"),
              value: selected.contains(id),
              onChanged: (value) => setState(() {
                if (value == true) {
                  selected.add(id);
                } else {
                  selected.remove(id);
                }
              }),
            );
          }),
          FilledButton(
            onPressed: chosen().isEmpty ? null : () => SharePlus.instance.share(ShareParams(text: asText())),
            child: const Text("Share as text"),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: chosen().isEmpty
                ? null
                : () async {
                    await Clipboard.setData(ClipboardData(text: asText()));
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Copied task list.")));
                    }
                  },
            child: const Text("Copy"),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () async {
              final backup = await widget.workspace.exportBackup();
              await SharePlus.instance.share(ShareParams(text: const JsonEncoder.withIndent("  ").convert(backup)));
            },
            child: const Text("Export JSON backup"),
          ),
        ],
      ),
    );
  }
}
