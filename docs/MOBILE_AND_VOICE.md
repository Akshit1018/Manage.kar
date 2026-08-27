# Mobile sheets and voice notes

What this web app can do on an iPhone 17 through iPhone 17 Pro Max, and what it cannot pretend to be.

## Why popups used to sit off-screen

Tapping a note or task opened a desktop-centered card (`top: 50%` + `translate(-50%, -50%)`). `body` also had `backdrop-filter`, which makes `position: fixed` attach to the document instead of the visual viewport. After scrolling a list, the sheet appeared above or below the phone screen, so you had to scroll the page to find it.

Every overlay now:

- Portals to `document.body` with `position: fixed; inset: 0; height: 100dvh / 100svh`
- Locks body scroll while open
- Fills the visual viewport on widths under 640px (iPhone 17 family included)
- Respects `viewport-fit=cover` and `env(safe-area-inset-*)`
- Uses 44px minimum touch targets
- Lifts with `--mk-keyboard` from `visualViewport` so the footer stays above the iOS keyboard
- Settings, profile, focus, goals, time, counts, clipboard, and confirms use the same sheet — not `window.confirm` and not a 70vh Radix card

## iPhone 17 family CSS viewports

Portrait logical points used for layout checks:

| Device | CSS viewport | Scale |
| --- | --- | --- |
| iPhone 17 / 17 Pro | 402 × 874 | 3× |
| iPhone Air | 420 × 912 | 3× |
| iPhone 17 Pro Max | 440 × 956 | 3× |
| Older 6.1" class (14 / 16e) | 390 × 844 | 3× |

Sources: [iOS Ref resolutions](https://iosref.com/res), [iOS Resolution — iPhone 17 Pro Max](https://www.ios-resolution.com/iphone-17-pro-max/), [Engineered.at iPhone 17 screen sizes](https://engineered.at/articles/iphone-17-screen-sizes).

## How the notepad voice path works

1. Open a note and tap **Record a voice note**, or long-press the floating orb. A short tap on the orb shows the small Task / Note / Focus icons.
2. The recorder is a full-screen dark sheet with a large red bowl, elapsed clock, and stop/pause/discard — Voice Memos-shaped, not a tiny card on the list.
3. A tap calls `navigator.mediaDevices.getUserMedia({ audio: true })`. Safari or Chrome shows the site microphone prompt.
4. `MediaRecorder` writes audio. Safari-class browsers prefer `audio/mp4`; Chromium prefers `audio/webm`.
5. Optional live transcription runs only when the Web Speech API exists (often Chrome/Android, not iOS Safari).
6. On save, words go into the note. Audio is stored in IndexedDB under `idb:voice:{id}`, not in the workspace JSON.

## Permission modules — honest split

This product is a **website / PWA**. It cannot install native entitlement files.

| Delivery | What actually asks for the mic | What we do **not** ship |
| --- | --- | --- |
| iOS Safari or Add to Home Screen | Browser `getUserMedia` after a user tap. User later changes it in Settings → Safari → Microphone (or Settings → Manage.kar for a home-screen icon). | `NSMicrophoneUsageDescription` in an Info.plist. That key exists only if someone wraps this site in a native WKWebView / Capacitor / PWABuilder iOS app. |
| Android Chrome or installed PWA | Browser `getUserMedia`. User later changes it in the lock icon → Site settings → Microphone. | `android.permission.RECORD_AUDIO` in an APK/TWA manifest, and `WebChromeClient.onPermissionRequest` inside a custom WebView. |
| Future iOS wrapper | Info.plist `NSMicrophoneUsageDescription` plus `AVAudioSession`. See [Apple — NSMicrophoneUsageDescription](https://developer.apple.com/documentation/bundleresources/information-property-list/nsmicrophoneusagedescription). | Not in this repo. |
| Future Android wrapper | Manifest `RECORD_AUDIO` / `MODIFY_AUDIO_SETTINGS`, runtime permission, and `onPermissionRequest` for WebView audio capture. See [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) and [web.dev recording audio](https://web.dev/articles/media-recording-audio). | Not in this repo. |

The bowl cannot keep recording after Safari is killed, cannot appear as the system Voice Memos app, and cannot show on the lock screen. Those need a native app.

Suggested Info.plist string **if** a native wrapper is added later:

`Manage.kar records a voice note you tap to start. Audio stays on this device unless you export it.`

Suggested Android rationale **if** a wrapper is added later:

`Microphone is used only when you tap Record on a note.`
