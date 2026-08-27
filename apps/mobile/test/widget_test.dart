import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:managekar/main.dart";
import "package:managekar/src/api/api_client.dart";
import "package:managekar/src/widgets/voice_orb.dart";

void main() {
  testWidgets("shows Manage.kar auth screen", (tester) async {
    await tester.pumpWidget(ManageKarApp(api: ApiClient(baseUrl: "http://127.0.0.1:9")));
    await tester.pump();
    expect(find.text("Manage.kar"), findsOneWidget);
    expect(find.text("Email"), findsOneWidget);
    expect(find.text("Sign in"), findsOneWidget);
    expect(find.text("Skip to demo login"), findsOneWidget);
  });

  testWidgets("voice orb is on screen and tappable", (tester) async {
    var taps = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Stack(children: [VoiceOrb(onTap: () => taps += 1)]),
        ),
      ),
    );
    await tester.tap(find.byTooltip("Record a voice note"));
    expect(taps, 1);
    expect(find.byIcon(Icons.mic), findsOneWidget);
  });
}
