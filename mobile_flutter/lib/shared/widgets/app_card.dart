import 'package:flutter/material.dart';
import '../../core/theme/tokens.dart';

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

    final defaultBg = isDark ? AppColors.darkCard : AppColors.neutral[0];
    final defaultBorder = Border.all(
      color: isDark ? AppColors.darkBorder : AppColors.neutral[100]!,
      width: 1,
    );

    Widget cardContent = Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.base),
      decoration: BoxDecoration(
        color: backgroundColor ?? defaultBg,
        borderRadius: AppBorderRadius.mdBorderRadius,
        border: border ?? defaultBorder,
        boxShadow: const [AppShadows.sm],
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
