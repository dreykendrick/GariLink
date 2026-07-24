import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary — GariLink Blue
  static const Map<int, Color> primary = {
    50: Color(0xFFEFF6FF),
    100: Color(0xFFDBEAFE),
    200: Color(0xFFBFDBFE),
    300: Color(0xFF93C5FD),
    400: Color(0xFF60A5FA),
    500: Color(0xFF3B82F6),
    600: Color(0xFF2563EB),
    700: Color(0xFF1D4ED8),
    800: Color(0xFF1E40AF),
    900: Color(0xFF1E3A8A),
  };

  // Secondary — Amber
  static const Map<int, Color> secondary = {
    50: Color(0xFFFFFBEB),
    100: Color(0xFFFEF3C7),
    200: Color(0xFFFDE68A),
    300: Color(0xFFFCD34D),
    400: Color(0xFFFBBF24),
    500: Color(0xFFF59E0B),
    600: Color(0xFFD97706),
    700: Color(0xFFB45309),
    800: Color(0xFF92400E),
    900: Color(0xFF78350F),
  };

  // Success
  static const Map<int, Color> success = {
    50: Color(0xFFF0FDF4),
    500: Color(0xFF22C55E),
    700: Color(0xFF15803D),
  };

  // Error
  static const Map<int, Color> error = {
    50: Color(0xFFFEF2F2),
    500: Color(0xFFEF4444),
    700: Color(0xFFB91C1C),
  };

  // Warning
  static const Map<int, Color> warning = {
    50: Color(0xFFFFFBEB),
    500: Color(0xFFF59E0B),
    700: Color(0xFFB45309),
  };

  // Neutrals
  static const Map<int, Color> neutral = {
    0: Color(0xFFFFFFFF),
    50: Color(0xFFF8FAFC),
    100: Color(0xFFF1F5F9),
    200: Color(0xFFE2E8F0),
    300: Color(0xFFCBD5E1),
    400: Color(0xFF94A3B8),
    500: Color(0xFF64748B),
    600: Color(0xFF475569),
    700: Color(0xFF334155),
    800: Color(0xFF1E293B),
    900: Color(0xFF0F172A),
    950: Color(0xFF020617),
  };

  // Dark Mode Surfaces
  static const Color darkBg = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkCard = Color(0xFF253347);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkText = Color(0xFFF8FAFC);
  static const Color darkTextMuted = Color(0xFF94A3B8);
}

class AppSpacing {
  AppSpacing._();

  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double base = 16.0;
  static const double lg = 20.0;
  static const double xl = 24.0;
  static const double xx2l = 32.0;
  static const double xx3l = 40.0;
  static const double xx4l = 48.0;
  static const double xx5l = 64.0;
}

class AppBorderRadius {
  AppBorderRadius._();

  static const double sm = 6.0;
  static const double md = 10.0;
  static const double lg = 14.0;
  static const double xl = 20.0;
  static const double full = 9999.0;

  static BorderRadius get smBorderRadius => BorderRadius.circular(sm);
  static BorderRadius get mdBorderRadius => BorderRadius.circular(md);
  static BorderRadius get lgBorderRadius => BorderRadius.circular(lg);
  static BorderRadius get xlBorderRadius => BorderRadius.circular(xl);
  static BorderRadius get fullBorderRadius => BorderRadius.circular(full);
}

class AppShadows {
  AppShadows._();

  static const BoxShadow sm = BoxShadow(
    color: Color(0x0D000000),
    offset: Offset(0, 1),
    blurRadius: 2,
    spreadRadius: 0,
  );

  static const BoxShadow md = BoxShadow(
    color: Color(0x14000000),
    offset: Offset(0, 4),
    blurRadius: 8,
    spreadRadius: 0,
  );

  static const BoxShadow lg = BoxShadow(
    color: Color(0x1F000000),
    offset: Offset(0, 8),
    blurRadius: 16,
    spreadRadius: 0,
  );
}

class AppLayout {
  AppLayout._();

  static const double screenPadding = AppSpacing.base;
}
