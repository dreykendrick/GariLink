import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/theme/radius.dart';

class AppLoading extends StatelessWidget {
  final bool isOverlay;

  const AppLoading({
    this.isOverlay = false,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final indicator = CircularProgressIndicator(
      valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.secondary),
    );

    if (isOverlay) {
      return Container(
        color: Colors.black54,
        alignment: Alignment.center,
        child: Container(
          padding: const EdgeInsets.all(GariLinkSpacing.xl),
          decoration: BoxDecoration(
            color: isDark ? GariLinkColors.darkSurface : GariLinkColors.surface,
            borderRadius: GariLinkRadius.cardBorderRadius,
          ),
          child: indicator,
        ),
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(GariLinkSpacing.xl),
        child: indicator,
      ),
    );
  }
}
