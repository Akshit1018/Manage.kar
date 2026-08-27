# Voice bowl on iOS and Android

Research date: 2026-08-24. Sources were scraped with Firecrawl from Apple, Google, Flutter, and review-rejection writeups. This is how the floating bowl actually works, and what we are **not** allowed to do.

## Short answer

The bowl does **not** auto-record, does **not** ask for the microphone at launch, and does **not** bounce the person into Settings by itself.

1. The person opens a note and taps **Record a voice note**.
2. The floating bowl opens in **idle**. No `getUserMedia` / `AVAudioSession` / `RECORD_AUDIO` prompt yet.
3. They tap the bowl (or Record). That tap is the user gesture.
4. iOS shows the system alert with our `NSMicrophoneUsageDescription`. Android 6+ shows the runtime `RECORD_AUDIO` dialog.
5. If they allow it, recording starts in the **foreground** only.
6. If they deny it, they can still type the note. We explain. We do **not** redirect.
7. If the OS will not show the dialog again (`permanentlyDenied` / iOS Settings lock), we show an **Open Settings** button. That tap is optional.

This is not Apple Voice Memos. Leaving the app stops the take. There is no lock-screen recording.

## Two clients, two permission stacks

| Surface | How the bowl records | Native permission module |
| --- | --- | --- |
| Flutter iPhone | `record` → AVAudioSession | `NSMicrophoneUsageDescription` + `permission_handler` |
| Flutter Android | `record` → MediaRecorder | Manifest `RECORD_AUDIO` + runtime request |
| Flutter web (browser test) | `record` → `getUserMedia` / MediaRecorder | **No** Info.plist. Chrome or Safari site setting after a tap |
| Next.js PWA in Safari/Chrome | `navigator.mediaDevices.getUserMedia` | **No** Info.plist / no Play permission. Browser site setting only |

The PWA help copy in `lib/media/microphone.ts` is still honest: a Home Screen website is not Voice Memos and cannot keep recording after you leave the page.

## Dependencies that touch the mic

| Package / API | Role | When it runs |
| --- | --- | --- |
| `permission_handler` | Asks for / reads mic status; can open Settings | After a bowl tap |
| `record` | Encodes AAC/M4A | After mic is granted |
| `audioplayers` | Playback of the take | After Stop, on Play |
| `path_provider` | Temp file for the take | After grant |
| Fastify `POST /api/notes/:id/voice` | Multipart upload once they attach | After save |

We do **not** use Apple Speech (`SFSpeechRecognizer`). That would require a second prompt and `NSSpeechRecognitionUsageDescription`, because audio would go to Apple's speech servers ([Asking Permission to Use Speech Recognition](https://developer.apple.com/documentation/speech/asking-permission-to-use-speech-recognition), [NSSpeechRecognitionUsageDescription](https://developer.apple.com/documentation/bundleresources/information-property-list/nsspeechrecognitionusagedescription)). The bowl's transcription field is typed text.

## Apple rules we are following

[Apple HIG — Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy) says:

- Request microphone only when the person uses the feature, not at launch.
- Supply a specific purpose string. Ours: *Manage.kar records a voice note you tap to start. Audio stays on this device until you save it to your account.*
- Do not ask for data the feature does not need.

[App Store Review Guideline 5.1.1](https://developer.apple.com/app-store/review/guidelines/) requires consent, a clear purpose string, data minimization, and that we respect a refusal (they can still type a note). Paid features must not depend on granting the mic.

[Requesting authorization to capture media](https://developer.apple.com/documentation/avfoundation/requesting-authorization-to-capture-and-save-media) says call the request **before** capture, and only when the user invokes the feature. The system remembers the answer; later changes happen in Settings → Privacy.

Missing `NSMicrophoneUsageDescription` while any linked framework mentions the mic is a common hard reject ([Stack Overflow: NSMicrophoneUsageDescription missing](https://stackoverflow.com/questions/57151820/apple-app-review-process-rejected-due-to-nsmicrophoneusagedescription-missing)). We keep the key even though recording is optional.

## What we were breaking, and fixed

`UIBackgroundModes = audio` was in `Info.plist` even though we only record and play in the foreground.

[Guideline 2.5.4](https://developer.apple.com/app-store/review/guidelines/) limits background modes to their intended purpose. Reviewers reject unused `audio` with: *Your app declares support for audio in the UIBackgroundModes key but did not include features that require persistent audio* ([Ionic forum rejection](https://forum.ionicframework.com/t/backgorund-mode-how-to-prevent-the-app-from-being-rejected-in-the-app-store/125922), [OutSystems thread](https://www.outsystems.com/forums/discussion/34283/app-store-audio-background-issue/), [Zoom DevForum](https://devforum.zoom.us/t/ios-app-was-rejected-from-apple-appstore/37734)).

That key is removed. We are not a background music player.

## Android rules

[Request runtime permissions](https://developer.android.com/training/permissions/requesting) (Android 6+):

- Ask **in context** when the person starts the feature.
- Do not block the app behind an un-cancelable lecture.
- If they deny, degrade: keep the typed note path.
- `RECORD_AUDIO` in the manifest is **not** enough on API 23+; it must be requested at runtime ([Medium: requesting audio permission at runtime](https://medium.com/@ptyagi13/requesting-audio-permission-at-runtime-4f7de6af2ae9)).

Android can grant “only this time”. After the app backgrounds, the OS may revoke it and ask again next time ([Flutter runtime permission writeup](https://medium.com/@devjunmin/flutter-runtime-permission-on-android-and-ios-what-the-os-actually-does-73435894d263)).

## Auto-trigger and Settings redirect

| Action | Allowed? | What we do |
| --- | --- | --- |
| Mic prompt on first app open | No (HIG) | Never |
| Mic prompt when the bowl sheet opens | Weak — they have not tapped Record yet | Never |
| Mic prompt when they tap the bowl | Yes | Yes |
| Auto-open Settings after deny | No — that hijacks the person | Never |
| Button: Open Settings after permanent deny | Yes, after a tap | Yes |

`permission_handler.openAppSettings()` opens the **app** settings page, not a guaranteed Microphone subpage ([SO: opening permissions settings](https://stackoverflow.com/questions/67801354/opening-permissions-settings-for-an-app-on-ios-in-flutter)). After they return, Flutter should re-check status on the next tap, not poll in the background ([permission_handler#247](https://github.com/Baseflow/flutter-permission-handler/issues/247)).

## iOS vs Android in the hand

**iPhone**

1. First tap → system alert with our purpose string → Allow / Don’t Allow.
2. Don’t Allow → we explain. Second tap will not show the alert again once iOS locks it; we then offer Settings.
3. Settings → Manage.kar → Microphone.

**Android**

1. First tap → system runtime dialog.
2. Deny → we explain; another tap may show the dialog again (unless “Don’t ask again” / OEM one-and-done).
3. After permanent deny → Open Settings → App permissions → Microphone.

Neither OS lets us record from the lock screen without a background-audio / CallKit design we do not have.

## What is still not claimed

- No APNs/FCM “hey, start recording”.
- No always-on mic.
- No Speech framework / Siri / dictation entitlement.
- No PWA Info.plist. Safari on iPhone is still a website.
- An IPA still needs a Mac and an Apple developer account to confirm the system alert on a device.
