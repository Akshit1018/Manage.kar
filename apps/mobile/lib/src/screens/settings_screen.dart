import "dart:convert";

import "package:file_picker/file_picker.dart";
import "package:flutter/material.dart";
import "package:managekar/src/io/read_file.dart";
import "package:managekar/src/notifications/local_reminders.dart";
import "package:managekar/src/screens/share_screen.dart";
import "package:managekar/src/state/session.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/platform.dart";
import "package:managekar/src/widgets/forms.dart";
import "package:share_plus/share_plus.dart";

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({
    super.key,
    required this.workspace,
    required this.session,
    required this.reminders,
  });

  final WorkspaceController workspace;
  final SessionController session;
  final LocalReminders reminders;

  Map<String, dynamic> notifications() => workspace.settings?["notifications"] as Map<String, dynamic>? ?? {};
  Map<String, dynamic> appearance() => workspace.settings?["appearance"] as Map<String, dynamic>? ?? {};
  Map<String, dynamic> privacy() => workspace.settings?["privacy"] as Map<String, dynamic>? ?? {};
  Map<String, dynamic> general() => workspace.settings?["general"] as Map<String, dynamic>? ?? {};

  Future<void> patchSettings(Map<String, dynamic> settings) {
    return workspace.saveProfile({"settings": settings});
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: workspace,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(title: const Text("Settings")),
          body: ListView(
            children: [
              ListTile(title: const Text("Account"), subtitle: Text(workspace.user?["email"] as String? ?? "")),
              SwitchListTile(
                title: const Text("Notifications"),
                subtitle: Text(
                  usesDevicePermissions
                      ? "iPhone / Android permission. Reminders are local, not a push server."
                      : "Enable this on an iPhone or Android device.",
                ),
                value: notifications()["enabled"] == true,
                onChanged: (value) async {
                  if (value) {
                    final ok = await reminders.enable(workspace);
                    if (!ok && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Notification permission was not granted.")),
                      );
                    }
                  } else {
                    await patchSettings({"notificationsEnabled": false});
                  }
                },
              ),
              SwitchListTile(
                title: const Text("Task reminders"),
                value: notifications()["taskReminders"] != false,
                onChanged: (value) => patchSettings({"taskReminders": value}),
              ),
              SwitchListTile(
                title: const Text("Habit reminders"),
                value: notifications()["habitReminders"] != false,
                onChanged: (value) => patchSettings({"habitReminders": value}),
              ),
              SwitchListTile(
                title: const Text("Focus breaks"),
                value: notifications()["focusBreaks"] != false,
                onChanged: (value) => patchSettings({"focusBreaks": value}),
              ),
              ListTile(
                title: const Text("Theme"),
                subtitle: Text(appearance()["theme"] as String? ?? "system"),
                onTap: () => _pick(context, "Theme", ["light", "dark", "system"], appearance()["theme"] as String? ?? "system", (value) {
                  return patchSettings({"theme": value});
                }),
              ),
              ListTile(
                title: const Text("Font size"),
                subtitle: Text(appearance()["fontSize"] as String? ?? "medium"),
                onTap: () => _pick(context, "Font size", ["small", "medium", "large"], appearance()["fontSize"] as String? ?? "medium", (value) {
                  return patchSettings({"fontSize": value});
                }),
              ),
              SwitchListTile(
                title: const Text("Animations"),
                value: appearance()["animations"] != false,
                onChanged: (value) => patchSettings({"animations": value}),
              ),
              SwitchListTile(
                title: const Text("Clipboard suggestions"),
                subtitle: const Text("Off by default. The phone does not read the clipboard until you enable this."),
                value: privacy()["clipboardMonitor"] == true,
                onChanged: (value) => patchSettings({"clipboardMonitor": value}),
              ),
              ListTile(
                title: const Text("Week starts on"),
                subtitle: Text(general()["weekStartsOn"] as String? ?? "monday"),
                onTap: () => _pick(context, "Week starts", ["monday", "sunday"], general()["weekStartsOn"] as String? ?? "monday", (value) {
                  return patchSettings({"weekStartsOn": value});
                }),
              ),
              ListTile(
                title: const Text("Date format"),
                subtitle: Text(general()["dateFormat"] as String? ?? "YYYY-MM-DD"),
                onTap: () => _pick(context, "Date format", ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"], general()["dateFormat"] as String? ?? "YYYY-MM-DD", (value) {
                  return patchSettings({"dateFormat": value});
                }),
              ),
              ListTile(
                title: const Text("Share tasks"),
                onTap: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => ShareScreen(workspace: workspace))),
              ),
              ListTile(
                title: const Text("Export backup"),
                onTap: () async {
                  final backup = await workspace.exportBackup();
                  await SharePlus.instance.share(ShareParams(text: const JsonEncoder.withIndent("  ").convert(backup)));
                },
              ),
              ListTile(
                title: const Text("Import backup"),
                subtitle: const Text("Replaces this account's workspace from a Manage.kar JSON file."),
                onTap: () async {
                  final picked = await FilePicker.platform.pickFiles(
                    type: FileType.custom,
                    allowedExtensions: ["json"],
                    withData: true,
                  );
                  final file = picked?.files.single;
                  final bytes = file?.bytes;
                  final path = file?.path;
                  String? raw;
                  if (bytes != null) {
                    raw = utf8.decode(bytes);
                  } else if (path != null) {
                    raw = await readTextFile(path);
                  }
                  if (raw == null) {
                    return;
                  }
                  final decoded = jsonDecode(raw);
                  if (decoded is! Map<String, dynamic>) {
                    return;
                  }
                  if (!context.mounted) {
                    return;
                  }
                  if (await confirmAction(
                    context,
                    title: "Replace workspace",
                    message: "This deletes the current account data and imports the backup.",
                  )) {
                    await workspace.importBackup(decoded);
                  }
                },
              ),
              ListTile(
                title: const Text("Clear workspace"),
                onTap: () async {
                  if (await confirmAction(
                    context,
                    title: "Clear workspace",
                    message: "Tasks, notes, habits, goals, time, and focus will be deleted. The account stays.",
                  )) {
                    await workspace.clearWorkspace();
                  }
                },
              ),
              ListTile(
                title: const Text("Sign out"),
                onTap: () async {
                  await session.logout();
                  if (context.mounted) {
                    Navigator.pop(context);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pick(
    BuildContext context,
    String title,
    List<String> items,
    String current,
    Future<void> Function(String) onPick,
  ) async {
    final next = await showModalBottomSheet<String>(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(title: Text(title)),
              ...items.map((item) => ListTile(
                    title: Text(item),
                    trailing: item == current ? const Icon(Icons.check) : null,
                    onTap: () => Navigator.pop(context, item),
                  )),
            ],
          ),
        );
      },
    );
    if (next != null) {
      await onPick(next);
    }
  }
}
