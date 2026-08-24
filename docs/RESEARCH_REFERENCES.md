# Research references

| Reference | Source | Date | What it solves | Reused | Not reused |
| --- | --- | --- | --- | --- | --- |
| Super Productivity persistence | [DeepWiki](https://deepwiki.com/johannesjo/super-productivity/5-data-persistence-and-synchronization) | 2026-08-23 | Local-first store + optional encrypted sync | Honesty that one JSON blob is weaker than IndexedDB | IndexedDB / Dropbox rewrite |
| Super Productivity | [GitHub](https://github.com/johannesjo/super-productivity) MIT | 2026-08-23 | Tasks + time + focus in one local app | One focus surface | Angular port |
| TickTick / Things capture | [Pikvue 2026](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/) | 2026-08-23 | Today as home | Today list + export on phone | Full calendar |
| Weekday habit schedules | Common local habit apps | 2026-08-23 | Frequency must mean something | Bitmask of weekday names | Server cron |
| URL search state | Standard app-router filter pattern | 2026-08-23 | Survive refresh | `?view=&q=` | Saved views |
| Service worker HTML | MDN network-first | 2026-08-23 | Avoid frozen `/` | Network-first `/`, cache-first icons | Full offline shell |
| iPhone 17 CSS viewports | [iOS Ref](https://iosref.com/res), [ios-resolution](https://www.ios-resolution.com/iphone-17-pro-max/) | 2026-08-24 | 402×874 / 440×956 sheets | Full-viewport overlays ≤639px | Native-only size classes |
| Web microphone | [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [web.dev audio](https://web.dev/articles/media-recording-audio) | 2026-08-24 | Voice bowl on notes | User-gesture `getUserMedia` + IDB blob | Background / lock-screen capture |
| iOS native mic string | [NSMicrophoneUsageDescription](https://developer.apple.com/documentation/bundleresources/information-property-list/nsmicrophoneusagedescription) | 2026-08-24 | Document wrapper-only key | Copy in `docs/MOBILE_AND_VOICE.md` | Info.plist in this PWA |
| Android wrapper mic | Android `RECORD_AUDIO` + `WebChromeClient.onPermissionRequest` | 2026-08-24 | Document TWA/WebView path | Copy in `docs/MOBILE_AND_VOICE.md` | Play Store APK |
