import 'package:flutter/material.dart';

class GariLinkAnimations {
  GariLinkAnimations._();

  static const Duration instant = Duration(milliseconds: 80);
  static const Duration short = Duration(milliseconds: 160);
  static const Duration standard = Duration(milliseconds: 240);
  static const Duration emphasized = Duration(milliseconds: 360);

  // Compatibility aliases for existing components.
  static const Duration fast = short;
  static const Duration normal = standard;
  static const Duration slow = emphasized;

  static const Curve feedbackCurve = Curves.easeOut;
  static const Curve defaultCurve = Curves.easeInOutCubic;
  static const Curve premiumCurve = Curves.fastOutSlowIn;

  static bool reduceMotion(BuildContext context) =>
      MediaQuery.maybeOf(context)?.disableAnimations ?? false;

  static Duration duration(BuildContext context, Duration preferred) =>
      reduceMotion(context) ? Duration.zero : preferred;

  // Custom Page transition builder
  static PageRouteBuilder<T> fadePageRoute<T>({required Widget page}) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(opacity: animation, child: child);
      },
      transitionDuration: standard,
      reverseTransitionDuration: short,
    );
  }
}
