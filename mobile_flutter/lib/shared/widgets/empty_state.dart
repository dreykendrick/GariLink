import 'package:flutter/material.dart';
import '../../core/theme/tokens.dart';

class EmptyState extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;

  const EmptyState({
    required this.title,
    required this.description,
    this.icon = Icons.info_outline,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: isDark ? AppColors.darkTextMuted : AppColors.neutral[400],
            ),
            const SizedBox(height: AppSpacing.base),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              description,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isDark ? AppColors.darkTextMuted : AppColors.neutral[500],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
