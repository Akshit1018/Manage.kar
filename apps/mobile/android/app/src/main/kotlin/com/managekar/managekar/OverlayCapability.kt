package com.managekar.managekar

import android.content.Context
import android.provider.Settings

/**
 * AssistiveTouch-style overlay gate.
 *
 * Declaring `SYSTEM_ALERT_WINDOW` in the manifest does not make the overlay
 * work. Callers must check [Settings.canDrawOverlays] and must not start
 * [OverlayService] when this returns false.
 */
object OverlayCapability {
    fun canDrawOverlays(context: Context): Boolean {
        return Settings.canDrawOverlays(context)
    }

    /** Never assume the overlay is live just because the permission is listed. */
    fun assumedWorking(): Boolean {
        return false
    }

    fun shouldStartOverlay(context: Context): Boolean {
        return canDrawOverlays(context)
    }
}
