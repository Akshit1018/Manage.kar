import "package:flutter/material.dart";

const seed = Color(0xFF2F6BFF);

ThemeData buildAppTheme({Brightness brightness = Brightness.light, String fontSize = "medium"}) {
  final scale = switch (fontSize) {
    "small" => 0.9,
    "large" => 1.15,
    "medium" => 1.0,
    _ => 1.0,
  };
  final base = ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: brightness),
    useMaterial3: true,
    inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
  );
  return base.copyWith(
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
