import 'package:flutter/material.dart';
import 'colors.dart';
import 'radius.dart';
import 'spacing.dart';
import 'shadows.dart';

// Bridge to maintain backward compatibility with Phase A/B files
typedef AppColors = GariLinkColors;
typedef AppSpacing = GariLinkSpacing;
typedef AppBorderRadius = GariLinkRadius;
typedef AppShadows = GariLinkShadows;

class AppLayout {
  static const double screenPadding = GariLinkSpacing.lg;
}
