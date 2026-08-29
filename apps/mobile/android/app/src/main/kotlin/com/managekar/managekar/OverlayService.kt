package com.managekar.managekar

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * Documented stub for a future AssistiveTouch-style overlay.
 *
 * This service does not add a window. [onStartCommand] no-ops unless
 * [OverlayCapability.canDrawOverlays] is true, and even then it does not
 * fabricate a floating ball in this slice — drawing has not been verified
 * in the current build environment.
 */
class OverlayService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!OverlayCapability.canDrawOverlays(this)) {
            stopSelf()
            return START_NOT_STICKY
        }
        // Permission is granted, but this stub still does not add a view.
        return START_NOT_STICKY
    }
}
