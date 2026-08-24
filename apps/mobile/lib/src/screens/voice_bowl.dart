import "dart:async";
import "dart:io";

import "package:audioplayers/audioplayers.dart";
import "package:flutter/material.dart";
import "package:managekar/src/permissions/app_permissions.dart";
import "package:managekar/src/util/format.dart";
import "package:managekar/src/util/platform.dart";
import "package:path_provider/path_provider.dart";
import "package:permission_handler/permission_handler.dart";
import "package:record/record.dart";

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
  bool recording = false;
  int elapsed = 0;
  String? path;
  Timer? ticker;

  @override
  void dispose() {
    ticker?.cancel();
    transcription.dispose();
    recorder.dispose();
    player.dispose();
    super.dispose();
  }

  Future<void> start() async {
    if (!usesDevicePermissions) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Voice recording needs an iPhone or Android device.")),
        );
      }
      return;
    }
    final status = await const AppPermissions().requestMicrophone();
    if (status != PermissionStatus.granted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Microphone permission is required to record a voice note.")),
        );
      }
      return;
    }
    final dir = await getTemporaryDirectory();
    final file = "${dir.path}/managekar-${DateTime.now().millisecondsSinceEpoch}.m4a";
    await recorder.start(const RecordConfig(encoder: AudioEncoder.aacLc), path: file);
    ticker?.cancel();
    ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() => elapsed += 1);
      }
    });
    setState(() {
      recording = true;
      elapsed = 0;
      path = file;
    });
  }

  Future<void> stop() async {
    final stopped = await recorder.stop();
    ticker?.cancel();
    setState(() {
      recording = false;
      path = stopped ?? path;
    });
  }

  Future<void> play() async {
    if (path == null) {
      return;
    }
    await player.play(DeviceFileSource(path!));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text("Voice note", style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              const Text("Tap to record. Audio stays on this phone until you save the note to your account."),
              const SizedBox(height: 24),
              Text(formatClock(elapsed), style: Theme.of(context).textTheme.displaySmall),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  FilledButton.icon(
                    onPressed: recording ? stop : start,
                    icon: Icon(recording ? Icons.stop : Icons.mic),
                    label: Text(recording ? "Stop" : "Record"),
                  ),
                  if (path != null && !recording) ...[
                    const SizedBox(width: 12),
                    OutlinedButton.icon(onPressed: play, icon: const Icon(Icons.play_arrow), label: const Text("Play")),
                  ],
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: transcription,
                decoration: const InputDecoration(labelText: "Optional transcription"),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: path == null || recording
                    ? null
                    : () => Navigator.pop(
                          context,
                          VoiceResult(path: path!, duration: elapsed, transcription: transcription.text.trim()),
                        ),
                child: const Text("Attach to note"),
              ),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
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
  final dir = await getTemporaryDirectory();
  final file = File("${dir.path}/managekar-play-${DateTime.now().millisecondsSinceEpoch}.m4a");
  await file.writeAsBytes(bytes, flush: true);
  final player = AudioPlayer();
  await player.play(DeviceFileSource(file.path));
}
