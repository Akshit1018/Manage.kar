import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:managekar/src/theme/app_theme.dart";

void main() {
  group("normalizeSkin", () {
    test("returns hermes for null, empty, and unknown values", () {
      expect(normalizeSkin(null), "hermes");
      expect(normalizeSkin(""), "hermes");
      expect(normalizeSkin("x"), "hermes");
      expect(normalizeSkin(42), "hermes");
    });

    test("returns classic, white, and black when chosen", () {
      expect(normalizeSkin("classic"), "classic");
      expect(normalizeSkin("white"), "white");
      expect(normalizeSkin("black"), "black");
    });
  });

  group("hermes skin", () {
    test("light theme uses Nous Blue palette", () {
      final theme = buildAppTheme();
      expect(theme.scaffoldBackgroundColor, const Color(0xFFE8F2FD));
      expect(theme.colorScheme.primary, const Color(0xFF0053FD));
    });

    test("dark theme uses Hermes Teal palette with dark onPrimary", () {
      final theme = buildAppTheme(brightness: Brightness.dark);
      expect(theme.colorScheme.surface, const Color(0xFF041C1C));
      expect(theme.colorScheme.primary, const Color(0xFF4A86FF));
      expect(theme.colorScheme.onPrimary.computeLuminance(), lessThan(0.5));
    });
  });

  group("classic skin", () {
    test("light primary matches the old seeded scheme", () {
      final theme = buildAppTheme(skin: "classic");
      final expected = ColorScheme.fromSeed(seedColor: const Color(0xFF2F6BFF));
      expect(theme.colorScheme.primary, expected.primary);
    });
  });

  group("white and black skins", () {
    test("white stays paper even when brightness is dark", () {
      final theme = buildAppTheme(skin: "white", brightness: Brightness.dark);
      expect(theme.scaffoldBackgroundColor, Colors.white);
      expect(theme.colorScheme.onSurface, const Color(0xFF170D02));
    });

    test("black stays ink even when brightness is light", () {
      final theme = buildAppTheme(skin: "black", brightness: Brightness.light);
      expect(theme.scaffoldBackgroundColor, Colors.black);
      expect(theme.colorScheme.onSurface, const Color(0xFFF5F5F5));
    });
  });
}
