export type MicFailure = "denied" | "unsupported" | "failed"
export type DeliveryKind = "web-pwa" | "ios-wrapper" | "android-wrapper"
export type HelpPlatform = "ios" | "android" | "desktop"

export interface PermissionModules {
  delivery: DeliveryKind
  api: "getUserMedia" | "AVAudioSession"
  iosNativeKey: "NSMicrophoneUsageDescription" | null
  androidNativePermission: "android.permission.RECORD_AUDIO" | null
  androidWebViewHook: "WebChromeClient.onPermissionRequest" | null
  userGestureRequired: boolean
  backgroundRecording: boolean
  lockScreenVoiceMemos: boolean
}

export function classifyGetUserMediaError(error: { name?: string }): MicFailure {
  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "denied"
    case "NotFoundError":
    case "NotSupportedError":
    case "OverconstrainedError":
      return "unsupported"
    default:
      return "failed"
  }
}

const MIME_CANDIDATES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"] as const

export function pickRecorderMimeType(isTypeSupported: (type: string) => boolean): string | undefined {
  return MIME_CANDIDATES.find((type) => isTypeSupported(type))
}

export function permissionModulesForDelivery(delivery: DeliveryKind): PermissionModules {
  switch (delivery) {
    case "web-pwa":
      return {
        delivery,
        api: "getUserMedia",
        iosNativeKey: null,
        androidNativePermission: null,
        androidWebViewHook: null,
        userGestureRequired: true,
        backgroundRecording: false,
        lockScreenVoiceMemos: false,
      }
    case "ios-wrapper":
      return {
        delivery,
        api: "AVAudioSession",
        iosNativeKey: "NSMicrophoneUsageDescription",
        androidNativePermission: null,
        androidWebViewHook: null,
        userGestureRequired: true,
        backgroundRecording: false,
        lockScreenVoiceMemos: false,
      }
    case "android-wrapper":
      return {
        delivery,
        api: "getUserMedia",
        iosNativeKey: null,
        androidNativePermission: "android.permission.RECORD_AUDIO",
        androidWebViewHook: "WebChromeClient.onPermissionRequest",
        userGestureRequired: true,
        backgroundRecording: false,
        lockScreenVoiceMemos: false,
      }
    default: {
      const exhaustive: never = delivery
      throw new Error(`Unknown delivery: ${String(exhaustive)}`)
    }
  }
}

export function microphoneHelpCopy(
  platform: HelpPlatform,
  state: "denied" | "unsupported",
): { title: string; body: string } {
  if (state === "unsupported") {
    return {
      title: "Voice notes need a microphone",
      body:
        platform === "ios"
          ? "This browser cannot record audio. Use Safari on this iPhone, or type the note instead."
          : "This browser cannot record audio. Use Chrome or Safari, or type the note instead.",
    }
  }

  switch (platform) {
    case "ios":
      return {
        title: "Microphone is blocked",
        body: "On iPhone, open Settings → Safari → Microphone and allow this site. If you added Manage.kar to the Home Screen, also check Settings → Manage.kar. Safari asks once after you tap Record. This is a website, not the Voice Memos app, so recording stops if you leave the page.",
      }
    case "android":
      return {
        title: "Microphone is blocked",
        body: "In Chrome, tap the lock icon → Site settings → Microphone → Allow, then tap Record again. This is a website, not a Play Store app, so the OS will not keep recording after you leave the tab.",
      }
    case "desktop":
      return {
        title: "Microphone is blocked",
        body: "Allow the microphone for this site in the browser prompt or site settings, then tap Record again.",
      }
    default: {
      const exhaustive: never = platform
      throw new Error(`Unknown platform: ${String(exhaustive)}`)
    }
  }
}

export function detectHelpPlatform(userAgent: string): HelpPlatform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "ios"
  }
  if (/Android/i.test(userAgent)) {
    return "android"
  }
  return "desktop"
}
