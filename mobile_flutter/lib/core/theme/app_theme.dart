import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'tokens.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: AppColors.primary[600],
      scaffoldBackgroundColor: AppColors.neutral[50],
      colorScheme: ColorScheme.light(
        primary: AppColors.primary[600]!,
        secondary: AppColors.primary[500]!,
        surface: AppColors.neutral[0]!,
        background: AppColors.neutral[50]!,
        error: AppColors.error[500]!,
        onPrimary: AppColors.neutral[0]!,
        onSecondary: AppColors.neutral[0]!,
        onSurface: AppColors.neutral[900]!,
        onBackground: AppColors.neutral[900]!,
        onError: AppColors.neutral[0]!,
        outline: AppColors.neutral[200]!,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).copyWith(
        titleLarge: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.neutral[900],
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.neutral[900],
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 15,
          color: AppColors.neutral[800],
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 13,
          color: AppColors.neutral[600],
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.neutral[50],
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: AppColors.neutral[900]),
        titleTextStyle: GoogleFonts.inter(
          color: AppColors.neutral[900],
          fontSize: 17,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.neutral[0],
        border: OutlineInputBorder(
          borderRadius: AppBorderRadius.mdBorderRadius,
          borderSide: BorderSide(color: AppColors.neutral[200]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppBorderRadius.mdBorderRadius,
          borderSide: BorderSide(color: AppColors.neutral[200]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppBorderRadius.mdBorderRadius,
          borderSide: BorderSide(color: AppColors.primary[500]!, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppBorderRadius.mdBorderRadius,
          borderSide: BorderSide(color: AppColors.error[500]!),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.base,
          vertical: AppSpacing.md,
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: AppColors.primary[500],
      scaffoldBackgroundColor: AppColors.darkBg,
      colorScheme: ColorScheme.dark(
        primary: AppColors.primary[500]!,
        secondary: AppColors.primary[400]!,
        surface: AppColors.darkSurface,
        background: AppColors.darkBg,
        error: AppColors.error[500]!,
        onPrimary: AppColors.neutral[950]!,
        onSecondary: AppColors.neutral[950]!,
        onSurface: AppColors.darkText,
        onBackground: AppColors.darkText,
        onError: AppColors.neutral[0]!,
        outline: AppColors.darkBorder,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        titleLarge: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.darkText,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.darkText,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 15,
          color: AppColors.darkText,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 13,
          color: AppColors.darkTextMuted,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkBg,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.darkText),
        titleTextStyle: GoogleFonts.inter(
          color: AppColors.darkText,
          fontSize: 17,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurface,
        border: OutlineInputBorder(
          borderRadius: AppBorderRadius.mdBorderRadius,
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppBorderRadius.mdBorderRadius,
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppBorderRadius.mdBorderRadius,
          borderSide: BorderSide(color: AppColors.primary[500]!, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppBorderRadius.mdBorderRadius,
          borderSide: BorderSide(color: AppColors.error[500]!),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.base,
          vertical: AppSpacing.md,
        ),
      ),
    );
  }
}
