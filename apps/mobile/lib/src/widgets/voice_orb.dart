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
                color: const Color(0xFF2F6BFF),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2F6BFF).withValues(alpha: 0.4),
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
