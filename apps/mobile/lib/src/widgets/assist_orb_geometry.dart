import "dart:convert";
import "dart:ui" show Offset, Rect, Size;

import "package:flutter/painting.dart";

const kOrbSize = 56.0;
const kHomeOrbSize = 120.0;
const kHomeBallStageMin = 168.0;
const kOrbInset = 8.0;
const kOrbBottomReserve = 76.0;
const kOrbLongPressMs = 500;
const kOrbPositionKey = "assist-orb-position";

/// Width of the revealed icon bar: four 44px icons, three 8px gaps, 8px padding each side.
const kIconBarWidth = 4 * 44.0 + 3 * 8.0 + 16.0;
const kIconBarHeight = 60.0;

/// Chats is the fourth shell tab (0 Home, 1 Tasks, 2 Notes, 3 Chats, 4 Habits).
bool orbVisibleOnTab(int index) => index != 3;

bool shouldStageHomeBall(int tabIndex, double width) => tabIndex == 0 && width < 1024;

Offset homeOrbPositionFromRect(Rect rect, {double size = kHomeOrbSize}) {
  return Offset(rect.left + (rect.width - size) / 2, rect.top + (rect.height - size) / 2);
}

Offset homeOrbPosition(
  Size viewport, {
  EdgeInsets padding = EdgeInsets.zero,
  double size = kHomeOrbSize,
}) {
  final left = padding.left + kOrbInset;
  final top = padding.top + kOrbInset;
  final usableWidth = viewport.width - left - padding.right - kOrbInset;
  final usableHeight = viewport.height - top - padding.bottom - kOrbBottomReserve;
  return clampOrbPosition(
    Offset(left + (usableWidth - size) / 2, top + (usableHeight - size) / 2),
    viewport,
    padding: padding,
    size: size,
  );
}

Offset clampOrbPosition(
  Offset position,
  Size viewport, {
  EdgeInsets padding = EdgeInsets.zero,
  double size = kOrbSize,
}) {
  final left = padding.left + kOrbInset;
  final top = padding.top + kOrbInset;
  final right = viewport.width - size - padding.right - kOrbInset;
  final bottom = viewport.height - size - padding.bottom - kOrbBottomReserve;
  return Offset(
    position.dx.clamp(left, right < left ? left : right),
    position.dy.clamp(top, bottom < top ? top : bottom),
  );
}

Offset snapOrbToEdge(
  Offset position,
  Size viewport, {
  EdgeInsets padding = EdgeInsets.zero,
  double size = kOrbSize,
}) {
  final clamped = clampOrbPosition(position, viewport, padding: padding, size: size);
  final left = padding.left + kOrbInset;
  final right = viewport.width - size - padding.right - kOrbInset;
  if (right <= left) {
    return clamped;
  }
  final x = (clamped.dx - left) <= (right - clamped.dx) ? left : right;
  return Offset(x, clamped.dy);
}

Offset defaultOrbPosition(
  Size viewport, {
  EdgeInsets padding = EdgeInsets.zero,
}) {
  return snapOrbToEdge(Offset(viewport.width, viewport.height), viewport, padding: padding);
}

Offset iconBarPosition(
  Offset orb,
  Size viewport, {
  EdgeInsets padding = EdgeInsets.zero,
  double barWidth = kIconBarWidth,
  double size = kOrbSize,
}) {
  final opensRight = orb.dx + size / 2 < viewport.width / 2;
  final rawX = opensRight ? orb.dx + size + kOrbInset : orb.dx - barWidth - kOrbInset;
  final minX = padding.left + kOrbInset;
  final maxX = viewport.width - barWidth - padding.right - kOrbInset;
  final beside = Offset(
    rawX.clamp(minX, maxX < minX ? minX : maxX),
    (orb.dy - 60).clamp(padding.top + kOrbInset, double.infinity),
  );
  if (!rectsOverlap(
    Rect.fromLTWH(beside.dx, beside.dy, barWidth, kIconBarHeight),
    Rect.fromLTWH(orb.dx, orb.dy, size, size),
  )) {
    return beside;
  }
  return Offset(
    (orb.dx + size / 2 - barWidth / 2).clamp(minX, maxX < minX ? minX : maxX),
    (orb.dy - 60 - kOrbInset).clamp(padding.top + kOrbInset, double.infinity),
  );
}

bool rectsOverlap(Rect a, Rect b) => a.overlaps(b);

Offset? parseSavedOrbPosition(String? raw) {
  if (raw == null || raw.isEmpty) {
    return null;
  }
  try {
    final parsed = jsonDecode(raw);
    if (parsed is! Map) {
      return null;
    }
    final x = parsed["x"];
    final y = parsed["y"];
    if (x is! num || y is! num || !x.isFinite || !y.isFinite) {
      return null;
    }
    return Offset(x.toDouble(), y.toDouble());
  } on FormatException {
    return null;
  }
}

String encodeOrbPosition(Offset position) => jsonEncode({"x": position.dx, "y": position.dy});
