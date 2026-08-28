import "dart:async";

import "package:flutter/material.dart";

/// In-app mirror of the future system-wide assistive ball.
/// Tap → Record / Task / Note / Open chats. Long-press → record immediately.
class AssistOrb extends StatefulWidget {
  const AssistOrb({
    super.key,
    required this.onRecord,
    required this.onTask,
    required this.onNote,
    required this.onChats,
  });

  final VoidCallback onRecord;
  final VoidCallback onTask;
  final VoidCallback onNote;
  final VoidCallback onChats;

  @override
  State<AssistOrb> createState() => _AssistOrbState();
}

class _AssistOrbState extends State<AssistOrb> {
  bool showIcons = false;
  Timer? hideTimer;

  @override
  void dispose() {
    hideTimer?.cancel();
    super.dispose();
  }

  void _toggleIcons() {
    hideTimer?.cancel();
    setState(() => showIcons = !showIcons);
    if (showIcons) {
      hideTimer = Timer(const Duration(seconds: 4), () {
        if (mounted) {
          setState(() => showIcons = false);
        }
      });
    }
  }

  void _pick(VoidCallback action) {
    hideTimer?.cancel();
    setState(() => showIcons = false);
    action();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Positioned(
      right: 20,
      bottom: 88,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcons)
            Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(999),
              color: scheme.surface,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      tooltip: "Record",
                      onPressed: () => _pick(widget.onRecord),
                      icon: const Icon(Icons.mic),
                    ),
                    IconButton(
                      tooltip: "Add task",
                      onPressed: () => _pick(widget.onTask),
                      icon: const Icon(Icons.check_box_outlined),
                    ),
                    IconButton(
                      tooltip: "Add note",
                      onPressed: () => _pick(widget.onNote),
                      icon: const Icon(Icons.sticky_note_2_outlined),
                    ),
                    IconButton(
                      tooltip: "Open chats",
                      onPressed: () => _pick(widget.onChats),
                      icon: const Icon(Icons.chat_bubble_outline),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 8),
          Semantics(
            button: true,
            label: "Record, add a task or note, or open chats",
            child: GestureDetector(
              onTap: _toggleIcons,
              onLongPress: () => _pick(widget.onRecord),
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: scheme.primary,
                  boxShadow: [
                    BoxShadow(
                      color: scheme.primary.withValues(alpha: 0.4),
                      blurRadius: 20,
                      spreadRadius: 3,
                    ),
                  ],
                ),
                child: Icon(showIcons ? Icons.close : Icons.add, color: scheme.onPrimary, size: 30),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
