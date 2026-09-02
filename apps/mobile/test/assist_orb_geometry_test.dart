import "package:flutter/painting.dart";
import "package:flutter_test/flutter_test.dart";
import "package:managekar/src/widgets/assist_orb_geometry.dart";

void main() {
  const iphone390 = Size(390, 844);
  const iphoneSe = Size(320, 568);

  test("default park snaps to the right edge", () {
    expect(kOrbLongPressMs, 500);
    expect(defaultOrbPosition(iphone390), const Offset(326, 712));
    expect(defaultOrbPosition(iphoneSe), const Offset(256, 436));
  });

  test("tray never covers the disk", () {
    final cases = <(Offset, Size)>[
      (const Offset(8, 400), iphone390),
      (const Offset(326, 400), iphone390),
      (snapOrbToEdge(const Offset(300, 400), iphoneSe), iphoneSe),
    ];
    for (final (orb, bounds) in cases) {
      final bar = iconBarPosition(orb, bounds);
      expect(
        rectsOverlap(
          Rect.fromLTWH(bar.dx, bar.dy, kIconBarWidth, kIconBarHeight),
          Rect.fromLTWH(orb.dx, orb.dy, kOrbSize, kOrbSize),
        ),
        isFalse,
      );
    }
  });

  test("orb hides on the Chats tab only", () {
    expect(orbVisibleOnTab(0), isTrue);
    expect(orbVisibleOnTab(2), isTrue);
    expect(orbVisibleOnTab(3), isFalse);
    expect(orbVisibleOnTab(4), isTrue);
  });

  test("does not stage a center ball on Home", () {
    expect(kHomeOrbSize, 120);
    expect(kHomeBallStageMin, 168);
    expect(shouldStageHomeBall(0, 390), isFalse);
    expect(shouldStageHomeBall(0, 1024), isFalse);
    expect(shouldStageHomeBall(1, 390), isFalse);
    expect(
      homeOrbPositionFromRect(const Rect.fromLTWH(16, 240, 358, 168)),
      const Offset(135, 264),
    );
    expect(homeOrbPosition(iphone390), const Offset(135, 328));
  });

  test("saved positions reject corrupt payloads", () {
    expect(parseSavedOrbPosition('{"x":326,"y":712}'), const Offset(326, 712));
    expect(parseSavedOrbPosition(null), isNull);
    expect(parseSavedOrbPosition("{"), isNull);
    expect(parseSavedOrbPosition('{"y":400}'), isNull);
  });
}
