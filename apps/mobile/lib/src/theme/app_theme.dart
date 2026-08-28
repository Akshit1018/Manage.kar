import "package:flutter/material.dart";

const seed = Color(0xFF2F6BFF);

// Hermes light ("Nous Blue")
const _hermesLightCanvas = Color(0xFFE8F2FD);
const _hermesLightPrimary = Color(0xFF0053FD);
const _hermesLightInk = Color(0xFF170D02);
const _hermesLightCard = Color(0xFFF4F9FE);

// Hermes dark ("Hermes Teal")
const _hermesDarkCanvas = Color(0xFF041C1C);
const _hermesDarkPrimary = Color(0xFF4A86FF);
const _hermesDarkCream = Color(0xFFFFE6CB);
const _hermesDarkCard = Color(0xFF0A2A2A);

String normalizeSkin(Object? value) => value == "classic" ? "classic" : "hermes";

ThemeData buildAppTheme({
  Brightness brightness = Brightness.light,
  String fontSize = "medium",
  String skin = "hermes",
}) {
  final scale = switch (fontSize) {
    "small" => 0.9,
    "large" => 1.15,
    "medium" => 1.0,
    _ => 1.0,
  };
  final hermes = normalizeSkin(skin) == "hermes";
  final ColorScheme colorScheme;
  if (!hermes) {
    colorScheme = ColorScheme.fromSeed(seedColor: seed, brightness: brightness);
  } else if (brightness == Brightness.light) {
    colorScheme = ColorScheme.fromSeed(
      seedColor: _hermesLightPrimary,
      brightness: Brightness.light,
    ).copyWith(
      primary: _hermesLightPrimary,
      onPrimary: Colors.white,
      surface: _hermesLightCanvas,
      onSurface: _hermesLightInk,
      surfaceContainerLowest: Colors.white,
      surfaceContainerLow: _hermesLightCard,
      surfaceContainer: _hermesLightCard,
      surfaceContainerHigh: _hermesLightCard,
      surfaceContainerHighest: _hermesLightCard,
    );
  } else {
    colorScheme = ColorScheme.fromSeed(
      seedColor: _hermesDarkPrimary,
      brightness: Brightness.dark,
    ).copyWith(
      primary: _hermesDarkPrimary,
      // White on #4A86FF fails WCAG contrast; the dark canvas passes.
      onPrimary: _hermesDarkCanvas,
      surface: _hermesDarkCanvas,
      onSurface: _hermesDarkCream,
      surfaceContainerLowest: _hermesDarkCanvas,
      surfaceContainerLow: _hermesDarkCard,
      surfaceContainer: _hermesDarkCard,
      surfaceContainerHigh: _hermesDarkCard,
      surfaceContainerHighest: _hermesDarkCard,
    );
  }
  final base = ThemeData(
    colorScheme: colorScheme,
    useMaterial3: true,
    inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
  );
  return base.copyWith(
    scaffoldBackgroundColor: colorScheme.surface,
    cardColor: hermes
        ? (brightness == Brightness.light ? _hermesLightCard : _hermesDarkCard)
        : base.cardColor,
    textTheme: base.textTheme.apply(fontSizeFactor: scale),
    visualDensity: VisualDensity.standard,
  );
}

ThemeMode themeModeFrom(String? value) {
  switch (value) {
    case "light":
      return ThemeMode.light;
    case "dark":
      return ThemeMode.dark;
    case "system":
      return ThemeMode.system;
    default:
      return ThemeMode.system;
  }
}
