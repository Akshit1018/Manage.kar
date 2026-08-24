import "package:permission_handler/permission_handler.dart";

/// iOS/Android permission modules used by Manage.kar.
///
/// iOS: Info.plist `NSMicrophoneUsageDescription`, `NSUserNotificationsUsageDescription`.
/// Android: `RECORD_AUDIO`, `POST_NOTIFICATIONS`.
class AppPermissions {
  const AppPermissions();

  Future<PermissionStatus> requestMicrophone() {
    return Permission.microphone.request();
  }

  Future<PermissionStatus> requestNotifications() {
    return Permission.notification.request();
  }

  Future<bool> hasMicrophone() async {
    return Permission.microphone.isGranted;
  }
}
