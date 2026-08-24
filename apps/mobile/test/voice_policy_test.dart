import "package:flutter_test/flutter_test.dart";
import "package:managekar/src/permissions/voice_policy.dart";

void main() {
  test("desktop or emulator host cannot record", () {
    expect(
      decideVoiceMicAction(nativeDevice: false, permission: MicPermission.granted),
      VoiceMicAction.unsupported,
    );
  });

  test("first tap on a phone requests or records, it does not open Settings", () {
    expect(
      decideVoiceMicAction(nativeDevice: true, permission: MicPermission.denied),
      VoiceMicAction.requestOrRecord,
    );
  });

  test("permanent denial offers Settings after a tap, never auto-redirects", () {
    expect(
      decideVoiceMicAction(nativeDevice: true, permission: MicPermission.permanentlyDenied),
      VoiceMicAction.offerSettings,
    );
    expect(
      decideAfterRequest(MicPermission.permanentlyDenied),
      VoiceMicAction.offerSettings,
    );
  });

  test("a refused system dialog explains, then lets the person type a note", () {
    expect(decideAfterRequest(MicPermission.denied), VoiceMicAction.explainDenied);
  });
}
