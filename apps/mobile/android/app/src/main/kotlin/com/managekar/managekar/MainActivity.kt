package com.managekar.managekar

import io.flutter.embedding.android.FlutterActivity

/**
 * Does not start [OverlayService]. The assistive ball stays in-app until
 * [OverlayCapability.canDrawOverlays] is true and a later slice draws a window.
 */
class MainActivity : FlutterActivity()
