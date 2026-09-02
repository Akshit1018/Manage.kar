import "dart:async";

import "package:flutter/material.dart";
import "package:managekar/src/widgets/assist_orb_geometry.dart";
import "package:shared_preferences/shared_preferences.dart";

/// In-app mirror of the future system-wide assistive ball.
/// Tap → Record / Task / Note / Open chats. Long-press → record immediately.
class AssistOrb extends StatefulWidget {
  const AssistOrb({
    super.key,
    required this.onRecord,
    required this.onTask,
    required this.onNote,
    required this.onChats,
    this.visible = true,
    this.stageHome = false,
    this.prefs,
  });

  final VoidCallback onRecord;
  final VoidCallback onTask;
  final VoidCallback onNote;
  final VoidCallback onChats;
  final bool visible;
  final bool stageHome;
  final SharedPreferences? prefs;

  @override
  State<AssistOrb> createState() => _AssistOrbState();
}

class _AssistOrbState extends State<AssistOrb> {
  bool showIcons = false;
  bool dragging = false;
  Timer? hideTimer;
  Offset? position;
  Offset? saved;
  SharedPreferences? prefs;
  Offset dragOrigin = Offset.zero;
  Offset dragStart = Offset.zero;
  bool moved = false;

  @override
  void initState() {
    super.initState();
    _hydrate();
  }

  @override
  void dispose() {
    hideTimer?.cancel();
    super.dispose();
  }

  Future<void> _hydrate() async {
    final store = widget.prefs ?? await SharedPreferences.getInstance();
    if (!mounted) {
      return;
    }
    setState(() {
      prefs = store;
      saved = parseSavedOrbPosition(store.getString(kOrbPositionKey));
    });
  }

  Future<void> _persist(Offset next) async {
    final store = prefs ?? widget.prefs ?? await SharedPreferences.getInstance();
    await store.setString(kOrbPositionKey, encodeOrbPosition(next));
    prefs = store;
  }

  Offset _resolve(Size viewport, EdgeInsets padding, {double size = kOrbSize}) {
    if (position != null) {
      return clampOrbPosition(position!, viewport, padding: padding, size: size);
    }
    if (saved != null) {
      return clampOrbPosition(saved!, viewport, padding: padding, size: size);
    }
    return defaultOrbPosition(viewport, padding: padding);
  }

  void _toggleIcons() {
    hideTimer?.cancel();
    setState(() => showIcons = !showIcons);
    if (showIcons) {
      hideTimer = Timer(const Duration(seconds: 3), () {
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
    if (!widget.visible) {
      return const SizedBox.shrink();
    }
    final media = MediaQuery.of(context);
    final viewport = media.size;
    final padding = media.padding;
    final size = widget.stageHome ? kHomeOrbSize : kOrbSize;
    final orb = widget.stageHome && !dragging
        ? homeOrbPosition(viewport, padding: padding, size: size)
        : _resolve(viewport, padding, size: size);
    final tray = showIcons && !dragging
        ? iconBarPosition(orb, viewport, padding: padding, size: size)
        : null;
    final scheme = Theme.of(context).colorScheme;
    return Positioned.fill(
      child: Stack(
        children: [
          if (tray != null)
            Positioned(
              left: tray.dx,
              top: tray.dy,
              child: Material(
                elevation: 8,
                borderRadius: BorderRadius.circular(8),
                color: scheme.surface,
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _OrbAction(
                        tooltip: "Record",
                        icon: Icons.mic,
                        onPressed: () => _pick(widget.onRecord),
                      ),
                      const SizedBox(width: 8),
                      _OrbAction(
                        tooltip: "Add task",
                        icon: Icons.check_box_outlined,
                        onPressed: () => _pick(widget.onTask),
                      ),
                      const SizedBox(width: 8),
                      _OrbAction(
                        tooltip: "Add note",
                        icon: Icons.sticky_note_2_outlined,
                        onPressed: () => _pick(widget.onNote),
                      ),
                      const SizedBox(width: 8),
                      _OrbAction(
                        tooltip: "Open chats",
                        icon: Icons.chat_bubble_outline,
                        onPressed: () => _pick(widget.onChats),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          Positioned(
            left: orb.dx,
            top: orb.dy,
            child: Semantics(
              button: true,
              label: "Record, add a task or note, or open chats",
              child: GestureDetector(
                key: const Key("assist-orb"),
                onTap: () {
                  if (!moved) {
                    _toggleIcons();
                  }
                },
                onLongPress: () {
                  if (!moved) {
                    _pick(widget.onRecord);
                  }
                },
                onPanStart: (details) {
                  hideTimer?.cancel();
                  setState(() {
                    dragging = true;
                    showIcons = false;
                    moved = false;
                    dragOrigin = orb;
                    dragStart = details.globalPosition;
                    position = orb;
                  });
                },
                onPanUpdate: (details) {
                  final next = Offset(
                    dragOrigin.dx + details.globalPosition.dx - dragStart.dx,
                    dragOrigin.dy + details.globalPosition.dy - dragStart.dy,
                  );
                  final delta = next - dragOrigin;
                  if (!moved && delta.distance < 10) {
                    return;
                  }
                  setState(() {
                    moved = true;
                    position = clampOrbPosition(next, viewport, padding: padding, size: size);
                  });
                },
                onPanEnd: (_) {
                  final live = position ?? orb;
                  final snapped = widget.stageHome
                      ? homeOrbPosition(viewport, padding: padding, size: size)
                      : snapOrbToEdge(live, viewport, padding: padding, size: size);
                  setState(() {
                    dragging = false;
                    position = widget.stageHome ? null : snapped;
                  });
                  if (moved && !widget.stageHome) {
                    _persist(snapped);
                  }
                },
                onPanCancel: () {
                  setState(() => dragging = false);
                },
                child: Container(
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      center: const Alignment(-0.35, -0.45),
                      radius: 0.95,
                      colors: [
                        Color.lerp(scheme.primary, Colors.white, 0.45) ?? scheme.primary,
                        scheme.primary,
                        Color.lerp(scheme.primary, Colors.black, 0.35) ?? scheme.primary,
                      ],
                      stops: const [0.0, 0.45, 1.0],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: scheme.primary.withValues(alpha: 0.4),
                        blurRadius: 20,
                        spreadRadius: 3,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Container(
                      width: size * 0.28,
                      height: size * 0.28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrbAction extends StatelessWidget {
  const _OrbAction({required this.tooltip, required this.icon, required this.onPressed});

  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 44,
      height: 44,
      child: IconButton(
        tooltip: tooltip,
        padding: EdgeInsets.zero,
        onPressed: onPressed,
        icon: Icon(icon, size: 20),
      ),
    );
  }
}
