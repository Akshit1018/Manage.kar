/// AssistiveTouch-style overlay contract.
///
/// Android may declare `SYSTEM_ALERT_WINDOW`, but this module never reports the
/// overlay as working unless the OS says `Settings.canDrawOverlays` is true.
/// This environment does not verify a live overlay draw.
enum OverlayStatus {
  unsupported,
  notGranted,
  unavailable,
  granted,
}

class OverlayCapability {
  const OverlayCapability({
    this.isAndroid = false,
    this.canDrawOverlays = false,
    this.serviceCompiled = false,
  });

  final bool isAndroid;
  final bool canDrawOverlays;
  final bool serviceCompiled;

  OverlayStatus status() {
    if (!isAndroid) {
      return OverlayStatus.unsupported;
    }
    if (!canDrawOverlays) {
      return OverlayStatus.notGranted;
    }
    if (!serviceCompiled) {
      return OverlayStatus.unavailable;
    }
    return OverlayStatus.granted;
  }

  /// Honest product copy. Never implies the ball is floating over other apps
  /// just because the permission string is in the manifest.
  String honestyCopy() {
    switch (status()) {
      case OverlayStatus.unsupported:
        return "System overlay is Android-only and is not available here.";
      case OverlayStatus.notGranted:
        return "SYSTEM_ALERT_WINDOW is not granted. The ball will not float over other apps.";
      case OverlayStatus.unavailable:
        return "Overlay service is compiled but has not been verified on this device.";
      case OverlayStatus.granted:
        return "SYSTEM_ALERT_WINDOW is granted. The overlay service may start.";
    }
  }
}
