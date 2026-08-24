import "dart:io" show Platform;

import "package:flutter/foundation.dart";

bool get usesDevicePermissions {
  return !kIsWeb && (Platform.isIOS || Platform.isAndroid);
}
