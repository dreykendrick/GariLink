import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

class GariLinkTypography {
  GariLinkTypography._();

  static TextStyle get largeTitle => GoogleFonts.inter(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    color: GariLinkColors.textPrimary,
    letterSpacing: -1.0,
  );

  static TextStyle get display => largeTitle;
  static TextStyle get pageTitle => titleLarge;
  static TextStyle get sectionTitle => titleMedium;
  static TextStyle get cardTitle =>
      bodyLarge.copyWith(fontWeight: FontWeight.w700, height: 1.2);
  static TextStyle get price => GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w800,
    height: 1.2,
    color: GariLinkColors.accent,
    fontFeatures: const [FontFeature.tabularFigures()],
  );
  static TextStyle get priceCompact => price.copyWith(fontSize: 14);
  static TextStyle get fieldLabel => labelMedium;
  static TextStyle get helper => bodySmall;
  static TextStyle get buttonLabel =>
      GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, height: 1.2);

  static TextStyle get titleLarge => GoogleFonts.inter(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    color: GariLinkColors.textPrimary,
    letterSpacing: -0.5,
  );

  static TextStyle get titleMedium => GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: GariLinkColors.textPrimary,
  );

  static TextStyle get bodyLarge => GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    color: GariLinkColors.textPrimary,
  );

  static TextStyle get bodyMedium => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: GariLinkColors.textSecondary,
  );

  static TextStyle get bodySmall => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: GariLinkColors.textSecondary,
  );

  static TextStyle get labelMedium => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: GariLinkColors.textPrimary,
  );

  static TextStyle get labelSmall => GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: GariLinkColors.textSecondary,
  );
}
