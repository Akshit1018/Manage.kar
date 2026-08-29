import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:managekar/main.dart";
import "package:managekar/src/api/api_client.dart";
import "package:managekar/src/screens/chats_screen.dart";
import "package:managekar/src/state/dialer.dart";
import "package:managekar/src/widgets/assist_orb.dart";
import "package:shared_preferences/shared_preferences.dart";

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets("shows Manage.kar auth screen", (tester) async {
    await tester.pumpWidget(ManageKarApp(api: ApiClient(baseUrl: "http://127.0.0.1:9")));
    await tester.pump();
    expect(find.text("Manage.kar"), findsOneWidget);
    expect(find.text("Email"), findsOneWidget);
    expect(find.text("Sign in"), findsOneWidget);
    expect(find.text("Skip to demo login"), findsOneWidget);
  });

  testWidgets("orb tap reveals Record, Task, Note, and Chats actions", (tester) async {
    var chats = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Stack(
            children: [
              AssistOrb(
                onRecord: () {},
                onTask: () {},
                onNote: () {},
                onChats: () => chats += 1,
              ),
            ],
          ),
        ),
      ),
    );
    await tester.tap(find.bySemanticsLabel("Record, add a task or note, or open chats"));
    await tester.pump();
    expect(find.byTooltip("Record"), findsOneWidget);
    expect(find.byTooltip("Add task"), findsOneWidget);
    expect(find.byTooltip("Add note"), findsOneWidget);
    expect(find.byTooltip("Open chats"), findsOneWidget);

    await tester.tap(find.byTooltip("Open chats"));
    await tester.pump();
    expect(chats, 1);
    expect(find.byTooltip("Record"), findsNothing);
  });

  testWidgets("orb long-press starts recording immediately", (tester) async {
    var records = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Stack(
            children: [
              AssistOrb(
                onRecord: () => records += 1,
                onTask: () {},
                onNote: () {},
                onChats: () {},
              ),
            ],
          ),
        ),
      ),
    );
    await tester.longPress(find.bySemanticsLabel("Record, add a task or note, or open chats"));
    await tester.pump();
    expect(records, 1);
  });

  testWidgets("chats tab lists demo machines and never claims delivery", (tester) async {
    final dialer = DialerController();
    await tester.pumpWidget(MaterialApp(home: ChatsTab(dialer: dialer)));
    await tester.pump();
    expect(find.text("New chat"), findsWidgets);
    expect(find.text("Hermes · local"), findsOneWidget);
    expect(find.text("Hermes · VPS"), findsOneWidget);
    expect(find.text("Research bot"), findsOneWidget);
    expect(find.text("Demo"), findsNWidgets(3));
    expect(find.text("not paired"), findsWidgets);
    expect(find.text("online"), findsNothing);
    expect(find.text("reachable"), findsNothing);

    await tester.tap(find.text("Hermes · local"));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), "status update please");
    await tester.tap(find.byTooltip("Send message"));
    await tester.pumpAndSettle();
    // Exactly one bubble; the input must have been cleared.
    expect(find.text("status update please"), findsOneWidget);
    expect(find.textContaining("will send after pairing"), findsWidgets);
    expect(find.text("Sent"), findsNothing);
    expect(find.text("online"), findsNothing);
    expect(find.text("not paired"), findsWidgets);
    expect(find.text("reachable"), findsNothing);
  });

  test("presence words match the web companion", () {
    expect(presenceLabel("active"), "reachable");
    expect(presenceLabel("idle"), "asleep");
    expect(presenceLabel("offline"), "unreachable");
    expect(presenceLabel("active", "demo"), "not paired");
    expect(presenceLabel("offline", "demo"), "not paired");
    expect(presenceColor("active", "demo"), isNot(const Color(0xFF10B981)));
  });
}
