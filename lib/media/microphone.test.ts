import { describe, expect, it } from "vitest"
import {
  classifyGetUserMediaError,
  microphoneHelpCopy,
  permissionModulesForDelivery,
  pickRecorderMimeType,
} from "./microphone"

describe("microphone capability for this web app", () => {
  it("maps browser errors without inventing native entitlements", () => {
    expect(classifyGetUserMediaError({ name: "NotAllowedError" })).toBe("denied")
    expect(classifyGetUserMediaError({ name: "NotFoundError" })).toBe("unsupported")
    expect(classifyGetUserMediaError({ name: "NotSupportedError" })).toBe("unsupported")
    expect(classifyGetUserMediaError({ name: "AbortError" })).toBe("failed")
  })

  it("prefers mp4 on Safari-class recorders and webm when that is all that exists", () => {
    expect(pickRecorderMimeType((type) => type === "audio/mp4")).toBe("audio/mp4")
    expect(pickRecorderMimeType((type) => type.startsWith("audio/webm"))).toBe("audio/webm;codecs=opus")
    expect(pickRecorderMimeType(() => false)).toBeUndefined()
  })

  it("documents the real permission module for each delivery, not a fake Info.plist on the PWA", () => {
    const web = permissionModulesForDelivery("web-pwa")
    expect(web.api).toBe("getUserMedia")
    expect(web.iosNativeKey).toBeNull()
    expect(web.androidNativePermission).toBeNull()
    expect(web.backgroundRecording).toBe(false)
    expect(web.lockScreenVoiceMemos).toBe(false)
    expect(web.userGestureRequired).toBe(true)

    const ios = permissionModulesForDelivery("ios-wrapper")
    expect(ios.iosNativeKey).toBe("NSMicrophoneUsageDescription")
    expect(ios.api).toBe("AVAudioSession")

    const android = permissionModulesForDelivery("android-wrapper")
    expect(android.androidNativePermission).toBe("android.permission.RECORD_AUDIO")
    expect(android.androidWebViewHook).toBe("WebChromeClient.onPermissionRequest")
  })

  it("tells iPhone users to use Safari site settings, not a native Voice Memos entitlement", () => {
    const denied = microphoneHelpCopy("ios", "denied")
    expect(denied.title).toMatch(/microphone/i)
    expect(denied.body).toMatch(/Settings/)
    expect(denied.body).toMatch(/Safari/)
    expect(denied.body).not.toMatch(/Info\.plist/)

    const android = microphoneHelpCopy("android", "denied")
    expect(android.body).toMatch(/Site settings|Chrome/i)
    expect(android.body).not.toMatch(/RECORD_AUDIO/)
  })
})
