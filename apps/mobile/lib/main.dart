import "package:flutter/foundation.dart";
import "package:flutter/material.dart";
import "package:flutter/semantics.dart";
import "package:managekar/src/api/api_client.dart";
import "package:managekar/src/notifications/local_reminders.dart";
import "package:managekar/src/screens/auth_screen.dart";
import "package:managekar/src/screens/shell_screen.dart";
import "package:managekar/src/state/session.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/theme/app_theme.dart";

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ManageKarApp(
      api: ApiClient(),
      webSemantics: kIsWeb ? SemanticsBinding.instance.ensureSemantics() : null,
    ),
  );
}

class ManageKarApp extends StatefulWidget {
  const ManageKarApp({super.key, required this.api, this.reminders, this.webSemantics});

  final ApiClient api;
  final LocalReminders? reminders;
  final SemanticsHandle? webSemantics;

  @override
  State<ManageKarApp> createState() => _ManageKarAppState();
}

class _ManageKarAppState extends State<ManageKarApp> {
  late final SessionController session = SessionController(widget.api);
  late final WorkspaceController workspace = WorkspaceController(widget.api);
  late final LocalReminders reminders = widget.reminders ?? LocalReminders();
  bool authed = false;

  @override
  void initState() {
    super.initState();
    session.addListener(_syncAuth);
    workspace.addListener(_onWorkspace);
    session.restore();
  }

  void _syncAuth() {
    final next = session.user != null;
    if (next != authed) {
      setState(() => authed = next);
    }
  }

  void _onWorkspace() {
    setState(() {});
  }

  @override
  void dispose() {
    session.removeListener(_syncAuth);
    workspace.removeListener(_onWorkspace);
    session.dispose();
    workspace.dispose();
    widget.webSemantics?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appearance = workspace.settings?["appearance"] as Map<String, dynamic>? ?? {};
    final fontSize = appearance["fontSize"] as String? ?? "medium";
    return MaterialApp(
      title: "Manage.kar",
      theme: buildAppTheme(fontSize: fontSize),
      darkTheme: buildAppTheme(brightness: Brightness.dark, fontSize: fontSize),
      themeMode: themeModeFrom(appearance["theme"] as String?),
      home: authed
          ? ShellScreen(session: session, workspace: workspace, reminders: reminders)
          : AuthScreen(session: session, onAuthed: () => setState(() => authed = true)),
    );
  }
}
