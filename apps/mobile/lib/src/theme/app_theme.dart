import "package:flutter/material.dart";

ThemeData buildAppTheme() {
  const seed = Color(0xFF2F6BFF);
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.light),
    useMaterial3: true,
    inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
  );
}
