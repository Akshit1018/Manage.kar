import "package:flutter_test/flutter_test.dart";
import "package:managekar/src/overlay/overlay_capability.dart";

void main() {
  test("does not claim SYSTEM_ALERT_WINDOW is working without an OS grant", () {
    const capability = OverlayCapability();
    expect(capability.status(), OverlayStatus.unsupported);
    expect(capability.honestyCopy(), contains("Android-only"));
    expect(capability.honestyCopy(), isNot(contains("is working")));

    const androidDenied = OverlayCapability(isAndroid: true, canDrawOverlays: false);
    expect(androidDenied.status(), OverlayStatus.notGranted);
    expect(androidDenied.honestyCopy(), contains("SYSTEM_ALERT_WINDOW is not granted"));

    const compiledOnly = OverlayCapability(isAndroid: true, canDrawOverlays: true, serviceCompiled: false);
    expect(compiledOnly.status(), OverlayStatus.unavailable);
  });
}
