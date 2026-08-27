import "dart:async";

import "package:audioplayers/audioplayers.dart";
import "package:flutter/foundation.dart";
import "package:flutter/material.dart";
import "package:managekar/src/permissions/app_permissions.dart";
import "package:managekar/src/permissions/voice_policy.dart";
import "package:managekar/src/util/format.dart";
import "package:managekar/src/util/platform.dart";
import "package:path_provider/path_provider.dart";
import "package:record/record.dart";

enum VoicePhase { idle, requesting, recording, paused, review, denied, offerSettings, unsupported }

class VoiceResult {
  const VoiceResult({required this.path, required this.duration, required this.transcription});

  final String path;
  final int duration;
  final String transcription;
}

Future<VoiceResult?> openVoiceBowl(BuildContext context) {
  return showModalBottomSheet<VoiceResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: const Color(0xFF111318),
    builder: (context) => const VoiceBowl(),
  );
}

class VoiceBowl extends StatefulWidget {
  const VoiceBowl({super.key});

  @override
  State<VoiceBowl> createState() => _VoiceBowlState();
}

class _VoiceBowlState extends State<VoiceBowl> {
  final recorder = AudioRecorder();
  final player = AudioPlayer();
  final transcription = TextEditingController();
  final permissions = const AppPermissions();
  VoicePhase phase = VoicePhase.idle;
  int elapsed = 0;
  String? path;
  Timer? ticker;

  @override
  void dispose() {
    ticker?.cancel();
    transcription.dispose();
    unawaited(recorder.stop());
    recorder.dispose();
    player.dispose();
    super.dispose();
  }

  void status(VoicePhase next) {
    if (mounted) {
      setState(() => phase = next);
    }
  }

  Future<void> onBowlTap() async {
    switch (phase) {
      case VoicePhase.idle:
      case VoicePhase.denied:
      case VoicePhase.offerSettings:
      case VoicePhase.unsupported:
        await startFromTap();
      case VoicePhase.requesting:
        return;
      case VoicePhase.recording:
      case VoicePhase.paused:
      case VoicePhase.review:
        return;
    }
  }

  Future<void> startFromTap() async {
    if (!usesDevicePermissions && !usesBrowserMicrophone) {
      status(VoicePhase.unsupported);
      return;
    }
    status(VoicePhase.requesting);
    if (kIsWeb) {
      final allowed = await recorder.hasPermission();
      if (!allowed) {
        status(VoicePhase.denied);
        return;
      }
      await beginRecording();
      return;
    }
    final current = permissions.mapMicrophone(await permissions.microphoneStatus());
    final gate = decideVoiceMicAction(nativeDevice: true, permission: current);
    switch (gate) {
      case VoiceMicAction.unsupported:
        status(VoicePhase.unsupported);
        return;
      case VoiceMicAction.offerSettings:
        status(VoicePhase.offerSettings);
        return;
      case VoiceMicAction.explainDenied:
        status(VoicePhase.denied);
        return;
      case VoiceMicAction.requestOrRecord:
        break;
    }
    final requested = permissions.mapMicrophone(await permissions.requestMicrophone());
    switch (decideAfterRequest(requested)) {
      case VoiceMicAction.offerSettings:
        status(VoicePhase.offerSettings);
        return;
      case VoiceMicAction.explainDenied:
      case VoiceMicAction.unsupported:
        status(VoicePhase.denied);
        return;
      case VoiceMicAction.requestOrRecord:
        await beginRecording();
    }
  }

  Future<void> beginRecording() async {
    final file = kIsWeb
        ? "managekar.webm"
        : "${(await getTemporaryDirectory()).path}/managekar-${DateTime.now().millisecondsSinceEpoch}.m4a";
    final config = RecordConfig(encoder: kIsWeb ? AudioEncoder.opus : AudioEncoder.aacLc);
    await recorder.start(config, path: file);
    ticker?.cancel();
    ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() => elapsed += 1);
      }
    });
    setState(() {
      phase = VoicePhase.recording;
      elapsed = 0;
      path = file;
    });
  }

  Future<void> pauseOrResume() async {
    if (phase == VoicePhase.recording) {
      await recorder.pause();
      ticker?.cancel();
      status(VoicePhase.paused);
      return;
    }
    if (phase == VoicePhase.paused) {
      await recorder.resume();
      ticker = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) {
          setState(() => elapsed += 1);
        }
      });
      status(VoicePhase.recording);
    }
  }

  Future<void> stop() async {
    final stopped = await recorder.stop();
    ticker?.cancel();
    setState(() {
      phase = VoicePhase.review;
      path = stopped ?? path;
    });
  }

  Future<void> play() async {
    if (path == null) {
      return;
    }
    if (kIsWeb) {
      await player.play(UrlSource(path!));
      return;
    }
    await player.play(DeviceFileSource(path!));
  }

  Future<void> openSettingsFromTap() async {
    await permissions.openSettings();
  }

  String copyFor(VoicePhase current) {
    switch (current) {
      case VoicePhase.idle:
        return kIsWeb
            ? "Tap the bowl to record. Chrome or Safari will ask for the microphone after this tap. This is a website, not Voice Memos."
            : "Tap the bowl to record. iPhone and Android will ask for the microphone only after this tap. Recording stays in the foreground.";
      case VoicePhase.requesting:
        return kIsWeb
            ? "Waiting for the browser microphone prompt…"
            : "Waiting for the system microphone prompt…";
      case VoicePhase.recording:
        return kIsWeb
            ? "Recording in this tab. Closing or refreshing the page stops the take."
            : "Recording. This is not Apple Voice Memos. Leaving the app stops the take.";
      case VoicePhase.paused:
        return "Paused. Tap resume or stop.";
      case VoicePhase.review:
        return kIsWeb
            ? "Preview, then attach it to the note. Audio stays in this browser until you save."
            : "Preview, then attach it to the note. Audio stays on this phone until you save.";
      case VoicePhase.denied:
        return kIsWeb
            ? "The browser blocked the microphone. You can still type the note. Allow the mic in the site settings if you want to record."
            : "Microphone is blocked. You can still type the note. Manage.kar will not bounce you into Settings by itself.";
      case VoicePhase.offerSettings:
        return "This phone will not show the microphone prompt again. If you want to record, tap Open Settings, then return here.";
      case VoicePhase.unsupported:
        return "Voice recording needs a real iPhone or Android device. Type the note on this machine.";
    }
  }

  @override
  Widget build(BuildContext context) {
    final live = phase == VoicePhase.recording;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text("Close", style: TextStyle(color: Colors.white70)),
                  ),
                  const Spacer(),
                  const Text("Stays on this device", style: TextStyle(color: Colors.white54)),
                ],
              ),
              const SizedBox(height: 8),
              Text(formatClock(elapsed), style: Theme.of(context).textTheme.displaySmall?.copyWith(color: Colors.white)),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: onBowlTap,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 148,
                  height: 148,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: live ? const Color(0xFFE11D48) : const Color(0xFF2F6BFF),
                    boxShadow: [
                      BoxShadow(
                        color: (live ? const Color(0xFFE11D48) : const Color(0xFF2F6BFF)).withValues(alpha: 0.35),
                        blurRadius: live ? 28 : 16,
                        spreadRadius: live ? 8 : 2,
                      ),
                    ],
                  ),
                  child: Icon(live ? Icons.mic : Icons.mic_none, color: Colors.white, size: 48),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(10, (index) {
                  return AnimatedContainer(
                    duration: Duration(milliseconds: 120 + index * 20),
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    width: 4,
                    height: live ? 8.0 + (index % 4) * 10 : 8,
                    color: Colors.white24,
                  );
                }),
              ),
              const SizedBox(height: 16),
              Text(copyFor(phase), textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70)),
              const SizedBox(height: 16),
              if (phase == VoicePhase.recording || phase == VoicePhase.paused)
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text("Discard")),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: pauseOrResume,
                        child: Text(phase == VoicePhase.paused ? "Resume" : "Pause"),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: FilledButton(onPressed: stop, child: const Text("Stop"))),
                  ],
                ),
              if (phase == VoicePhase.review) ...[
                OutlinedButton.icon(onPressed: play, icon: const Icon(Icons.play_arrow), label: const Text("Play")),
                const SizedBox(height: 8),
                TextField(
                  controller: transcription,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: "Optional transcription",
                    labelStyle: TextStyle(color: Colors.white70),
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: path == null
                      ? null
                      : () => Navigator.pop(
                            context,
                            VoiceResult(path: path!, duration: elapsed, transcription: transcription.text.trim()),
                          ),
                  child: const Text("Attach to note"),
                ),
              ],
              if (phase == VoicePhase.offerSettings)
                FilledButton(onPressed: openSettingsFromTap, child: const Text("Open Settings")),
              if (phase == VoicePhase.idle || phase == VoicePhase.denied || phase == VoicePhase.unsupported)
                FilledButton(onPressed: startFromTap, child: const Text("Record")),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> playVoiceBytes(List<int> bytes) async {
  if (bytes.isEmpty) {
    return;
  }
  final player = AudioPlayer();
  await player.play(BytesSource(Uint8List.fromList(bytes)));
}
