import "package:flutter/material.dart";
import "package:managekar/src/api/api_client.dart";
import "package:managekar/src/screens/auth_screen.dart";
import "package:managekar/src/screens/shell_screen.dart";
import "package:managekar/src/state/session.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/theme/app_theme.dart";

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(ManageKarApp(api: ApiClient()));
}

class ManageKarApp extends StatefulWidget {
  const ManageKarApp({super.key, required this.api});

  final ApiClient api;

  @override
  State<ManageKarApp> createState() => _ManageKarAppState();
}

class _ManageKarAppState extends State<ManageKarApp> {
  late final SessionController session = SessionController(widget.api);
  late final WorkspaceController workspace = WorkspaceController(widget.api);
  bool ready = true;
  bool authed = false;

  @override
  void initState() {
    super.initState();
    session.addListener(_syncAuth);
    session.restore();
  }

  void _syncAuth() {
    final next = session.user != null;
    if (next != authed) {
      setState(() => authed = next);
    }
  }

  @override
  void dispose() {
    session.removeListener(_syncAuth);
    session.dispose();
    workspace.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Manage.kar",
      theme: buildAppTheme(),
      home: !ready
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : authed
              ? ShellScreen(session: session, workspace: workspace)
              : AuthScreen(session: session, onAuthed: () => setState(() => authed = true)),
    );
  }
}
