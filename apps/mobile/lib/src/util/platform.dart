import "package:flutter/foundation.dart";
import "package:managekar/src/util/platform_io.dart" if (dart.library.html) "package:managekar/src/util/platform_web.dart";

bool get usesDevicePermissions => !kIsWeb && isIosOrAndroid;

bool get usesBrowserMicrophone => kIsWeb;
