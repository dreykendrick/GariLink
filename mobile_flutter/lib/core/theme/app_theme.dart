import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';
import 'radius.dart';
import 'spacing.dart';
import 'dimensions.dart';

/// AppTheme — GariLink's Material 3 theme builder.
/// Exposes lightTheme and darkTheme for use in MaterialApp.
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme => _buildTheme(brightness: Brightness.light);
  static ThemeData get darkTheme => _buildTheme(brightness: Brightness.dark);

  static ThemeData _buildTheme({required Brightness brightness}) {
    final isDark = brightness == Brightness.dark;
    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: GariLinkColors.primary,
      onPrimary: Colors.white,
      secondary: GariLinkColors.accent,
      onSecondary: Colors.white,
      error: GariLinkColors.error,
      onError: Colors.white,
      surface: isDark ? GariLinkColors.darkSurface : GariLinkColors.surface,
      onSurface: isDark ? GariLinkColors.darkText : GariLinkColors.textPrimary,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      fontFamily: GoogleFonts.inter().fontFamily,
      scaffoldBackgroundColor: isDark
          ? GariLinkColors.darkSurface
          : GariLinkColors.background,
      cardColor: isDark
          ? GariLinkColors.darkSurfaceVariant
          : GariLinkColors.surface,
      dividerColor: isDark ? GariLinkColors.darkBorder : GariLinkColors.border,

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: isDark
            ? GariLinkColors.darkSurface
            : GariLinkColors.surface,
        foregroundColor: isDark
            ? GariLinkColors.darkText
            : GariLinkColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: isDark ? GariLinkColors.darkText : GariLinkColors.textPrimary,
        ),
        iconTheme: IconThemeData(
          color: isDark ? GariLinkColors.darkText : GariLinkColors.textPrimary,
          size: 24,
        ),
        actionsIconTheme: const IconThemeData(
          size: GariLinkDimensions.iconMedium,
        ),
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: isDark
            ? GariLinkColors.darkSurfaceVariant
            : GariLinkColors.surfaceElevated,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GariLinkRadius.dialog),
        ),
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: isDark ? GariLinkColors.darkText : GariLinkColors.textPrimary,
        ),
        contentTextStyle: GoogleFonts.inter(
          fontSize: 14,
          height: 1.45,
          color: isDark
              ? GariLinkColors.darkTextMuted
              : GariLinkColors.textSecondary,
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: GariLinkColors.surfaceElevated,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        dragHandleColor: GariLinkColors.neutral300,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(GariLinkRadius.bottomSheet),
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: GariLinkColors.neutral900,
        contentTextStyle: GoogleFonts.inter(
          color: GariLinkColors.textInverse,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GariLinkRadius.badge),
        ),
      ),

      // Cards
      cardTheme: CardThemeData(
        color: isDark
            ? GariLinkColors.darkSurfaceVariant
            : GariLinkColors.surface,
        elevation: 2,
        shadowColor: GariLinkColors.primary.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GariLinkRadius.card),
        ),
        margin: const EdgeInsets.symmetric(
          horizontal: GariLinkSpacing.lg,
          vertical: GariLinkSpacing.sm,
        ),
      ),

      // Elevated buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: GariLinkColors.accent,
          foregroundColor: Colors.white,
          minimumSize: const Size(
            double.infinity,
            GariLinkDimensions.buttonHeight,
          ),
          padding: const EdgeInsets.symmetric(
            vertical: GariLinkSpacing.md,
            horizontal: GariLinkSpacing.xl,
          ),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(GariLinkRadius.button),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Outlined buttons
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: GariLinkColors.accent,
          minimumSize: const Size(
            double.infinity,
            GariLinkDimensions.buttonHeight,
          ),
          padding: const EdgeInsets.symmetric(
            vertical: GariLinkSpacing.md,
            horizontal: GariLinkSpacing.xl,
          ),
          side: const BorderSide(color: GariLinkColors.accent, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(GariLinkRadius.button),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Text buttons
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: GariLinkColors.accent,
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: GariLinkSpacing.md,
            vertical: GariLinkSpacing.sm,
          ),
        ),
      ),

      // Input fields
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark
            ? GariLinkColors.darkSurfaceVariant
            : GariLinkColors.neutral100,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: GariLinkSpacing.lg,
          vertical: GariLinkSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GariLinkRadius.input),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GariLinkRadius.input),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GariLinkRadius.input),
          borderSide: const BorderSide(color: GariLinkColors.accent, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GariLinkRadius.input),
          borderSide: const BorderSide(color: GariLinkColors.error, width: 1.5),
        ),
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: GariLinkColors.textMuted,
        ),
        labelStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: GariLinkColors.textSecondary,
        ),
        errorMaxLines: 3,
      ),

      // Chip theme
      chipTheme: ChipThemeData(
        backgroundColor: isDark
            ? GariLinkColors.darkSurfaceVariant
            : GariLinkColors.neutral100,
        selectedColor: GariLinkColors.accent,
        labelStyle: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: GariLinkSpacing.md,
          vertical: GariLinkSpacing.xs,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),

      // Bottom nav bar
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: isDark ? GariLinkColors.darkSurface : Colors.white,
        selectedItemColor: GariLinkColors.accent,
        unselectedItemColor: GariLinkColors.textMuted,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w400,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: GariLinkDimensions.bottomNavigationHeight,
        backgroundColor: isDark
            ? GariLinkColors.darkSurface
            : GariLinkColors.surface,
        indicatorColor: GariLinkColors.accentLight,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: GariLinkDimensions.iconMedium,
            color: states.contains(WidgetState.selected)
                ? GariLinkColors.accent
                : GariLinkColors.textMuted,
          ),
        ),
      ),

      // FAB theme
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: GariLinkColors.accent,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: CircleBorder(),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: GariLinkColors.border,
        thickness: 1,
        space: 1,
      ),

      // Text theme
      textTheme: GoogleFonts.interTextTheme(
        TextTheme(
          displayLarge: TextStyle(
            color: isDark
                ? GariLinkColors.darkText
                : GariLinkColors.textPrimary,
          ),
          displayMedium: TextStyle(
            color: isDark
                ? GariLinkColors.darkText
                : GariLinkColors.textPrimary,
          ),
          headlineLarge: TextStyle(
            color: isDark
                ? GariLinkColors.darkText
                : GariLinkColors.textPrimary,
          ),
          headlineMedium: TextStyle(
            color: isDark
                ? GariLinkColors.darkText
                : GariLinkColors.textPrimary,
          ),
          titleLarge: TextStyle(
            color: isDark
                ? GariLinkColors.darkText
                : GariLinkColors.textPrimary,
          ),
          titleMedium: TextStyle(
            color: isDark
                ? GariLinkColors.darkText
                : GariLinkColors.textPrimary,
          ),
          bodyLarge: TextStyle(
            color: isDark
                ? GariLinkColors.darkText
                : GariLinkColors.textPrimary,
          ),
          bodyMedium: TextStyle(
            color: isDark
                ? GariLinkColors.darkTextMuted
                : GariLinkColors.textSecondary,
          ),
          bodySmall: TextStyle(
            color: isDark
                ? GariLinkColors.darkTextMuted
                : GariLinkColors.textMuted,
          ),
        ),
      ),
    );
  }
}
