import 'package:flutter/material.dart';
import '../../core/theme/tokens.dart';

class AppLoading extends StatelessWidget {
  final bool isOverlay;

  const AppLoading({
    this.isOverlay = false,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final indicator = CircularProgressIndicator(
      valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
    );

    if (isOverlay) {
      return Container(
        color: Colors.black54,
        alignment: Alignment.center,
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: BoxDecoration(
            color: theme.brightness == Brightness.dark
                ? AppColors.darkSurface
                : AppColors.neutral[0],
            borderRadius: AppBorderRadius.mdBorderRadius,
          ),
          child: indicator,
        ),
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: indicator,
      ),
    );
  }
}
