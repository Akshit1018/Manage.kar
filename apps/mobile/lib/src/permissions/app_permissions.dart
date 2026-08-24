import "package:managekar/src/permissions/voice_policy.dart";
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

  Future<PermissionStatus> microphoneStatus() {
    return Permission.microphone.status;
  }

  Future<PermissionStatus> requestNotifications() {
    return Permission.notification.request();
  }

  Future<bool> openSettings() {
    return openAppSettings();
  }

  MicPermission mapMicrophone(PermissionStatus status) {
    switch (status) {
      case PermissionStatus.granted:
        return MicPermission.granted;
      case PermissionStatus.limited:
        return MicPermission.limited;
      case PermissionStatus.denied:
        return MicPermission.denied;
      case PermissionStatus.permanentlyDenied:
        return MicPermission.permanentlyDenied;
      case PermissionStatus.restricted:
        return MicPermission.restricted;
      case PermissionStatus.provisional:
        return MicPermission.limited;
    }
  }
}
