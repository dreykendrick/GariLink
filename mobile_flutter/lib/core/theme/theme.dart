import 'package:flutter/material.dart';
import 'colors.dart';
import 'radius.dart';
import 'spacing.dart';
import 'typography.dart';

class GariLinkTheme {
  GariLinkTheme._();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: GariLinkColors.primary,
      scaffoldBackgroundColor: GariLinkColors.background,
      colorScheme: const ColorScheme.light(
        primary: GariLinkColors.primary,
        secondary: GariLinkColors.accent,
        surface: GariLinkColors.surface,
        background: GariLinkColors.background,
        error: GariLinkColors.error,
        onPrimary: GariLinkColors.secondary,
        onSecondary: GariLinkColors.secondary,
        onSurface: GariLinkColors.textPrimary,
        onBackground: GariLinkColors.textPrimary,
        onError: GariLinkColors.secondary,
        outline: GariLinkColors.border,
      ),
      textTheme: TextTheme(
        headlineLarge: GariLinkTypography.largeTitle,
        titleLarge: GariLinkTypography.titleLarge,
        titleMedium: GariLinkTypography.titleMedium,
        bodyLarge: GariLinkTypography.bodyLarge,
        bodyMedium: GariLinkTypography.bodyMedium,
        bodySmall: GariLinkTypography.bodySmall,
        labelMedium: GariLinkTypography.labelMedium,
        labelSmall: GariLinkTypography.labelSmall,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: GariLinkColors.surface,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: GariLinkColors.textPrimary),
        titleTextStyle: GariLinkTypography.titleMedium,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: GariLinkColors.secondary,
        border: OutlineInputBorder(
          borderRadius: GariLinkRadius.inputBorderRadius,
          borderSide: const BorderSide(color: GariLinkColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: GariLinkRadius.inputBorderRadius,
          borderSide: const BorderSide(color: GariLinkColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: GariLinkRadius.inputBorderRadius,
          borderSide: const BorderSide(color: GariLinkColors.accent, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: GariLinkRadius.inputBorderRadius,
          borderSide: const BorderSide(color: GariLinkColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: GariLinkSpacing.lg,
          vertical: GariLinkSpacing.md,
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    // Premium dark theme configuration (using deep blue/neutral dark)
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: GariLinkColors.primary,
      scaffoldBackgroundColor: const Color(0xFF070F1A), // deeper dark blue background
      colorScheme: const ColorScheme.dark(
        primary: GariLinkColors.accent,
        secondary: GariLinkColors.accent,
        surface: Color(0xFF0F1E33),
        background: Color(0xFF070F1A),
        error: GariLinkColors.error,
        onPrimary: GariLinkColors.primary,
        onSecondary: GariLinkColors.secondary,
        onSurface: Color(0xFFF8FAFC),
        onBackground: Color(0xFFF8FAFC),
        outline: Color(0xFF1E2D4A),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF0F1E33),
        border: OutlineInputBorder(
          borderRadius: GariLinkRadius.inputBorderRadius,
          borderSide: const BorderSide(color: Color(0xFF1E2D4A)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: GariLinkRadius.inputBorderRadius,
          borderSide: const BorderSide(color: Color(0xFF1E2D4A)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: GariLinkRadius.inputBorderRadius,
          borderSide: const BorderSide(color: GariLinkColors.accent, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: GariLinkRadius.inputBorderRadius,
          borderSide: const BorderSide(color: GariLinkColors.error),
        ),
      ),
    );
  }
}
