import "package:flutter_test/flutter_test.dart";
import "package:managekar/main.dart";
import "package:managekar/src/api/api_client.dart";

void main() {
  testWidgets("shows Manage.kar auth screen", (tester) async {
    await tester.pumpWidget(ManageKarApp(api: ApiClient(baseUrl: "http://127.0.0.1:9")));
    await tester.pump();
    expect(find.text("Manage.kar"), findsOneWidget);
    expect(find.text("Email"), findsOneWidget);
    expect(find.text("Sign in"), findsOneWidget);
  });
}
