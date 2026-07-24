import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/radius.dart';
import '../../core/theme/spacing.dart';
import '../../core/theme/shadows.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final Border? border;
  final VoidCallback? onTap;

  const AppCard({
    required this.child,
    this.padding,
    this.backgroundColor,
    this.border,
    this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final defaultBg = isDark ? const Color(0xFF0F1E33) : GariLinkColors.surface;
    final defaultBorder = Border.all(
      color: isDark ? const Color(0xFF1E2D4A) : GariLinkColors.border,
      width: 1,
    );

    Widget cardContent = Container(
      padding: padding ?? const EdgeInsets.all(GariLinkSpacing.lg),
      decoration: BoxDecoration(
        color: backgroundColor ?? defaultBg,
        borderRadius: GariLinkRadius.cardBorderRadius,
        border: border ?? defaultBorder,
        boxShadow: const [GariLinkShadows.card],
      ),
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: cardContent,
      );
    }

    return cardContent;
  }
}
