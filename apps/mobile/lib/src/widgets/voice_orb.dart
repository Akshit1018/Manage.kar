import "package:flutter/material.dart";

class VoiceOrb extends StatelessWidget {
  const VoiceOrb({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 20,
      bottom: 88,
      child: Tooltip(
        message: "Record a voice note",
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onTap,
            child: Ink(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Theme.of(context).colorScheme.primary,
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.4),
                    blurRadius: 20,
                    spreadRadius: 3,
                  ),
                ],
              ),
              child: const Icon(Icons.mic, color: Colors.white, size: 32),
            ),
          ),
        ),
      ),
    );
  }
}
