import "package:flutter_local_notifications/flutter_local_notifications.dart";
import "package:managekar/src/permissions/app_permissions.dart";
import "package:managekar/src/state/workspace.dart";
import "package:managekar/src/util/platform.dart";
import "package:permission_handler/permission_handler.dart";

class LocalReminders {
  LocalReminders({FlutterLocalNotificationsPlugin? plugin})
      : plugin = plugin ?? FlutterLocalNotificationsPlugin();

  final FlutterLocalNotificationsPlugin plugin;
  bool ready = false;

  Future<bool> enable(WorkspaceController workspace) async {
    if (!usesDevicePermissions) {
      return false;
    }
    final status = await const AppPermissions().requestNotifications();
    if (status != PermissionStatus.granted) {
      return false;
    }
    if (!ready) {
      const android = AndroidInitializationSettings("@mipmap/ic_launcher");
      const ios = DarwinInitializationSettings();
      await plugin.initialize(const InitializationSettings(android: android, iOS: ios));
      ready = true;
    }
    await workspace.saveProfile({
      "settings": {"notificationsEnabled": true},
    });
    await sync(workspace);
    return true;
  }

  Future<void> sync(WorkspaceController workspace) async {
    if (!usesDevicePermissions || workspace.settings?["notifications"]?["enabled"] != true) {
      return;
    }
    if (!ready) {
      return;
    }
    await plugin.cancelAll();
    var id = 1;
    if (workspace.settings?["notifications"]?["taskReminders"] == true) {
      for (final raw in workspace.dueToday()) {
        await plugin.show(
          id++,
          "Task due today",
          raw["title"] as String? ?? "Task",
          const NotificationDetails(
            android: AndroidNotificationDetails("tasks", "Tasks"),
            iOS: DarwinNotificationDetails(),
          ),
        );
      }
    }
  }
}
